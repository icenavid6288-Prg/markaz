<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\CoursePlayerController;
use App\Models\Bookmark;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LearningController extends Controller
{
    public function show(Request $request, Course $course, ?Lesson $lesson = null): JsonResponse
    {
        abort_unless($course->is_published, 404);
        $enrolled = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->exists();
        $course->load(['modules.lessons']);
        $lessons = $course->modules->flatMap(fn ($module) => $module->lessons)->values();
        $current = $lesson && $lesson->course_id === $course->id ? $lesson : $lessons->first(fn (Lesson $item) => $enrolled || $item->is_free) ?? $lessons->first();
        abort_unless($current, 404);
        abort_unless($enrolled || $current->is_free, 403);

        return response()->json([
            'data' => [
                'course' => ['id' => $course->id, 'title' => $course->title, 'slug' => $course->slug],
                'enrolled' => $enrolled,
                'preview' => ! $enrolled,
                'current_lesson' => [
                    'id' => $current->id,
                    'title' => $current->title,
                    'type' => $current->type,
                    'is_free' => (bool) $current->is_free,
                    'content' => $current->content,
                    'video_url' => $current->video_url,
                    'player_url' => url('/dashboard/courses/'.$course->slug.'/learn/'.$current->id),
                ],
                'lessons' => $lessons->map(fn (Lesson $item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'is_free' => (bool) $item->is_free,
                    'locked' => ! $enrolled && ! $item->is_free,
                ])->values(),
            ],
        ]);
    }

    public function progress(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        app(CoursePlayerController::class)->progress($request, $course, $lesson);

        return response()->json(['data' => ['message' => 'پیشرفت ذخیره شد.']]);
    }

    public function note(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        abort_unless($lesson->course_id === $course->id, 404);
        $validated = $request->validate(['content' => ['required', 'string', 'max:5000']]);
        $note = Note::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['content' => trim($validated['content'])],
        );

        return response()->json(['data' => ['id' => $note->id, 'content' => $note->content]]);
    }

    public function bookmark(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        abort_unless($lesson->course_id === $course->id, 404);
        $existing = Bookmark::query()->where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->first();
        if ($existing) {
            $existing->delete();

            return response()->json(['data' => ['bookmarked' => false]]);
        }
        Bookmark::create(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id]);

        return response()->json(['data' => ['bookmarked' => true]]);
    }
}
