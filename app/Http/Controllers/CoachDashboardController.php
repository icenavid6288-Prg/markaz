<?php

namespace App\Http\Controllers;

use App\Models\CoachingGoal;
use App\Models\CoachingSession;
use Illuminate\Http\Request;
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
            ->limit(12)
            ->get();
        $goals = CoachingGoal::query()
            ->with('student')
            ->where('coach_id', $user->id)
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderBy('due_date')
            ->limit(8)
            ->get();
        $studentIds = $sessions->pluck('student_id')->merge($goals->pluck('student_id'))->unique()->values();

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
            ])->values(),
            'goals' => $goals->map(fn ($goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'student' => $goal->student?->name,
                'status' => $goal->status,
                'due_date' => $goal->due_date?->toISOString(),
            ])->values(),
        ]);
    }
}
