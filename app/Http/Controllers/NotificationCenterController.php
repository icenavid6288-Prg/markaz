<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationCenterController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (DatabaseNotification $notification) => [
                'id' => $notification->id,
                'title' => data_get($notification->data, 'title', 'اعلان'),
                'message' => data_get($notification->data, 'message', ''),
                'url' => data_get($notification->data, 'url'),
                'read_at' => $notification->read_at?->toISOString(),
                'created_at' => $notification->created_at?->toISOString(),
            ]);

        return Inertia::render('Dashboard/Notifications', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->findOrFail($notification);
        $notification->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
