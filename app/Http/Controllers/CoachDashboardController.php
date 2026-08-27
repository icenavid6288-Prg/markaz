<?php

namespace App\Http\Controllers;

use App\Models\CoachAvailability;
use App\Models\CoachingGoal;
use App\Models\CoachingSession;
use App\Models\CoachingTask;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Commerce\SessionCancellation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CoachDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $sessions = CoachingSession::query()
            ->with('student')
            ->where('coach_id', $user->id)
            ->orderByDesc('scheduled_at')
            ->limit(20)
            ->get();
        $goals = CoachingGoal::query()
            ->with('student')
            ->withCount(['tasks as total_tasks'])
            ->withCount(['tasks as completed_tasks' => fn ($query) => $query->where('status', 'done')])
            ->where('coach_id', $user->id)
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderBy('due_date')
            ->limit(20)
            ->get();
        $orderStatuses = OrderItem::query()
            ->where('purchasable_type', CoachingSession::class)
            ->whereIn('purchasable_id', $sessions->pluck('id'))
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->pluck('orders.status', 'order_items.purchasable_id');
        $studentIds = $sessions->pluck('student_id')->merge($goals->pluck('student_id'))->unique()->values();
        $students = User::query()->whereIn('id', $studentIds)->orderBy('name')->get(['id', 'name']);
        $availability = CoachAvailability::query()
            ->where('coach_id', $user->id)
            ->whereDate('available_date', '>=', now()->toDateString())
            ->orderBy('available_date')
            ->orderBy('start_time')
            ->limit(20)
            ->get();

        return Inertia::render('Coach/Dashboard', [
            'profile' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'coach' => $user->coach ? [
                    'specialty' => $user->coach->specialty,
                    'experience_years' => $user->coach->experience_years,
                    'rating' => $user->coach->rating,
                    'is_available' => $user->coach->is_available,
                ] : null,
            ],
            'stats' => [
                'students' => $studentIds->count(),
                'upcoming_sessions' => $sessions->whereIn('status', ['pending', 'confirmed'])->count(),
                'completed_sessions' => $sessions->where('status', 'completed')->count(),
                'active_goals' => $goals->whereIn('status', ['pending', 'in_progress'])->count(),
            ],
            'sessions' => $sessions->map(fn ($session) => [
                'id' => $session->id,
                'scheduled_at' => $session->scheduled_at?->toISOString(),
                'student' => $session->student?->name,
                'status' => $session->status,
                'duration_minutes' => $session->duration_minutes,
                'meeting_link' => $session->meeting_link,
                'report' => $session->report,
                'order_status' => $orderStatuses[(int) $session->id] ?? null,
            ])->values(),
            'goals' => $goals->map(fn ($goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'student' => $goal->student?->name,
                'student_id' => $goal->student_id,
                'status' => $goal->status,
                'due_date' => $goal->due_date?->toDateString(),
                'total_tasks' => (int) $goal->total_tasks,
                'completed_tasks' => (int) $goal->completed_tasks,
            ])->values(),
            'students' => $students->map(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
            ])->values(),
            'availability' => $availability->map(fn (CoachAvailability $slot) => [
                'id' => $slot->id,
                'date' => $slot->available_date?->toDateString(),
                'start_time' => substr((string) $slot->start_time, 0, 5),
                'end_time' => substr((string) $slot->end_time, 0, 5),
                'is_booked' => (bool) $slot->is_booked,
            ])->values(),
        ]);
    }

    public function updateSession(Request $request, CoachingSession $session): RedirectResponse
    {
        abort_unless($session->coach_id === $request->user()->id, 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,completed,cancelled'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
            'report' => ['nullable', 'string', 'max:4000'],
        ]);

        if ($validated['status'] === 'cancelled') {
            $result = app(SessionCancellation::class)->cancel($session, 'coach');
            abort_unless($result['cancelled'], 422, 'جلسه تکمیل‌شده را نمی‌توان لغو کرد.');
            $session->update([
                'meeting_link' => $validated['meeting_link'] ?? $session->meeting_link,
                'report' => $validated['report'] ?? $session->report,
            ]);

            return back()->with('success', $result['refunded']
                ? 'جلسه لغو شد و سفارش برای بازگشت وجه علامت‌گذاری شد.'
                : 'جلسه لغو شد و زمان در تقویم آزاد شد.');
        }

        $session->update($validated);

        return back()->with('success', 'جلسه به‌روزرسانی شد.');
    }

    public function storeGoal(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['nullable', 'date'],
        ]);
        $this->assertCoachStudent($request, (int) $validated['student_id']);

        CoachingGoal::create([
            ...$validated,
            'coach_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'هدف رشد ثبت شد.');
    }

    public function updateGoal(Request $request, CoachingGoal $goal): RedirectResponse
    {
        abort_unless($goal->coach_id === $request->user()->id, 403);
        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,achieved'],
        ]);
        $goal->update($validated);

        return back()->with('success', 'وضعیت هدف به‌روزرسانی شد.');
    }

    public function storeTask(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'goal_id' => ['required', 'integer', 'exists:coaching_goals,id'],
            'title' => ['required', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
        ]);
        $goal = CoachingGoal::findOrFail($validated['goal_id']);
        abort_unless($goal->coach_id === $request->user()->id, 403);

        CoachingTask::create([
            'goal_id' => $goal->id,
            'student_id' => $goal->student_id,
            'coach_id' => $request->user()->id,
            'title' => $validated['title'],
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'تسک به هدف اضافه شد.');
    }

    public function storeAvailability(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'available_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'repeat_weeks' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $weeks = max(1, (int) ($validated['repeat_weeks'] ?? 1));
        $seriesId = $weeks > 1 ? (string) Str::uuid() : null;
        $created = 0;
        $start = Carbon::parse($validated['available_date']);

        for ($week = 0; $week < $weeks; $week++) {
            $date = $start->copy()->addWeeks($week)->toDateString();
            $exists = CoachAvailability::query()
                ->where('coach_id', $request->user()->id)
                ->whereDate('available_date', $date)
                ->where(function ($query) use ($validated): void {
                    $query->where('start_time', $validated['start_time'])
                        ->orWhere('start_time', $validated['start_time'].':00');
                })
                ->exists();
            if ($exists) {
                continue;
            }

            CoachAvailability::create([
                'coach_id' => $request->user()->id,
                'available_date' => $date,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'is_booked' => false,
                'series_id' => $seriesId,
            ]);
            $created++;
        }

        abort_if($created === 0, 422, 'این زمان‌ها قبلاً در تقویم شما ثبت شده‌اند.');

        return back()->with('success', $created > 1
            ? "{$created} زمان آزاد تکرارشونده ثبت شد."
            : 'زمان آزاد ثبت شد.');
    }

    public function destroyAvailability(Request $request, CoachAvailability $slot): RedirectResponse
    {
        abort_unless($slot->coach_id === $request->user()->id, 403);
        abort_if($slot->is_booked, 422, 'زمان رزروشده را نمی‌توان حذف کرد.');
        $slot->delete();

        return back()->with('success', 'زمان آزاد حذف شد.');
    }

    private function assertCoachStudent(Request $request, int $studentId): void
    {
        $known = CoachingSession::query()->where('coach_id', $request->user()->id)->where('student_id', $studentId)->exists()
            || CoachingGoal::query()->where('coach_id', $request->user()->id)->where('student_id', $studentId)->exists();
        abort_unless($known, 403, 'این دانش‌آموز در لیست همراهان شما نیست.');
    }
}
