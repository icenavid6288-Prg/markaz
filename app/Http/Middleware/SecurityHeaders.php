<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (config('security.csp_enabled')) {
            $nonce = (string) $request->attributes->get('csp_nonce', '');
            $scriptSources = ["'self'"];
            $styleSources = ["'self'", "'unsafe-inline'"];
            $fontSources = ["'self'", 'data:', 'https:'];
            $connectSources = ["'self'", 'https:'];

            // Vite's HMR server is cross-origin during local development. Allow
            // only its configured origin while keeping production CSP strict.
            if (Vite::isRunningHot()) {
                $hotUrl = trim((string) @file_get_contents(Vite::hotFile()));
                $hotOrigin = rtrim($hotUrl, '/');
                if ($hotOrigin !== '') {
                    $scriptSources[] = $hotOrigin;
                    $styleSources[] = $hotOrigin;
                    $fontSources[] = $hotOrigin;
                    $connectSources[] = $hotOrigin;
                    $parsedHotUrl = parse_url($hotOrigin);
                    if (is_array($parsedHotUrl) && isset($parsedHotUrl['host'])) {
                        $websocketScheme = ($parsedHotUrl['scheme'] ?? 'http') === 'https' ? 'wss' : 'ws';
                        $connectSources[] = $websocketScheme.'://'.$parsedHotUrl['host'].(isset($parsedHotUrl['port']) ? ':'.$parsedHotUrl['port'] : '');
                    }
                }
            }

            $scriptSource = 'script-src '.implode(' ', array_merge(
                $scriptSources,
                $nonce !== '' ? ["'nonce-{$nonce}'"] : [],
            ));
            $policy = [
                "default-src 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
                "object-src 'none'",
                $scriptSource,
                'style-src '.implode(' ', $styleSources),
                "img-src 'self' data: blob: https:",
                'font-src '.implode(' ', array_unique($fontSources)),
                "media-src 'self' blob: https:",
                'connect-src '.implode(' ', array_unique($connectSources)),
                "frame-src 'self' https:",
                "worker-src 'self' blob:",
            ];

            // Do not force HTTPS upgrades on an HTTP local preview. Production
            // still receives the directive even if TLS is terminated upstream.
            if ($request->isSecure() || app()->isProduction()) {
                $policy[] = 'upgrade-insecure-requests';
            }

            $policy = implode('; ', $policy);
            $response->headers->set(config('security.csp_report_only') ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', $policy);
        }

        return $response;
    }
}
