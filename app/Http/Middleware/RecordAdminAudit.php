<?php

namespace App\Http\Middleware;

use App\Models\AdminAuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecordAdminAudit
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user() && ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            AdminAuditLog::create([
                'user_id' => $request->user()->id,
                'action' => (string) ($request->route()?->getName() ?: $request->path()),
                'route' => $request->path(),
                'method' => $request->method(),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 1000),
                'auditable_type' => $request->route('user') ? get_debug_type($request->route('user')) : null,
                'auditable_id' => is_object($request->route('user')) ? $request->route('user')->getKey() : null,
                'meta' => ['status' => $response->getStatusCode()],
            ]);
        }

        return $response;
    }
}
