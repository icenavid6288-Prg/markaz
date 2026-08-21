<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_public' => 'boolean',
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = app()->bound('settings.all')
            ? app('settings.all')
            : tap(Cache::rememberForever('settings.all', fn () => self::all(['group', 'key', 'value'])),
                fn ($value) => app()->instance('settings.all', $value));

        $setting = $settings->firstWhere('key', $key);
        $value = $setting?->value ?? $default;

        // Unwrap scalar values stored as ['value' => ...]
        if (is_array($value) && count($value) === 1 && array_key_exists('value', $value)) {
            return $value['value'];
        }

        return $value;
    }

    public static function getSecret(string $key, mixed $default = null): mixed
    {
        $value = self::get($key, $default);

        if ($value === null || $value === '') {
            return $default;
        }

        try {
            return Crypt::decryptString((string) $value);
        } catch (\Throwable) {
            // Preserve backwards compatibility with values entered before
            // encrypted integration settings were introduced.
            return $value;
        }
    }

    public static function setSecret(string $key, ?string $value, string $group = 'integrations'): void
    {
        if ($value === null || trim($value) === '') {
            return;
        }

        self::set($key, Crypt::encryptString(trim($value)), $group, false);
    }

    public static function set(string $key, mixed $value, string $group = 'general', bool $isPublic = false): void
    {
        self::updateOrCreate(['key' => $key], [
            'group' => $group,
            'value' => is_array($value) ? $value : ['value' => $value],
            'is_public' => $isPublic,
        ]);

        Cache::forget('settings.all');
        app()->forgetInstance('settings.all');
    }
}
