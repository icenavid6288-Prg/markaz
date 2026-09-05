<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OrderItem;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();
        $query = Event::published()->latest('event_date');
        if (in_array($type, ['webinar', 'seminar'], true)) $query->where('type', $type);
        $events = $query->paginate(12)->withQueryString();
        return Inertia::render('Events/Index', [
            'events' => $events,
            'filters' => ['type' => $type],
            'seo' => Seo::page($request, 'وبینارها و سمینارها', 'وبینارها و سمینارهای آموزشی مرکز رشد و کارآفرینی دکتر بیدی.', null, ['@type' => 'CollectionPage']),
        ]);
    }

    public function show(string $slug): Response
    {
        $event = Event::published()->where('slug', $slug)->firstOrFail();
        $hasAccess = auth()->check() && OrderItem::query()->where('purchasable_type', Event::class)->where('purchasable_id', $event->id)->whereHas('order', fn ($q) => $q->where('user_id', auth()->id())->where('status', 'paid'))->exists();
        return Inertia::render('Events/Show', [
            'event' => $event,
            'has_access' => $hasAccess,
            'seo' => Seo::page(request(), $event->title, $event->summary ?: $event->description ?: 'رویداد آموزشی مرکز رشد و کارآفرینی.', $event->seo, ['@type' => 'Event', 'name' => $event->title, 'startDate' => $event->event_date?->toIso8601String(), 'url' => url('/events/'.$event->slug)], $event->poster),
        ]);
    }
}
