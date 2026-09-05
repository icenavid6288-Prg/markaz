<?php

namespace App\Http\Middleware;

use App\Models\PageView;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackAttribution
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') && ! $request->expectsJson() && ! $request->is('admin/*', 'admin', 'api/*', 'storage/*')) {
            $this->rememberAttribution($request);
        }

        $response = $next($request);

        if ($request->isMethod('GET') && ! $request->expectsJson() && ! $request->is('admin/*', 'admin', 'api/*', 'storage/*')) {
            PageView::create([
                'url' => '/'.ltrim($request->path(), '/'),
                'title' => null,
                'referrer' => substr((string) $request->headers->get('referer'), 0, 255) ?: null,
                'user_agent' => substr((string) $request->userAgent(), 0, 255) ?: null,
                'ip_hash' => hash('sha256', (string) $request->ip()),
                'user_id' => $request->user()?->id,
                'visited_at' => now(),
                'utm_source' => $request->session()->get('instagram_attribution.utm_source'),
                'utm_medium' => $request->session()->get('instagram_attribution.utm_medium'),
                'utm_campaign' => $request->session()->get('instagram_attribution.utm_campaign'),
                'utm_content' => $request->session()->get('instagram_attribution.utm_content'),
                'utm_term' => $request->session()->get('instagram_attribution.utm_term'),
                'attribution_source' => $request->session()->get('instagram_attribution.source'),
            ]);
        }

        return $response;
    }

    private function rememberAttribution(Request $request): void
    {
        $utmSource = trim((string) $request->query('utm_source', ''));
        $referrer = strtolower((string) $request->headers->get('referer', ''));
        $fromInstagram = $utmSource !== '' && in_array(strtolower($utmSource), ['instagram', 'ig', 'instagram.com'], true)
            || str_contains($referrer, 'instagram.com')
            || str_contains($referrer, 'l.instagram.com');

        if (! $fromInstagram && ! $request->session()->has('instagram_attribution')) {
            return;
        }

        $current = (array) $request->session()->get('instagram_attribution', []);
        $values = [
            'source' => $current['source'] ?? ($fromInstagram ? 'instagram' : null),
            'first_seen_at' => $current['first_seen_at'] ?? now()->toISOString(),
            'utm_source' => $request->query('utm_source', $current['utm_source'] ?? null),
            'utm_medium' => $request->query('utm_medium', $current['utm_medium'] ?? null),
            'utm_campaign' => $request->query('utm_campaign', $current['utm_campaign'] ?? null),
            'utm_content' => $request->query('utm_content', $current['utm_content'] ?? null),
            'utm_term' => $request->query('utm_term', $current['utm_term'] ?? null),
            'landing_url' => $current['landing_url'] ?? $request->fullUrl(),
            'referrer' => $current['referrer'] ?? substr((string) $request->headers->get('referer'), 0, 255),
        ];

        $request->session()->put('instagram_attribution', array_filter($values, static fn ($value) => $value !== null && $value !== ''));
    }
}
