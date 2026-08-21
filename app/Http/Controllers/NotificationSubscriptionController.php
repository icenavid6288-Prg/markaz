<?php

namespace App\Http\Controllers;

use App\Models\NotificationSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url', 'max:2048'],
            'keys.p256dh' => ['nullable', 'string', 'max:255'],
            'keys.auth' => ['nullable', 'string', 'max:255'],
            'content_encoding' => ['nullable', 'string', 'max:40'],
        ]);

        NotificationSubscription::updateOrCreate(
            ['user_id' => $request->user()->id, 'endpoint_hash' => NotificationSubscription::hashEndpoint($data['endpoint'])],
            ['endpoint' => $data['endpoint'], 'public_key' => data_get($data, 'keys.p256dh'), 'auth_token' => data_get($data, 'keys.auth'), 'content_encoding' => $data['content_encoding'] ?? null, 'last_used_at' => now()],
        );

        return response()->json(['message' => 'اشتراک اعلان ثبت شد.'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => ['required', 'url', 'max:2048']]);
        NotificationSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('endpoint_hash', NotificationSubscription::hashEndpoint($request->string('endpoint')->toString()))
            ->delete();

        return response()->json(['message' => 'اشتراک اعلان حذف شد.']);
    }
}
