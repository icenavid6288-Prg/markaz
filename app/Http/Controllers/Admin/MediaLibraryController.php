<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Support\SafeStoragePath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaLibraryController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAction($request, 'view media');

        $search = trim((string) $request->string('search'));
        $type = trim((string) $request->string('type'));

        $query = Media::query()
            ->with(['uploader:id,name', 'versions'])
            ->whereNull('parent_id')
            ->latest();

        if ($search !== '') {
            $query->where(function ($nested) use ($search): void {
                $nested->where('name', 'like', "%{$search}%")
                    ->orWhere('file_name', 'like', "%{$search}%")
                    ->orWhere('alt', 'like', "%{$search}%")
                    ->orWhere('folder', 'like', "%{$search}%");
            });
        }
        if (in_array($type, ['image', 'video', 'audio', 'document'], true)) {
            $query->where('type', $type);
        }

        $items = $query->paginate(18)->withQueryString();

        return Inertia::render('Admin/Media/Index', [
            'filters' => ['search' => $search, 'type' => $type],
            'canCreate' => $this->can($request, 'create media'),
            'canUpdate' => $this->can($request, 'update media'),
            'canDelete' => $this->can($request, 'delete media'),
            'items' => $items->through(fn (Media $media) => $this->present($media)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAction($request, 'create media');
        $data = $request->validate([
            'file' => ['required', 'file', 'max:51200', 'mimes:jpg,jpeg,png,webp,gif,pdf,mp3,ogg,mp4,zip'],
            'name' => ['nullable', 'string', 'max:255'],
            'alt' => ['nullable', 'string', 'max:255'],
            'folder' => ['nullable', 'string', 'max:120'],
            'collection' => ['nullable', 'string', 'max:80'],
        ]);

        $file = $request->file('file');
        abort_unless($file instanceof UploadedFile && $file->isValid(), 422, 'فایل معتبر نیست.');

        $media = Media::create([
            'name' => $data['name'] ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'disk' => 'public',
            'size' => (int) $file->getSize(),
            'folder' => $data['folder'] ?? 'library',
            'url_path' => '/storage/media/pending',
            'alt' => $data['alt'] ?? null,
            'type' => Media::typeFromMime($file->getMimeType()),
            'collection' => $data['collection'] ?: 'default',
            'version' => 1,
            'is_current' => true,
            'uploaded_by' => $request->user()->id,
        ]);

        $path = $this->storeFile($media, $file, 1);
        $media->update(['url_path' => '/storage/'.$path]);

        return back()->with('success', 'رسانه در کتابخانه ذخیره شد.');
    }

    public function replace(Request $request, Media $media): RedirectResponse
    {
        $this->authorizeAction($request, 'update media');
        abort_unless($media->parent_id === null, 404);
        $request->validate([
            'file' => ['required', 'file', 'max:51200', 'mimes:jpg,jpeg,png,webp,gif,pdf,mp3,ogg,mp4,zip'],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);
        $file = $request->file('file');
        abort_unless($file instanceof UploadedFile && $file->isValid(), 422, 'فایل معتبر نیست.');

        $snapshot = $media->replicate(['versions']);
        $snapshot->parent_id = $media->id;
        $snapshot->is_current = false;
        $snapshot->created_at = $media->updated_at ?? $media->created_at;
        $snapshot->save();

        $nextVersion = (int) $media->version + 1;
        $path = $this->storeFile($media, $file, $nextVersion);
        $media->update([
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => (int) $file->getSize(),
            'url_path' => '/storage/'.$path,
            'type' => Media::typeFromMime($file->getMimeType()),
            'alt' => $request->filled('alt') ? $request->string('alt')->toString() : $media->alt,
            'version' => $nextVersion,
            'is_current' => true,
            'uploaded_by' => $request->user()->id,
        ]);

        return back()->with('success', "نسخه {$nextVersion} جایگزین نسخه قبلی شد. شناسه رسانه ثابت ماند.");
    }

    public function destroy(Request $request, Media $media): RedirectResponse
    {
        $this->authorizeAction($request, $media->parent_id ? 'update media' : 'delete media');

        $family = Media::query()
            ->where('id', $media->familyRootId())
            ->orWhere('parent_id', $media->familyRootId())
            ->get();

        if ($media->parent_id) {
            $this->deleteStoredFile($media);
            $media->delete();

            return back()->with('success', 'نسخه قدیمی حذف شد.');
        }

        foreach ($family as $item) {
            $this->deleteStoredFile($item);
            $item->delete();
        }

        return back()->with('success', 'رسانه و نسخه‌های آن حذف شد.');
    }

    private function storeFile(Media $media, UploadedFile $file, int $version): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $name = 'v'.$version.'-'.Str::lower(Str::random(8)).'.'.$extension;
        $directory = 'media/'.$media->familyRootId();

        return Storage::disk('public')->putFileAs($directory, $file, $name);
    }

    private function deleteStoredFile(Media $media): void
    {
        $path = SafeStoragePath::normalize(preg_replace('#^/storage/#', '', (string) $media->url_path));
        if ($path) {
            Storage::disk($media->disk ?: 'public')->delete($path);
        }
    }

    /** @return array<string, mixed> */
    private function present(Media $media): array
    {
        return [
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'url_path' => $media->url_path,
            'type' => $media->type,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'folder' => $media->folder,
            'alt' => $media->alt,
            'collection' => $media->collection,
            'version' => $media->version,
            'uploader' => $media->uploader?->name,
            'updated_at' => $media->updated_at?->toISOString(),
            'versions' => $media->versions->map(fn (Media $version) => [
                'id' => $version->id,
                'version' => $version->version,
                'file_name' => $version->file_name,
                'url_path' => $version->url_path,
                'size' => $version->size,
                'updated_at' => $version->updated_at?->toISOString(),
            ])->values(),
        ];
    }

    private function authorizeAction(Request $request, string $permission): void
    {
        abort_unless($this->can($request, $permission), 403);
    }

    private function can(Request $request, string $permission): bool
    {
        return (bool) ($request->user()?->can('manage all') || $request->user()?->can($permission));
    }
}
