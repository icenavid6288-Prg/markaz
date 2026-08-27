<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Comment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, BlogPost $post): RedirectResponse
    {
        abort_unless($post->status === 'published', 404);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        Comment::create([
            'user_id' => $request->user()->id,
            'commentable_type' => BlogPost::class,
            'commentable_id' => $post->id,
            'body' => trim($validated['body']),
            'is_approved' => false,
        ]);

        return back()->with('success', 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.');
    }
}
