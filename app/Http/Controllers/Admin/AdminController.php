<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\Lead;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(Request $request): Response
    {
        abort_unless($request->user()?->hasAnyRole(['super-admin', 'admin', 'editor']), 403);

        $days = 30;

        $stats = [
            'users' => User::count(),
            'students' => \App\Models\Student::count(),
            'instructors' => \App\Models\Instructor::count(),
            'coaches' => \App\Models\Coach::count(),
            'courses' => Course::count(),
            'products' => Product::count(),
            'leads' => Lead::count(),
            'sessions' => CoachingSession::where('status', 'completed')->count(),
            'revenue' => Order::where('status', 'paid')->sum('total'),
            'orders' => Order::where('status', 'paid')->count(),
            'activeUsers' => User::where('is_active', true)->count(),
            'newLeads' => Lead::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        // Aggregate the dashboard charts in two queries instead of issuing one
        // database query per day (60 queries on every admin dashboard visit).
        $from = Carbon::today()->subDays($days - 1);
        $revenueByDate = Order::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from->startOfDay(), Carbon::today()->endOfDay()])
            ->selectRaw('DATE(paid_at) as day, SUM(total) as value')
            ->groupBy('day')
            ->pluck('value', 'day');

        $registrationsByDate = User::query()
            ->whereBetween('created_at', [$from->startOfDay(), Carbon::today()->endOfDay()])
            ->selectRaw('DATE(created_at) as day, COUNT(*) as value')
            ->groupBy('day')
            ->pluck('value', 'day');

        $revenueSeries = collect(range($days - 1, 0))->map(function ($i) use ($revenueByDate) {
            $date = Carbon::today()->subDays($i);
            return [
                'date' => $date->format('m/d'),
                'value' => (int) ($revenueByDate[$date->toDateString()] ?? 0),
            ];
        });

        $registrationsSeries = collect(range($days - 1, 0))->map(function ($i) use ($registrationsByDate) {
            $date = Carbon::today()->subDays($i);
            return [
                'date' => $date->format('m/d'),
                'value' => (int) ($registrationsByDate[$date->toDateString()] ?? 0),
            ];
        });

        // وضعیت لیدها
        $leadFunnel = collect(['new', 'contacted', 'interested', 'consultation', 'registered', 'customer'])
            ->map(fn ($status) => [
                'status' => $status,
                'count' => Lead::where('status', $status)->count(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'revenueSeries' => $revenueSeries,
            'registrationsSeries' => $registrationsSeries,
            'leadFunnel' => $leadFunnel,
        ]);
    }
}
