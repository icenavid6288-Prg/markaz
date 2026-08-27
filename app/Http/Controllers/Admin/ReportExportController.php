<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachingSession;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Reports/Index', [
            'pending_refunds' => Order::query()->with('user:id,name')->where('status', 'refund_pending')->latest()->limit(20)->get()->map(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'user' => $order->user?->name,
                'total' => $order->total,
                'refund_reason' => $order->refund_reason,
            ])->values(),
            'summary' => [
                'orders' => Order::query()->count(),
                'paid_orders' => Order::query()->where('status', 'paid')->count(),
                'refunded_orders' => Order::query()->where('status', 'refunded')->count(),
                'pending_refunds' => Order::query()->where('status', 'refund_pending')->count(),
                'revenue' => (int) Order::query()->where('status', 'paid')->sum('total'),
                'refunded_amount' => (int) Order::query()->where('status', 'refunded')->sum('total'),
                'enrollments' => Enrollment::query()->count(),
                'sessions' => CoachingSession::query()->count(),
                'users' => User::query()->count(),
            ],
            'exports' => [
                ['key' => 'orders', 'title' => 'سفارش‌ها', 'href' => route('admin.reports.orders.export')],
                ['key' => 'payments', 'title' => 'پرداخت‌ها', 'href' => route('admin.reports.payments.export')],
                ['key' => 'enrollments', 'title' => 'ثبت‌نام دوره‌ها', 'href' => route('admin.reports.enrollments.export')],
                ['key' => 'sessions', 'title' => 'جلسات کوچینگ', 'href' => route('admin.reports.sessions.export')],
                ['key' => 'users', 'title' => 'کاربران', 'href' => route('admin.reports.users.export')],
            ],
        ]);
    }

    public function print(): Response
    {
        return Inertia::render('Admin/Reports/Print', [
            'generated_at' => now()->toISOString(),
            'summary' => [
                'revenue' => (int) Order::query()->where('status', 'paid')->sum('total'),
                'refunded_amount' => (int) Order::query()->where('status', 'refunded')->sum('total'),
                'paid_orders' => Order::query()->where('status', 'paid')->count(),
                'refunded_orders' => Order::query()->where('status', 'refunded')->count(),
                'enrollments' => Enrollment::query()->count(),
                'completed_sessions' => CoachingSession::query()->where('status', 'completed')->count(),
                'cancelled_sessions' => CoachingSession::query()->where('status', 'cancelled')->count(),
                'users' => User::query()->count(),
            ],
            'recent_orders' => Order::query()->with('user:id,name,phone')->latest()->limit(25)->get()->map(fn (Order $order) => [
                'order_number' => $order->order_number,
                'user' => $order->user?->name,
                'status' => $order->status,
                'total' => $order->total,
                'created_at' => $order->created_at?->toDateTimeString(),
            ])->values(),
        ]);
    }

    public function orders(Request $request): StreamedResponse
    {
        return $this->csv('orders', ['شماره سفارش', 'نام کاربر', 'موبایل', 'وضعیت', 'مبلغ', 'بازگشت وجه', 'تاریخ'], function ($handle): void {
            Order::query()->with('user:id,name,phone')->latest()->chunk(500, function ($orders) use ($handle): void {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->order_number,
                        $order->user?->name,
                        $order->user?->phone,
                        $order->status,
                        $order->total,
                        $order->refunded_at?->toDateTimeString(),
                        optional($order->created_at)->toIso8601String(),
                    ], ';');
                }
            });
        });
    }

    public function payments(): StreamedResponse
    {
        return $this->csv('payments', ['شناسه', 'سفارش', 'درگاه', 'مبلغ', 'وضعیت', 'مرجع', 'تاریخ تأیید'], function ($handle): void {
            Payment::query()->with('order:id,order_number')->latest()->chunk(500, function ($payments) use ($handle): void {
                foreach ($payments as $payment) {
                    fputcsv($handle, [
                        $payment->id,
                        $payment->order?->order_number,
                        $payment->gateway,
                        $payment->amount,
                        $payment->status,
                        $payment->reference_id,
                        optional($payment->verified_at)->toIso8601String(),
                    ], ';');
                }
            });
        });
    }

    public function enrollments(): StreamedResponse
    {
        return $this->csv('enrollments', ['شناسه', 'دانش‌آموز', 'موبایل', 'دوره', 'وضعیت', 'پیشرفت', 'تاریخ ثبت‌نام'], function ($handle): void {
            Enrollment::query()->with(['user:id,name,phone', 'course:id,title'])->latest()->chunk(500, function ($enrollments) use ($handle): void {
                foreach ($enrollments as $enrollment) {
                    fputcsv($handle, [
                        $enrollment->id,
                        $enrollment->user?->name,
                        $enrollment->user?->phone,
                        $enrollment->course?->title,
                        $enrollment->status,
                        $enrollment->progress_percent,
                        optional($enrollment->enrolled_at)->toIso8601String(),
                    ], ';');
                }
            });
        });
    }

    public function sessions(): StreamedResponse
    {
        return $this->csv('coaching-sessions', ['شناسه', 'کوچ', 'دانش‌آموز', 'وضعیت', 'مبلغ', 'زمان جلسه', 'دلیل لغو'], function ($handle): void {
            CoachingSession::query()->with(['coach:id,name', 'student:id,name'])->latest('scheduled_at')->chunk(500, function ($sessions) use ($handle): void {
                foreach ($sessions as $session) {
                    fputcsv($handle, [
                        $session->id,
                        $session->coach?->name,
                        $session->student?->name,
                        $session->status,
                        $session->price,
                        optional($session->scheduled_at)->toIso8601String(),
                        $session->cancel_reason,
                    ], ';');
                }
            });
        });
    }

    public function users(): StreamedResponse
    {
        return $this->csv('users', ['شناسه', 'نام', 'موبایل', 'ایمیل', 'فعال', 'تاریخ عضویت'], function ($handle): void {
            User::query()->latest()->chunk(500, function ($users) use ($handle): void {
                foreach ($users as $user) {
                    fputcsv($handle, [
                        $user->id,
                        $user->name,
                        $user->phone,
                        $user->email,
                        $user->is_active ? '1' : '0',
                        optional($user->created_at)->toIso8601String(),
                    ], ';');
                }
            });
        });
    }

    /**
     * @param  list<string>  $headers
     * @param  callable(resource): void  $writer
     */
    private function csv(string $name, array $headers, callable $writer): StreamedResponse
    {
        $filename = $name.'-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($headers, $writer): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers, ';');
            $writer($handle);
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }
}
