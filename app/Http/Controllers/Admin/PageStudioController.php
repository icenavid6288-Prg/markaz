<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\PageContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageStudioController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('manage all') || $request->user()?->can('view pages'), 403);

        return Inertia::render('Admin/SitePages/Index', [
            'pages' => collect(PageContent::all())->map(fn (array $page) => [
                'key' => $page['key'],
                'label' => $page['label'],
                'path' => $page['path'],
                'icon' => $page['icon'],
                'field_count' => count($page['fields']),
            ])->values()->all(),
        ]);
    }

    public function edit(Request $request, string $page): Response
    {
        abort_unless($request->user()?->can('manage all') || $request->user()?->can('view pages'), 403);
        abort_unless(array_key_exists($page, PageContent::registry()), 404);

        return Inertia::render('Admin/SitePages/Edit', [
            'page' => PageContent::get($page),
        ]);
    }

    public function update(Request $request, string $page): RedirectResponse
    {
        abort_unless($request->user()?->can('manage all') || $request->user()?->can('update pages'), 403);
        abort_unless(array_key_exists($page, PageContent::registry()), 404);

        $validated = $request->validate([
            'fields' => ['required', 'array'],
            'fields.*' => ['nullable', 'max:10000'],
        ]);

        $fields = $validated['fields'];

        // An empty image value explicitly removes the previous image from the page.
        foreach (PageContent::registry()[$page]['fields'] as $key => $field) {
            if (($field['type'] ?? '') !== 'image' || (($fields[$key] ?? null) !== '' && $fields[$key] !== null)) {
                continue;
            }

            $directory = public_path('images');
            foreach (glob($directory.'/'.$page.'-'.$key.'.*') ?: [] as $oldFile) {
                if (is_file($oldFile)) {
                    @unlink($oldFile);
                }
            }
        }

        // Image-type fields accept a file upload; store it in public/images so
        // shared hosts render it without a storage symlink (same as site settings).
        foreach (PageContent::registry()[$page]['fields'] as $key => $field) {
            if (($field['type'] ?? '') !== 'image') {
                continue;
            }

            $file = $request->file('fields.'.$key);
            if (! $file || ! $file->isValid()) {
                continue;
            }

            $request->validate(['fields.'.$key => ['file', 'mimes:png,jpg,jpeg,webp', 'max:8192']]);

            $extension = strtolower($file->extension() ?: 'jpg');
            $filename = $page.'-'.$key.'.'.$extension;
            $directory = public_path('images');

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            foreach (glob($directory.'/'.$page.'-'.$key.'.*') ?: [] as $oldFile) {
                if (is_file($oldFile)) {
                    @unlink($oldFile);
                }
            }
            $file->move($directory, $filename);
            $fields[$key] = '/images/'.$filename;
        }

        PageContent::save($page, $fields);

        return redirect()->route('admin.site-pages.edit', $page)->with('success', 'محتوای صفحه با موفقیت ذخیره شد.');
    }
}
