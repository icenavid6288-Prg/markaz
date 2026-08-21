<?php

use App\Models\MarketingCampaign;
use App\Models\Order;
use App\Models\Survey;
use App\Services\Commerce\OrderFulfillment;
use App\Services\Eitaa\EitaaPublisher;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('marketing:dispatch-scheduled', function (MarketingCampaignDispatcher $dispatcher) {
    $count = DB::transaction(function () use ($dispatcher): int {
        $campaigns = MarketingCampaign::query()
            ->where('status', 'active')
            ->where('trigger', 'manual')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->lockForUpdate()
            ->get();

        foreach ($campaigns as $campaign) {
            $campaign->update(['status' => 'running', 'scheduled_at' => null]);
            $dispatcher->queue($campaign->fresh());
        }

        return $campaigns->count();
    });

    $this->info("{$count} scheduled campaign(s) dispatched.");
})->purpose('Dispatch due one-time automarketing campaigns');

Artisan::command('commerce:release-expired-reservations', function () {
    $released = 0;
    Order::query()->where('status', 'pending')->whereNotNull('reservation_expires_at')->where('reservation_expires_at', '<=', now())->chunkById(50, function ($orders) use (&$released): void {
        foreach ($orders as $order) {
            DB::transaction(function () use ($order, &$released): void {
                $locked = Order::query()->lockForUpdate()->find($order->id);
                if (! $locked || $locked->status !== 'pending' || ! $locked->reservation_expires_at?->isPast()) {
                    return;
                }
                $locked->load('items');
                foreach ($locked->items->where('purchasable_type', Product::class) as $item) {
                    $product = Product::query()->lockForUpdate()->find($item->purchasable_id);
                    if ($product) {
                        $product->decrement('reserved_stock', min((int) $item->quantity, (int) $product->reserved_stock));
                    }
                }
                $locked->update(['status' => 'cancelled', 'reservation_expires_at' => null]);
                $released++;
            });
        }
    });
    $this->info("{$released} expired reservation(s) released.");
})->purpose('Release stock held by abandoned product orders');

Artisan::command('surveys:publish-eitaa-scheduled', function (EitaaPublisher $publisher) {
    $published = 0;
    $failed = 0;

    DB::transaction(function () use ($publisher, &$published, &$failed) {
        $surveys = Survey::query()
            ->where('status', 'published')
            ->whereNotNull('eitaa_scheduled_at')
            ->where('eitaa_scheduled_at', '<=', now())
            ->whereNull('eitaa_published_at')
            ->lockForUpdate()
            ->get();

        foreach ($surveys as $survey) {
            $result = $publisher->publish($publisher->messageFor($survey));
            if ($result['ok']) {
                $survey->update(['eitaa_published_at' => now(), 'eitaa_scheduled_at' => null]);
                $published++;
            } else {
                $failed++;
                $this->error($result['message']);
            }
        }
    });

    $this->info("{$published} survey(s) published to Eitaa, {$failed} failed.");
})->purpose('Publish due surveys to the Eitaa channel');

Artisan::command('surveys:send-eitaa-summaries', function (EitaaPublisher $publisher) {
    $sent = 0;
    $failed = 0;

    DB::transaction(function () use ($publisher, &$sent, &$failed) {
        $surveys = Survey::query()
            ->where(function ($query) {
                $query->where('status', 'closed')
                    ->orWhere(function ($nested) {
                        $nested->where('status', 'published')
                            ->whereNotNull('ends_at')
                            ->where('ends_at', '<=', now());
                    });
            })
            ->whereNull('eitaa_summary_sent_at')
            ->whereHas('responses')
            ->lockForUpdate()
            ->get();

        foreach ($surveys as $survey) {
            $result = $publisher->publishSummary($survey);
            if ($result['ok']) {
                $survey->update(['eitaa_summary_sent_at' => now()]);
                $sent++;
            } else {
                $failed++;
                $this->error($result['message']);
            }
        }
    });

    $this->info("{$sent} survey summary(s) sent to Eitaa, {$failed} failed.");
})->purpose('Send results summary of closed surveys to the Eitaa channel');

app(Schedule::class)
    ->command('surveys:publish-eitaa-scheduled')
    ->everyMinute()
    ->withoutOverlapping();

app(Schedule::class)
    ->command('surveys:send-eitaa-summaries')
    ->everyFiveMinutes()
    ->withoutOverlapping();

app(Schedule::class)
    ->command('marketing:dispatch-scheduled')
    ->everyMinute()
    ->withoutOverlapping();

app(Schedule::class)
    ->command('commerce:release-expired-reservations')
    ->everyFiveMinutes()
    ->withoutOverlapping();

app(Schedule::class)
    ->command('marketing:winback-visitors')
    ->dailyAt('18:00')
    ->withoutOverlapping();

app(Schedule::class)
    ->command('crm:dispatch-inactive-campaigns')
    ->dailyAt('09:00')
    ->withoutOverlapping();

app(Schedule::class)
    ->command('crm:remind-stale-leads')
    ->dailyAt('10:00')
    ->withoutOverlapping();
