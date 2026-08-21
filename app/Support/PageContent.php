<?php

namespace App\Support;

use App\Models\Setting;

class PageContent
{
    /** @return array<string, array<string, mixed>> */
    public static function registry(): array
    {
        return [
            'home' => [
                'label' => 'صفحه اصلی', 'path' => '/', 'icon' => 'House',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب بالای Hero', 'type' => 'text', 'value' => 'مرکز رشد و کارآفرینی دکتر بیدی', 'icon' => 'Sparkles'],
                    'hero_title' => ['label' => 'عنوان اصلی Hero', 'type' => 'textarea', 'value' => 'مسیر آینده فرزندانتان را با آگاهی و هدف طراحی کنید', 'icon' => 'Route'],
                    'hero_subtitle' => ['label' => 'توضیح Hero', 'type' => 'textarea', 'value' => 'با شناخت استعدادها، آموزش مهارت‌های آینده و کوچینگ تخصصی، مسیر رشد نوجوانتان را آگاهانه بسازید.', 'icon' => 'MessageCircle'],
                    'hero_cta_primary' => ['label' => 'متن دکمه اول', 'type' => 'text', 'value' => 'دریافت مشاوره رایگان', 'icon' => 'Phone'],
                    'hero_cta_secondary' => ['label' => 'متن دکمه دوم', 'type' => 'text', 'value' => 'آشنایی با خدمات', 'icon' => 'ArrowLeft'],
                    'hero_icon' => ['label' => 'آیکون Hero (نام Lucide)', 'type' => 'icon', 'value' => 'Sparkles', 'icon' => 'Sparkles'],
                    'hero_video' => ['label' => 'ویدیوی Hero (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'services_title' => ['label' => 'عنوان بخش خدمات', 'type' => 'text', 'value' => 'راهکارهایی جامع برای رشد و پیشرفت نوجوانان', 'icon' => 'Boxes'],
                    'services_description' => ['label' => 'توضیح بخش خدمات', 'type' => 'textarea', 'value' => 'از ارزیابی استعداد تا کوچینگ تخصصی و آموزش مدرسین؛ همه خدمات برای مسیر رشد شما آماده است.', 'icon' => 'Text'],
                    'services_image' => ['label' => 'تصویر بخش خدمات', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'services_video' => ['label' => 'ویدیوی بخش خدمات (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'pm_eyebrow' => ['label' => 'برچسب بخش بازاریابی عملکردی', 'type' => 'text', 'value' => 'بازاریابی عملکردی', 'icon' => 'ChartNoAxesCombined'],
                    'pm_title' => ['label' => 'عنوان بخش بازاریابی عملکردی', 'type' => 'text', 'value' => 'مدل‌های قیمت‌گذاری؛ فقط برای نتیجه هزینه کنید', 'icon' => 'Target'],
                    'pm_description' => ['label' => 'توضیح بخش بازاریابی عملکردی', 'type' => 'textarea', 'value' => 'در مدل پرداخت به‌ازای نتیجه، بودجه شما فقط صرف اقدامی واقعی می‌شود؛ کلیک، لید، نصب یا فروش. مدل متناسب با هدف کمپین‌تان را انتخاب کنید.', 'icon' => 'Text'],
                    'pm_models' => ['label' => 'مدل‌های قیمت‌گذاری (لیست پویا)', 'type' => 'models', 'value' => json_encode([
                        ['code' => 'CPC', 'name' => 'هزینه به ازای هر کلیک', 'price' => 'از ۱٬۵۰۰ تومان', 'description' => 'برای هر کلیک روی تبلیغ هزینه می‌کنید؛ مناسب کمپین‌های ترافیک و آگاهی از برند.'],
                        ['code' => 'CPM', 'name' => 'هزینه به ازای هر ۱٬۰۰۰ نمایش', 'price' => 'از ۲۰۰٬۰۰۰ تومان', 'description' => 'پرداخت به‌ازای هر هزار نمایش تبلیغ؛ برای دیده‌شدن برند در مقیاس بالا.'],
                        ['code' => 'CPA', 'name' => 'هزینه به ازای هر اقدام', 'price' => 'قابل مذاکره', 'description' => 'فقط وقتی هزینه می‌دهید که اقدام هدف (ثبت‌نام، مشاوره یا خرید) انجام شود؛ کمترین ریسک برای شما.'],
                        ['code' => 'CPL', 'name' => 'هزینه به ازای هر لید', 'price' => 'قابل مذاکره', 'description' => 'پرداخت به‌ازای هر لید واقعی (تکمیل فرم یا تماس)؛ مناسب تیم‌های فروش و جذب مشتری.'],
                        ['code' => 'CPO', 'name' => 'هزینه به ازای هر سفارش', 'price' => 'قابل مذاکره', 'description' => 'پرداخت به‌ازای هر سفارش ثبت‌شده؛ انتخاب ایده‌آل فروشگاه‌های اینترنتی.'],
                        ['code' => 'CPI', 'name' => 'هزینه به ازای هر نصب', 'price' => 'قابل مذاکره', 'description' => 'پرداخت به‌ازای هر نصب اپلیکیشن؛ مناسب کمپین‌های رشد اپ و محصولات دیجیتال.'],
                        ['code' => 'CPV', 'name' => 'هزینه به ازای هر بازدید ویدیو', 'price' => 'قابل مذاکره', 'description' => 'پرداخت به‌ازای هر نمایش یا تماشای ویدیو؛ برای تعامل با محتوای ویدیویی.'],
                        ['code' => 'CPS', 'name' => 'هزینه به ازای هر فروش', 'price' => 'مشارکت در درآمد', 'description' => 'درصدی از فروش نهایی؛ هم‌سویی کامل هدف شما با تیم اجرا و کمترین ریسک مالی.'],
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'icon' => 'List'],
                    'why_title' => ['label' => 'عنوان بخش چرا ما', 'type' => 'text', 'value' => 'اعتماد خانواده‌ها، ساخته‌شده با نتیجه', 'icon' => 'Award'],
                    'why_image' => ['label' => 'تصویر بخش چرا ما', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'why_video' => ['label' => 'ویدیوی بخش چرا ما (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'method_image' => ['label' => 'تصویر بخش روش و مسیر رشد', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'method_video' => ['label' => 'ویدیوی بخش روش و مسیر رشد (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'courses_image' => ['label' => 'تصویر بخش دوره‌ها', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'courses_video' => ['label' => 'ویدیوی بخش دوره‌ها (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'testimonials_image' => ['label' => 'تصویر بخش نتایج خانواده‌ها', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'testimonials_video' => ['label' => 'ویدیوی بخش نتایج خانواده‌ها (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'content_image' => ['label' => 'تصویر بخش محتوای آموزشی', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'content_video' => ['label' => 'ویدیوی بخش محتوای آموزشی (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'cta_title' => ['label' => 'عنوان دعوت به اقدام', 'type' => 'text', 'value' => 'اولین قدم مسیر رشد فرزندتان را همین امروز بردارید', 'icon' => 'Rocket'],
                    'cta_description' => ['label' => 'توضیح دعوت به اقدام', 'type' => 'textarea', 'value' => 'فرم زیر را پر کنید؛ کارشناسان ما در اولین فرصت با شما تماس می‌گیرند و ارزیابی اولیه رایگان انجام می‌شود.', 'icon' => 'MessageSquare'],
                    'cta_image' => ['label' => 'تصویر بخش دعوت به اقدام', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                    'cta_video' => ['label' => 'ویدیوی بخش دعوت به اقدام (یوتیوب، ویمیو یا MP4)', 'type' => 'video', 'value' => '', 'icon' => 'Video'],
                    'quick_1_icon' => ['label' => 'آیکون قابلیت سریع اول', 'type' => 'icon', 'value' => 'Compass', 'icon' => 'Compass'],
                    'quick_2_icon' => ['label' => 'آیکون قابلیت سریع دوم', 'type' => 'icon', 'value' => 'BookOpen', 'icon' => 'BookOpen'],
                    'quick_3_icon' => ['label' => 'آیکون قابلیت سریع سوم', 'type' => 'icon', 'value' => 'Users', 'icon' => 'Users'],
                    'quick_4_icon' => ['label' => 'آیکون قابلیت سریع چهارم', 'type' => 'icon', 'value' => 'HeartHandshake', 'icon' => 'HeartHandshake'],
                    'why_1_icon' => ['label' => 'آیکون دلیل اول', 'type' => 'icon', 'value' => 'Target', 'icon' => 'Target'],
                    'why_2_icon' => ['label' => 'آیکون دلیل دوم', 'type' => 'icon', 'value' => 'Award', 'icon' => 'Award'],
                    'why_3_icon' => ['label' => 'آیکون دلیل سوم', 'type' => 'icon', 'value' => 'FlaskConical', 'icon' => 'FlaskConical'],
                    'why_4_icon' => ['label' => 'آیکون دلیل چهارم', 'type' => 'icon', 'value' => 'HeartHandshake', 'icon' => 'HeartHandshake'],
                    'method_1_icon' => ['label' => 'آیکون روش اول', 'type' => 'icon', 'value' => 'Lightbulb', 'icon' => 'Lightbulb'],
                    'method_2_icon' => ['label' => 'آیکون روش دوم', 'type' => 'icon', 'value' => 'Compass', 'icon' => 'Compass'],
                    'method_3_icon' => ['label' => 'آیکون روش سوم', 'type' => 'icon', 'value' => 'Rocket', 'icon' => 'Rocket'],
                ],
            ],
            'login' => [
                'label' => 'صفحه ورود', 'path' => '/login', 'icon' => 'LogIn',
                'fields' => [
                    'panel_kicker' => ['label' => 'برچسب بالای پنل توضیحات', 'type' => 'text', 'value' => 'مسیر رشد، از همین‌جا آغاز می‌شود', 'icon' => 'Sparkles'],
                    'panel_title' => ['label' => 'عنوان پنل توضیحات', 'type' => 'textarea', 'value' => 'هر نوجوان یک مسیر دارد؛', 'icon' => 'Route'],
                    'panel_title_accent' => ['label' => 'تکمله عنوان (رنگ طلایی)', 'type' => 'text', 'value' => 'ما آن را کشف می‌کنیم.', 'icon' => 'Sparkles'],
                    'panel_description' => ['label' => 'توضیحات مجموعه', 'type' => 'textarea', 'value' => 'از شناخت استعدادها تا طراحی مسیر، آموزش مهارت‌های آینده و همراهی تا استقلال؛ تمام مسیر با برنامه‌ای شخصی‌سازی‌شده برای فرزند شما.', 'icon' => 'MessageCircle'],
                    'journey_label' => ['label' => 'عنوان ایستگاه‌ها', 'type' => 'text', 'value' => 'هفت ایستگاه سفر رشد', 'icon' => 'Compass'],
                    'journey_stations' => ['label' => 'ایستگاه‌ها (با ویرگول جدا کنید)', 'type' => 'textarea', 'value' => 'شناخت، کشف، تجربه، مهارت، تصمیم، اجرا، استقلال', 'icon' => 'Route'],
                    'trust_1' => ['label' => 'نقطه قوت اول', 'type' => 'text', 'value' => 'روش اختصاصی طراحی مسیر رشد', 'icon' => 'ShieldCheck'],
                    'trust_2' => ['label' => 'نقطه قوت دوم', 'type' => 'text', 'value' => 'کوچینگ تخصصی ۱ به ۱', 'icon' => 'ShieldCheck'],
                    'trust_3' => ['label' => 'نقطه قوت سوم', 'type' => 'text', 'value' => 'پشتیبانی مستمر خانواده‌ها', 'icon' => 'ShieldCheck'],
                    'background_image' => ['label' => 'تصویر پس‌زمینه صفحه ورود', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                ],
            ],
            'team' => [
                'label' => 'صفحه تیم ما', 'path' => '/team', 'icon' => 'UsersRound',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'تیم ما', 'icon' => 'UsersRound'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'مدرس‌ها، کوچ‌ها و همکارانی که مسیر را می‌سازند', 'icon' => 'Users'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'هر عضو این تیم، بخشی از مسیر رشد فرزند شماست؛ از مدرس‌های مهارت‌های آینده تا کوچ‌های اختصاصی و کارشناسان پشتیبان.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'UsersRound', 'icon' => 'UsersRound'],
                    'hero_image' => ['label' => 'عکس کلی تیم در سکشن اول', 'type' => 'image', 'value' => '', 'icon' => 'Image'],
                ],
            ],
            'courses' => [
                'label' => 'صفحه دوره‌ها', 'path' => '/courses', 'icon' => 'GraduationCap',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'آکادمی مسیر رشد', 'icon' => 'BookOpen'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'دوره‌هایی برای ساختن مهارت‌های آینده', 'icon' => 'GraduationCap'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'یادگیری از جایی شروع می‌شود که مسیر مناسب خودت را پیدا کنی. دوره‌های کاربردی مرکز رشد برای نوجوانان، والدین و مدرسین طراحی شده‌اند.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'GraduationCap', 'icon' => 'GraduationCap'],
                ],
            ],
            'services' => [
                'label' => 'صفحه خدمات', 'path' => '/services', 'icon' => 'Boxes',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'خدمات ما', 'icon' => 'Boxes'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'راهکارهای جامع برای هر مرحله از مسیر رشد', 'icon' => 'Route'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'از ارزیابی علمی استعداد تا کوچینگ تخصصی و تربیت مدرس؛ هر خدمت با یک برنامه مشخص و پشتیبانی مستمر.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'Boxes', 'icon' => 'Boxes'],
                ],
            ],
            'coaching' => [
                'label' => 'صفحه کوچینگ', 'path' => '/coaching', 'icon' => 'HeartHandshake',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'کوچینگ', 'icon' => 'HeartHandshake'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'کوچ اختصاصی، همراه مسیر رشد فرزند شما', 'icon' => 'Users'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'در جلسات یک‌به‌یک کوچینگ، نوجوان استعدادهایش را می‌شناسد، مهارت می‌سازد و با برنامه قدم برمی‌دارد؛ و شما همیشه در جریان پیشرفت او هستید.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'HeartHandshake', 'icon' => 'HeartHandshake'],
                ],
            ],
            'about' => [
                'label' => 'صفحه درباره ما', 'path' => '/about', 'icon' => 'Users',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'درباره ما', 'icon' => 'Users'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'مرکزی برای طراحی مسیر آینده نوجوانان', 'icon' => 'Route'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'مرکز رشد و کارآفرینی دکتر بیدی با تلفیق آموزش، کوچینگ و ارزیابی علمی، به نوجوانان کمک می‌کند استعدادهایشان را بشناسند و مسیر آینده‌شان را آگاهانه طراحی کنند.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'Users', 'icon' => 'Users'],
                ],
            ],
            'contact' => [
                'label' => 'صفحه تماس با ما', 'path' => '/contact', 'icon' => 'Phone',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'تماس با ما', 'icon' => 'Phone'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'بیایید درباره مسیر فرزندتان گفتگو کنیم', 'icon' => 'MessageCircle'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'فرم زیر را پر کنید؛ کارشناسان ما در اولین فرصت با شما تماس می‌گیرند و ارزیابی اولیه رایگان انجام می‌شود.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'Phone', 'icon' => 'Phone'],
                ],
            ],
            'blog' => [
                'label' => 'صفحه بلاگ', 'path' => '/blog', 'icon' => 'Newspaper',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'بلاگ و دانش‌نامه', 'icon' => 'Newspaper'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'بخوانید، یاد بگیرید، همراه شوید', 'icon' => 'BookOpen'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'مقالات تخصصی درباره استعدادیابی، کوچینگ نوجوان، مهارت‌های آینده و تربیت؛ نوشته‌شده برای خانواده‌ها و مدرسین.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'Newspaper', 'icon' => 'Newspaper'],
                ],
            ],
            'shop' => [
                'label' => 'صفحه فروشگاه', 'path' => '/shop', 'icon' => 'ShoppingBag',
                'fields' => [
                    'hero_eyebrow' => ['label' => 'برچسب صفحه', 'type' => 'text', 'value' => 'فروشگاه', 'icon' => 'ShoppingBag'],
                    'hero_title' => ['label' => 'عنوان صفحه', 'type' => 'textarea', 'value' => 'کتاب‌ها، پادکست‌ها و محتوای آموزشی', 'icon' => 'BookOpen'],
                    'hero_subtitle' => ['label' => 'توضیح صفحه', 'type' => 'textarea', 'value' => 'محصولات آموزشی مجموعه برای همراهی خانواده‌ها و مدرسین؛ نسخه چاپی و دیجیتال.', 'icon' => 'Text'],
                    'hero_icon' => ['label' => 'آیکون صفحه (نام Lucide)', 'type' => 'icon', 'value' => 'ShoppingBag', 'icon' => 'ShoppingBag'],
                ],
            ],
        ];
    }

    /** @return array<string, mixed> */
    public static function get(string $page): array
    {
        $definition = self::registry()[$page] ?? self::registry()['home'];
        $saved = Setting::get('page_content_'.$page, []);
        $savedFields = is_array($saved) && is_array($saved['fields'] ?? null) ? $saved['fields'] : [];

        foreach ($definition['fields'] as $key => &$field) {
            if (array_key_exists($key, $savedFields)) {
                $field['value'] = (string) $savedFields[$key];
            }
        }
        unset($field);

        return ['key' => $page, 'label' => $definition['label'], 'path' => $definition['path'], 'icon' => $definition['icon'], 'fields' => $definition['fields']];
    }

    /** @return array<string, array<string, mixed>> */
    public static function all(): array
    {
        $pages = [];
        foreach (array_keys(self::registry()) as $page) {
            $pages[$page] = self::get($page);
        }

        return $pages;
    }

    public static function forPath(string $path): ?string
    {
        $path = trim($path, '/');
        if ($path === '') return 'home';
        $first = explode('/', $path)[0];

        return array_key_exists($first, self::registry()) ? $first : null;
    }

    /** @param array<string, mixed> $fields */
    public static function save(string $page, array $fields): void
    {
        $definition = self::registry()[$page] ?? null;
        if (! $definition) return;

        $allowed = [];
        foreach ($definition['fields'] as $key => $field) {
            $value = $fields[$key] ?? $field['value'];
            $allowed[$key] = is_scalar($value) ? trim((string) $value) : '';
        }

        Setting::set('page_content_'.$page, ['fields' => $allowed], 'pages', true);
    }
}
