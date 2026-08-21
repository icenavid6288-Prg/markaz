<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BulkSmsRun;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BulkSmsReportController extends Controller
{
    public function index(Request $request): Response
    {
        $runs = BulkSmsRun::query()
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $selected = null;
        if ($request->filled('run')) {
            $selected = BulkSmsRun::query()
                ->with(['recipients' => fn ($query) => $query->latest()])
                ->find($request->integer('run'));
        }

        return Inertia::render('Admin/Marketing/BulkSmsReports', [
            'runs' => $runs->through(fn (BulkSmsRun $run) => $this->presentRun($run)),
            'selectedRun' => $selected ? $this->presentRun($selected, true) : null,
            'filters' => ['status' => $request->string('status')->toString()],
            'stats' => [
                'runs' => BulkSmsRun::count(),
                'sent' => (int) BulkSmsRun::sum('sent_count'),
                'failed' => (int) BulkSmsRun::sum('failed_count'),
                'recipients' => (int) BulkSmsRun::sum('recipients_count'),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function presentRun(BulkSmsRun $run, bool $withRecipients = false): array
    {
        $data = [
            'id' => $run->id,
            'message' => $run->message,
            'status' => $run->status,
            'recipients_count' => $run->recipients_count,
            'sent_count' => $run->sent_count,
            'failed_count' => $run->failed_count,
            'started_at' => $run->started_at?->toISOString(),
            'completed_at' => $run->completed_at?->toISOString(),
        ];

        if ($withRecipients) {
            $data['recipients'] = $run->recipients->map(fn ($recipient) => [
                'id' => $recipient->id,
                'name' => $recipient->name,
                'phone' => $recipient->phone,
                'status' => $recipient->status,
                'error' => $recipient->error,
                'sent_at' => $recipient->sent_at?->toISOString(),
            ])->values()->all();
        }

        return $data;
    }
}
