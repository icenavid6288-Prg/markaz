<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Lesson;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $query = Assignment::query()
            ->with(['course:id,title', 'lesson:id,title,type,module_id'])
            ->withCount('submissions')
            ->withCount(['submissions as graded_count' => fn ($nested) => $nested->where('status', 'graded')]);

        if ($search !== '') {
            $query->where(function ($nested) use ($search) {
                $nested->where('title', 'like', "%{$search}%")
                    ->orWhereHas('lesson', fn ($lesson) => $lesson->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($course) => $course->where('title', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('Admin/Assignments/Index', [
            'assignments' => $query->latest()->paginate(15)->withQueryString()->through(fn (Assignment $assignment) => $this->presentAssignment($assignment)),
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Assignments/Form', [
            'assignment' => null,
            'lessons' => $this->lessonOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $lesson = Lesson::findOrFail($data['lesson_id']);
        $assignment = Assignment::create([...$data, 'course_id' => $lesson->course_id]);

        return redirect()->route('admin.assignments.edit', $assignment)->with('success', 'تکلیف ساخته شد.');
    }

    public function edit(Assignment $assignment): Response
    {
        return Inertia::render('Admin/Assignments/Form', [
            'assignment' => $this->presentAssignment($assignment),
            'lessons' => $this->lessonOptions(),
        ]);
    }

    public function update(Request $request, Assignment $assignment): RedirectResponse
    {
        $data = $this->validated($request);
        $lesson = Lesson::findOrFail($data['lesson_id']);
        $assignment->update([...$data, 'course_id' => $lesson->course_id]);

        return back()->with('success', 'تکلیف به‌روزرسانی شد.');
    }

    public function destroy(Assignment $assignment): RedirectResponse
    {
        $assignment->delete();

        return back()->with('success', 'تکلیف حذف شد.');
    }

    public function submissions(Request $request, Assignment $assignment): Response
    {
        $assignment->load(['course:id,title', 'lesson:id,title']);
        $status = (string) $request->string('status');
        $search = trim((string) $request->string('search'));

        $query = Submission::query()
            ->with('user:id,name,email')
            ->where('assignment_id', $assignment->id);

        if (in_array($status, ['submitted', 'graded'], true)) {
            $query->where('status', $status);
        } else {
            $status = '';
        }

        if ($search !== '') {
            $query->whereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return Inertia::render('Admin/Assignments/Submissions', [
            'assignment' => $this->presentAssignment($assignment),
            'submissions' => $query->latest('submitted_at')->paginate(15)->withQueryString()->through(fn (Submission $submission) => $this->presentSubmission($submission)),
            'filters' => ['status' => $status, 'search' => $search],
        ]);
    }

    public function grade(Request $request, Assignment $assignment, Submission $submission): RedirectResponse
    {
        abort_unless($submission->assignment_id === $assignment->id, 404);

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $submission->update([
            'score' => (int) $validated['score'],
            'feedback' => trim((string) ($validated['feedback'] ?? '')) ?: null,
            'status' => 'graded',
        ]);

        return back()->with('success', 'نمره و بازخورد تکلیف ثبت شد.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'max_score' => ['required', 'integer', 'min:1', 'max:100'],
            'due_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);
    }

    /** @return array<int, array{id: int, label: string}> */
    private function lessonOptions(): array
    {
        return Lesson::query()
            ->with(['course:id,title', 'module:id,title'])
            ->orderBy('course_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'label' => trim(($lesson->course?->title ?? 'بدون دوره').' — '.($lesson->module?->title ?? '').' — '.$lesson->title, ' —'),
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function presentAssignment(Assignment $assignment): array
    {
        $submissionsCount = (int) ($assignment->submissions_count ?? $assignment->submissions()->count());
        $gradedCount = (int) ($assignment->graded_count ?? 0);

        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'lesson_id' => $assignment->lesson_id,
            'lesson' => $assignment->lesson ? ['id' => $assignment->lesson->id, 'title' => $assignment->lesson->title] : null,
            'course' => $assignment->course ? ['id' => $assignment->course->id, 'title' => $assignment->course->title] : null,
            'max_score' => (int) $assignment->max_score,
            'due_days' => $assignment->due_days,
            'submissions_count' => $submissionsCount,
            'graded_count' => $gradedCount,
            'pending_count' => max(0, $submissionsCount - $gradedCount),
            'created_at' => $assignment->created_at?->format('Y/m/d'),
        ];
    }

    /** @return array<string, mixed> */
    private function presentSubmission(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'user' => $submission->user ? ['id' => $submission->user->id, 'name' => $submission->user->name, 'email' => $submission->user->email] : null,
            'content' => $submission->content,
            'attachment' => $submission->attachment,
            'attachment_url' => $submission->attachment ? route('learning.assignment.download', $submission) : null,
            'status' => $submission->status,
            'score' => $submission->score,
            'feedback' => $submission->feedback,
            'submitted_at' => $submission->submitted_at?->format('Y/m/d H:i'),
        ];
    }
}
