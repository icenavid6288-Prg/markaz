<?php

namespace App\Console\Commands;

use App\Services\Instagram\InstagramService;
use Illuminate\Console\Command;

class PublishScheduledInstagramMedia extends Command
{
    protected $signature = 'instagram:publish-scheduled {--limit=5 : Maximum posts pushed per run}';

    protected $description = 'Publish Instagram posts whose scheduled time has arrived';

    public function handle(InstagramService $instagram): int
    {
        $published = $instagram->publishDueScheduled((int) $this->option('limit'));

        if ($published === []) {
            $this->line('No scheduled Instagram posts are due.');

            return self::SUCCESS;
        }

        foreach ($published as $media) {
            $this->info(sprintf(
                '[%s] #%d %s -> %s',
                $media->status,
                $media->id,
                (string) ($media->post_type ?? 'IMAGE'),
                (string) ($media->error ?? 'published'),
            ));
        }

        return self::SUCCESS;
    }
}
