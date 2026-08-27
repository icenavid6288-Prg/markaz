<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = AdminAuditLog::query()
            ->with('user:id,name,phone')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = trim($request->string('search')->toString());
                $query->where(function ($nested) use ($search): void {
                    $nested->where('action', 'like', "%{$search}%")
                        ->orWhere('route', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs->through(fn (AdminAuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'route' => $log->route,
                'method' => $log->method,
                'ip_address' => $log->ip_address,
                'status' => $log->meta['status'] ?? null,
                'created_at' => $log->created_at?->toISOString(),
                'user' => $log->user ? ['name' => $log->user->name, 'phone' => $log->user->phone] : null,
            ]),
            'filters' => ['search' => $request->string('search')->toString()],
        ]);
    }
}
