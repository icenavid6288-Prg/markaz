<?php

namespace App\Support;

class SafeStoragePath
{
    public static function normalize(?string $path): ?string
    {
        $path = str_replace('\\', '/', ltrim((string) $path, '/'));

        if ($path === '' || str_contains($path, '..') || str_starts_with($path, '/')) {
            return null;
        }

        return $path;
    }
}
