<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use App\Models\Setting;
use App\Models\User;
use App\Support\PageContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Built-in fallback navigation used whenever the menus table has no
     * active row for a location (e.g. an empty/reset database), so the
     * header/footer never disappear even if the DB is empty.
     */
    private function defaultMenus(): array
    {
        return [
            'header' => [
                ['title' => 'خانه', 'url' => '/', 'children' => []],
                ['title' => 'دوره‌ها', 'url' => '/courses', 'children' => []],
                ['title' => 'کوچینگ', 'url' => '/coaching', 'children' => []],
                ['title' => 'خدمات', 'url' => '/services', 'children' => []],
                ['title' => 'فروشگاه', 'url' => '/shop', 'children' => [
                    ['title' => 'کتاب‌ها', 'url' => '/shop?type=book', 'children' => []],
                    ['title' => 'پادکست', 'url' => '/shop?type=podcast', 'children' => []],
                ]],
                ['title' => 'بلاگ', 'url' => '/blog', 'children' => []],
                ['title' => 'درباره ما', 'url' => '/about', 'children' => []],
                ['title' => 'تیم ما', 'url' => '/team', 'children' => []],
                ['title' => 'تماس با ما', 'url' => '/contact', 'children' => []],
            ],
            'footer' => [
                ['title' => 'دوره‌ها', 'url' => '/courses', 'children' => []],
                ['title' => 'کوچینگ', 'url' => '/coaching', 'children' => []],
                ['title' => 'خدمات', 'url' => '/services', 'children' => []],
                ['title' => 'فروشگاه', 'url' => '/shop', 'children' => []],
                ['title' => 'بلاگ', 'url' => '/blog', 'children' => []],
                ['title' => 'تیم ما', 'url' => '/team', 'children' => []],
            ],
        ];
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $menus = Cache::remember('public.menus.v1', now()->addMinutes(5), function () {
            $defaults = $this->defaultMenus();
            $header = Menu::where('location', 'header')->where('is_active', true)->first();
            $footer = Menu::where('location', 'footer')->where('is_active', true)->first();

            return [
                // Fall back to the built-in menu whenever the database row is
                // missing (e.g. a freshly reset preview database).
                'header' => $header?->items ?? $defaults['header'],
                'footer' => $footer?->items ?? $defaults['footer'],
            ];
        });

        // Resolve through Laravel so production hosts do not depend on a
        // local APP_URL, a development port, or a public/storage symlink.
        $logo = '/site-logo';
        $heroBackground = (string) (Setting::get('homepage_hero_background', '') ?: '');
        $path = $request->path();
        $pageKey = PageContent::forPath($path);
        if ($pageKey === null && (
            $path === 'login' || str_starts_with($path, 'login/') ||
            $path === 'admin/login' ||
            $path === 'register' ||
            str_starts_with($path, 'forgot-password') ||
            str_starts_with($path, 'reset-password') ||
            str_starts_with($path, 'verify-email') ||
            str_starts_with($path, 'email/') ||
            str_starts_with($path, 'confirm-password')
        )) {
            // All auth pages share the same brand panel (site description) and background.
            $pageKey = 'login';
        }
        $pageContent = $pageKey ? PageContent::get($pageKey) : null;
        if (preg_match('#^https?://#i', $heroBackground)) {
            $heroBackground = (string) (parse_url($heroBackground, PHP_URL_PATH) ?: '');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                    'unread_notifications' => (int) $user->unreadNotifications()->count(),
                ] : null,
            ],
            'authModal' => fn () => session('auth_modal'),
            'site' => [
                'name' => Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی'),
                'slogan' => Setting::get('site_slogan', ''),
                'logo' => $logo,
                'popup' => [
                    'enabled' => in_array((string) Setting::get('popup_enabled', '1'), ['1', 'true'], true),
                    'title' => Setting::get('popup_title', 'مسیر رشد فرزندتان را آگاهانه شروع کنید'),
                    'message' => Setting::get('popup_message', 'در یک جلسه مشاوره رایگان، اولین قدم مسیر رشد نوجوانتان را با همراهی متخصصان بردارید.'),
                    'cta_label' => Setting::get('popup_cta_label', 'رزرو مشاوره رایگان'),
                    'cta_url' => Setting::get('popup_cta_url', '/contact'),
                    'delay_seconds' => max(0, min(30, (int) Setting::get('popup_delay_seconds', 4))),
                    'frequency' => in_array(Setting::get('popup_frequency', 'session'), ['session', 'daily', 'once', 'always'], true) ? Setting::get('popup_frequency', 'session') : 'session',
                ],
                'contact' => [
                    'address' => Setting::get('address', ''),
                    'phone' => Setting::get('phone', ''),
                    'email' => Setting::get('email', ''),
                    'eitaa' => Setting::get('eitaa', ''),
                    'website' => Setting::get('website', ''),
                    'working_hours' => Setting::get('working_hours', ''),
                ],
                'social' => [
                    'instagram' => Setting::get('instagram_url', ''),
                    'eitaa' => Setting::get('eitaa_url', ''),
                ],
                'enamad' => [
                    'enabled' => in_array((string) Setting::get('enamad_enabled', '0'), ['1', 'true'], true),
                    'title' => Setting::get('enamad_title', 'نماد اعتماد الکترونیکی'),
                    'image_url' => Setting::get('enamad_image_url', ''),
                    'link_url' => Setting::get('enamad_link_url', ''),
                ],
                'hero' => [
                    'title' => Setting::get('homepage_hero_title', ''),
                    'subtitle' => Setting::get('homepage_hero_subtitle', ''),
                    'image' => Setting::get('homepage_hero_image', ''),
                    'background' => $heroBackground,
                    'cta_primary' => Setting::get('homepage_cta_primary', ''),
                    'cta_secondary' => Setting::get('homepage_cta_secondary', ''),
                ],
                'chat' => [
                    'enabled' => in_array((string) Setting::get('chat_enabled', '1'), ['1', 'true'], true),
                    'title' => (string) Setting::get('chat_title', 'پشتیبانی زنده'),
                    'greeting' => (string) Setting::get('chat_greeting', 'سلام! 👋 به پشتیبانی مرکز رشد و کارآفرینی دکتر بیدی خوش آمدید. سؤال خود را بپرسید تا پاسخ بگیرید.'),
                    'ai_enabled' => in_array((string) Setting::get('chat_ai_enabled', '0'), ['1', 'true'], true),
                ],
            ],
            'menus' => $menus,
            'pageContent' => $pageContent,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }

}
