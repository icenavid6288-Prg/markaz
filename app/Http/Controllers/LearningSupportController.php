<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Note;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LearningSupportController extends Controller
{
    public function storeNote(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->assertCanStudy($request, $course, $lesson);
        $validated = $request->validate(['content' => ['required', 'string', 'max:5000']]);

        Note::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['content' => trim($validated['content'])],
        );

        return back()->with('success', 'یادداشت درس ذخیره شد.');
    }

    public function destroyNote(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->assertCanStudy($request, $course, $lesson);
        Note::query()->where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->delete();

        return back()->with('success', 'یادداشت حذف شد.');
    }

    public function toggleBookmark(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->assertCanStudy($request, $course, $lesson);
        $existing = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', 'نشانک برداشته شد.');
        }

        Bookmark::create(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id]);

        return back()->with('success', 'درس نشانک شد.');
    }

    private function assertCanStudy(Request $request, Course $course, Lesson $lesson): void
    {
        abort_unless($lesson->course_id === $course->id, 404);
        $enrolled = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->exists();
        abort_unless($enrolled || $lesson->is_free, 403);
    }
}
