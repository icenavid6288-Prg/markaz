<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    /**
     * Store the student's submission (text and/or file) for the lesson's
     * assignment. Submitting completes the lesson — exactly like passing a
     * quiz — so the next lessons unlock. The grade is applied later by an
     * admin/instructor in the admin panel.
     */
    public function submit(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        abort_unless($lesson->course_id === $course->id, 404);
        Enrollment::query()->where('user_id', $request->user()->id)->where('course_id', $course->id)->firstOrFail();

        $assignment = $lesson->assignments()->first();
        abort_unless($assignment, 404);

        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:20000'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,zip,png,jpg,jpeg,webp', 'max:10240'],
        ]);

        $content = trim((string) ($validated['content'] ?? ''));
        abort_if($content === '' && ! $request->hasFile('attachment'), 422, 'متن یا فایل تکلیف را وارد کنید.');

        $submission = Submission::query()
            ->where('assignment_id', $assignment->id)
            ->where('user_id', $request->user()->id)
            ->first();

        // A graded submission is final — the student cannot silently overwrite feedback.
        abort_if($submission && $submission->status === 'graded', 422, 'این تکلیف قبلاً تصحیح شده است و قابل ارسال مجدد نیست.');

        $attachment = $submission?->attachment;
        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment')->store('assignments/'.$request->user()->id, 'local');
        }

        Submission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $request->user()->id],
            [
                'content' => $content,
                'attachment' => $attachment,
                'status' => 'submitted',
                'score' => null,
                'feedback' => null,
                'submitted_at' => now(),
            ]
        );

        $this->markLessonCompleted($request, $course, $lesson);

        return back()->with('success', 'تکلیف شما ثبت شد و برای تصحیح ارسال گردید.');
    }

    private function markLessonCompleted(Request $request, Course $course, Lesson $lesson): void
    {
        LessonProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['status' => 'completed', 'progress_percent' => 100, 'completed_at' => now()],
        );

        $total = max(1, Lesson::where('course_id', $course->id)->count());
        $completed = LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('lesson_id', Lesson::where('course_id', $course->id)->pluck('id'))
            ->where('status', 'completed')
            ->count();
        $courseProgress = (int) round(($completed / $total) * 100);

        $enrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->firstOrFail();
        // Model-level update so the completion hook (certificate issuance) fires.
        $enrollment->update([
            'progress_percent' => $courseProgress,
            'status' => $courseProgress === 100 ? 'completed' : 'active',
            'completed_at' => $courseProgress === 100 ? now() : null,
        ]);
    }
}
