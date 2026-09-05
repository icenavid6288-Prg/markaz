<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class Seo
{
    /**
     * Build a public SEO payload from global settings and optional content SEO settings.
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

        $title = self::value($contentSettings, ['title', 'meta_title']) ?? $fallbackTitle;
        $description = self::value($contentSettings, ['description', 'meta_description']) ?? $fallbackDescription;
        $keywords = self::value($contentSettings, ['keywords', 'meta_keywords']) ?? $globalKeywords;
        $contentImage = self::value($contentSettings, ['og_image', 'image', 'cover_image', 'thumbnail']);
        // Search/filter parameters create duplicate URLs. Keep canonical URLs
        // stable for indexable public pages while preserving the current path.
        $canonical = $request->getSchemeAndHttpHost().$request->getPathInfo();
        $resolvedImage = self::absoluteUrl($contentImage ?: $image ?: $globalImage);

        if ($fallbackTitle === $siteName && $globalTitle !== '') {
            $title = $contentSettings['title'] ?? $contentSettings['meta_title'] ?? $globalTitle;
        } elseif ($title !== $globalTitle && ! Str::contains($title, $siteName)) {
            $title .= ' | '.$siteName;
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
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => $siteName,
                'url' => url('/'),
            ],
        ];

        if ($resolvedImage) {
            $pageSchema['image'] = $resolvedImage;
        }

        $pageSchema = array_replace($pageSchema, $schema);
        $pageSchema['@context'] = 'https://schema.org';

        return [
            'title' => $title,
            'description' => self::cleanDescription($description),
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
        if (isset($settings['seo']) && is_array($settings['seo'])) return self::unwrap($settings['seo']);
        if (isset($settings['meta']) && is_array($settings['meta'])) return self::unwrap($settings['meta']);
        return $settings;
    }

    /** @param array<string, mixed> $settings */
    private static function value(array $settings, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $settings[$key] ?? null;
            if (is_string($value) && trim($value) !== '') return trim($value);
        }
        return null;
    }

    private static function cleanDescription(string $description): string
    {
        $description = trim((string) preg_replace('/\s+/', ' ', strip_tags($description)));
        return mb_substr($description, 0, 170);
    }

    private static function absoluteUrl(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') return null;
        if (Str::startsWith($value, ['http://', 'https://', '//'])) return $value;
        return url('/'.ltrim($value, '/'));
    }

    /** @return array<string, mixed> */
    public static function organizationSchema(): array
    {
        $name = (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');
        $schema = [
            '@type' => 'LocalBusiness',
            '@id' => url('/').'#organization',
            'name' => $name,
            'url' => url('/'),
            'description' => (string) Setting::get('meta_description', Setting::get('site_slogan', '')),
            'telephone' => (string) Setting::get('phone', ''),
            'email' => (string) Setting::get('email', ''),
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => (string) Setting::get('address', ''),
                'addressCountry' => 'IR',
            ],
            'openingHours' => (string) Setting::get('working_hours', ''),
        ];

        $sameAs = array_values(array_filter([
            Setting::get('instagram_url'),
            Setting::get('eitaa_url'),
            Setting::get('website'),
        ], fn ($value) => is_string($value) && trim($value) !== ''));
        if ($sameAs !== []) $schema['sameAs'] = $sameAs;

        $logo = self::absoluteUrl(Setting::get('logo'));
        if ($logo) $schema['image'] = $logo;

        return $schema;
    }

    /** @param array<int, array{label: string, url: string}> $items */
    public static function breadcrumbSchema(array $items): array
    {
        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_values(array_map(fn (array $item, int $index) => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $item['label'],
                'item' => $item['url'],
            ], $items, array_keys($items))),
        ];
    }

    /** @param array<int, array{question: string, answer: string}> $faqs */
    public static function faqSchema(array $faqs): ?array
    {
        $entities = array_values(array_filter(array_map(fn (array $faq) => [
            '@type' => 'Question',
            'name' => trim($faq['question']),
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => trim($faq['answer'])],
        ], $faqs), fn (array $faq) => $faq['name'] !== '' && $faq['acceptedAnswer']['text'] !== ''));

        return $entities === [] ? null : ['@type' => 'FAQPage', 'mainEntity' => $entities];
    }
}
