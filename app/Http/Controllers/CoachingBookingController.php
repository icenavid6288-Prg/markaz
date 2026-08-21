<?php

namespace App\Http\Controllers;

use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CoachingBookingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['availability_id' => ['required', 'integer', 'exists:coach_availability,id'], 'notes' => ['nullable', 'string', 'max:2000']]);

        DB::transaction(function () use ($request, $data): void {
            $slot = CoachAvailability::query()->lockForUpdate()->with('coach.coach')->findOrFail($data['availability_id']);
            abort_unless(! $slot->is_booked && $slot->coach?->coach?->is_available, 422, 'این زمان قبلاً رزرو شده یا دیگر در دسترس نیست.');
            $scheduledAt = Carbon::parse($slot->available_date->format('Y-m-d').' '.$slot->start_time);
            abort_if($scheduledAt->isPast(), 422, 'زمان انتخاب‌شده گذشته است.');

            CoachingSession::create([
                'coach_id' => $slot->coach_id,
                'student_id' => $request->user()->id,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => max(1, $scheduledAt->diffInMinutes(Carbon::parse($slot->available_date->format('Y-m-d').' '.$slot->end_time))),
                'status' => 'pending',
                'price' => (int) ($slot->coach?->coach?->hourly_rate ?? 0),
                'notes' => $data['notes'] ?? null,
            ]);
            $slot->update(['is_booked' => true]);
        });

        return redirect()->route('dashboard.sessions')->with('success', 'درخواست رزرو جلسه ثبت شد و پس از تأیید کوچ در پنل شما نمایش داده می‌شود.');
    }
}
