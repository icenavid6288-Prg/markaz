<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class Seo
{
    /**
     * Build the public SEO payload from global settings and optional content SEO settings.
     *
     * @param array<string, mixed>|null $contentSettings
     * @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    public static function page(
        Request $request,
        string $fallbackTitle,
        string $fallbackDescription,
        ?array $contentSettings = null,
        array $schema = [],
        ?string $image = null,
    ): array {
        $contentSettings = self::unwrap($contentSettings ?? []);
        $siteName = (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');
        $globalTitle = (string) Setting::get('meta_title', '');
        $globalDescription = (string) Setting::get('meta_description', '');
        $globalKeywords = (string) Setting::get('keywords', '');
        $globalImage = Setting::get('og_image');

        $title = self::value($contentSettings, ['title', 'meta_title'])
            ?? $fallbackTitle;
        $description = self::value($contentSettings, ['description', 'meta_description'])
            ?? $fallbackDescription;
        $keywords = self::value($contentSettings, ['keywords', 'meta_keywords'])
            ?? $globalKeywords;
        $contentImage = self::value($contentSettings, ['og_image', 'image', 'cover_image', 'thumbnail']);
        $canonical = $request->url();
        $resolvedImage = self::absoluteUrl($contentImage ?: $image ?: $globalImage);

        // The global SEO title/description are the canonical defaults for the homepage.
        if ($fallbackTitle === $siteName && $globalTitle !== '') {
            $title = $contentSettings['title'] ?? $contentSettings['meta_title'] ?? $globalTitle;
        } elseif ($title !== $globalTitle && ! Str::contains($title, $siteName)) {
            $title = $title.' | '.$siteName;
        }

        if ($description === $fallbackDescription && $globalDescription !== '' && $fallbackTitle === $siteName) {
            $description = $globalDescription;
        }

        $pageSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => $title,
            'description' => $description,
            'url' => $canonical,
            'inLanguage' => 'fa-IR',
        ];

        if ($resolvedImage) {
            $pageSchema['image'] = $resolvedImage;
        }

        $pageSchema = array_replace($pageSchema, $schema);
        $pageSchema['@context'] = 'https://schema.org';

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'canonical' => $canonical,
            'image' => $resolvedImage,
            'type' => $schema['@type'] ?? 'website',
            'schema' => $pageSchema,
        ];
    }

    /** @param array<string, mixed> $settings */
    private static function unwrap(array $settings): array
    {
        if (isset($settings['seo']) && is_array($settings['seo'])) {
            return self::unwrap($settings['seo']);
        }

        if (isset($settings['meta']) && is_array($settings['meta'])) {
            return self::unwrap($settings['meta']);
        }

        return $settings;
    }

    /** @param array<string, mixed> $settings */
    private static function value(array $settings, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $settings[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    private static function absoluteUrl(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://', '//'])) {
            return $value;
        }

        return url('/'.ltrim($value, '/'));
    }
}
