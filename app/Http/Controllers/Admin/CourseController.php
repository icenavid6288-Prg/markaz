<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $courses = Course::query()
            ->with(['instructor.user', 'category'])
            ->when($request->search, fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->when($request->status === 'published', fn ($q) => $q->where('is_published', true))
            ->when($request->status === 'draft', fn ($q) => $q->where('is_published', false))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Courses/Index', [
            'courses' => $courses,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Courses/Form', [
            'course' => null,
            'categories' => Category::where('type', 'course')->get(['id', 'name']),
            'instructors' => Instructor::with('user')->get(['id', 'user_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        unset($validated['thumbnail_file']);
        $validated['seo'] = $this->seoPayload($validated);

        $course = Course::create($validated);
        $this->storeUploadedThumbnail($request, $course);

        return redirect()->route('admin.courses.index')->with('success', 'دوره با موفقیت ایجاد شد.');
    }

    public function edit(Course $course): Response
    {
        return Inertia::render('Admin/Courses/Form', [
            'course' => $course,
            'categories' => Category::where('type', 'course')->get(['id', 'name']),
            'instructors' => Instructor::with('user')->get(['id', 'user_id']),
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $this->validated($request);
        unset($validated['thumbnail_file']);
        $validated['seo'] = $this->seoPayload($validated, $course);

        $course->update($validated);
        $this->storeUploadedThumbnail($request, $course);

        return redirect()->route('admin.courses.index')->with('success', 'دوره با موفقیت به‌روزرسانی شد.');
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return back()->with('success', 'دوره حذف شد.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructor_id' => ['nullable', 'exists:instructors,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'level' => ['required', 'in:beginner,intermediate,advanced'],
            'price' => ['required', 'integer', 'min:0'],
            'discount_price' => ['nullable', 'integer', 'min:0'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'thumbnail' => ['nullable', 'string', 'max:500'],
            'thumbnail_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
            'trailer_url' => ['nullable', 'string', 'max:500'],
            'certificate_enabled' => ['boolean'],
            'is_published' => ['boolean'],
            'is_featured' => ['boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'seo_keywords' => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']).'-'.Str::lower(Str::random(4));
        }

        return $data;
    }

    /**
     * Fold the flat seo_* form fields into the course's `seo` JSON column.
     * Empty fields are auto-generated from the course content so every public
     * course ships with a unique, keyword-friendly meta description.
     *
     * @param array<string, mixed> $data
     * @return array{title: string, description: string, keywords: string}
     */
    private function seoPayload(array $data, ?Course $course = null): array
    {
        $previous = is_array($course?->seo) ? $course->seo : [];
        $title = trim((string) ($data['seo_title'] ?? $previous['title'] ?? ''));
        $description = trim((string) ($data['seo_description'] ?? $previous['description'] ?? ''));
        $keywords = trim((string) ($data['seo_keywords'] ?? $previous['keywords'] ?? ''));

        $courseTitle = (string) ($data['title'] ?? $course?->title ?? '');
        $courseSubtitle = (string) ($data['subtitle'] ?? $course?->subtitle ?? '');
        $courseDescription = (string) ($data['description'] ?? $course?->description ?? '');
        $siteName = (string) \App\Models\Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');

        $cleanDescription = preg_replace('/\s+/', ' ', trim($courseDescription)) ?: '';
        $autoTitle = $courseSubtitle !== '' ? "{$courseTitle} | {$courseSubtitle}" : $courseTitle;
        $autoTitle = trim($autoTitle) !== '' ? $autoTitle : $courseTitle;

        return [
            'title' => $title !== '' ? $title : (mb_strlen($autoTitle) <= 55 ? $autoTitle.' | '.$siteName : mb_substr($autoTitle, 0, 60)),
            'description' => $description !== '' ? $description : ($cleanDescription !== '' ? mb_substr($cleanDescription, 0, 165) : mb_substr($courseTitle, 0, 165)),
            'keywords' => $keywords !== '' ? $keywords : mb_substr($courseTitle, 0, 120),
        ];
    }

    private function storeUploadedThumbnail(Request $request, Course $course): void
    {
        $file = $request->file('thumbnail_file');
        if (! $file || ! $file->isValid()) {
            return;
        }

        $directory = public_path('images/courses');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $prefix = 'course-'.$course->getKey().'-thumbnail';
        foreach (glob($directory.'/'.$prefix.'.*') ?: [] as $oldFile) {
            if (is_file($oldFile)) {
                @unlink($oldFile);
            }
        }

        $extension = strtolower($file->extension() ?: 'jpg');
        $file->move($directory, $prefix.'.'.$extension);
        $course->update(['thumbnail' => '/images/courses/'.$prefix.'.'.$extension]);
    }
}
