<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function orders(Request $request): StreamedResponse
    {
        $filename = 'orders-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['شماره سفارش', 'نام کاربر', 'موبایل', 'وضعیت', 'مبلغ', 'تاریخ'], ';');
            Order::query()->with('user:id,name,phone')->latest()->chunk(500, function ($orders) use ($handle): void {
                foreach ($orders as $order) {
                    fputcsv($handle, [$order->order_number, $order->user?->name, $order->user?->phone, $order->status, $order->total, optional($order->created_at)->toIso8601String()], ';');
                }
            });
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }
}
