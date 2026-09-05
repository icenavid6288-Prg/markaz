<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Event;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\Menu;
use App\Models\Product;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Service;
use App\Models\TeamMember;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->categories();
        $this->menu();
        $this->services();
        $this->courses();
        $this->products();
        $this->testimonials();
        $this->teamMembers();
        $this->blog();
        $this->events();
    }

    private function events(): void
    {
        Event::updateOrCreate(['slug' => 'webinar-ai-future-skills'], [
            'type' => 'webinar',
            'title' => 'وبینار: هوش مصنوعی و مهارت‌های آینده نوجوانان',
            'summary' => 'وبینار آنلاین درباره نقش هوش مصنوعی در آینده شغلی نوجوانان و مهارت‌هایی که باید از امروز یاد بگیرند.',
            'description' => 'در این وبینار ۹۰ دقیقه‌ای، درباره تاثیر هوش مصنوعی بر بازار کار آینده، ابزارهای هوش مصنوعی مناسب نوجوانان و روش‌های یادگیری عملی صحبت می‌کنیم. این وبینار برای والدین و نوجوانان ۱۲ تا ۱۸ سال طراحی شده است.',
            'speaker' => 'دکتر بیدی',
            'event_date' => now()->subDays(7),
            'duration_minutes' => 90,
            'location' => 'آنلاین (زوم)',
            'price' => 0,
            'discount_price' => null,
            'status' => 'published',
            'is_featured' => true,
        ]);
    }

    private function categories(): void
    {
        $items = [
            ['name' => 'کشف استعداد', 'slug' => 'talent-discovery', 'type' => 'course', 'icon' => 'sparkles'],
            ['name' => 'مهارت‌های آینده', 'slug' => 'future-skills', 'type' => 'course', 'icon' => 'rocket'],
            ['name' => 'کوچینگ تحصیلی', 'slug' => 'academic-coaching', 'type' => 'course', 'icon' => 'graduation-cap'],
            ['name' => 'مدرسین و مربیان', 'slug' => 'trainers', 'type' => 'course', 'icon' => 'users'],
            ['name' => 'کتاب‌ها', 'slug' => 'books', 'type' => 'product', 'icon' => 'book'],
            ['name' => 'پادکست', 'slug' => 'podcast', 'type' => 'product', 'icon' => 'mic'],
            ['name' => 'مقالات', 'slug' => 'articles', 'type' => 'blog', 'icon' => 'newspaper'],
            ['name' => 'استعدادیابی', 'slug' => 'talent-discovery-blog', 'type' => 'blog', 'icon' => 'sparkles'],
            ['name' => 'مهارت‌های آینده', 'slug' => 'future-skills-blog', 'type' => 'blog', 'icon' => 'rocket'],
            ['name' => 'کوچینگ و روانشناسی', 'slug' => 'coaching-psychology', 'type' => 'blog', 'icon' => 'heart-handshake'],
            ['name' => 'تجربه والدین', 'slug' => 'parent-experience', 'type' => 'blog', 'icon' => 'users'],
        ];

        foreach ($items as $item) {
            Category::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }

    private function menu(): void
    {
        $items = [
            ['title' => 'خانه', 'url' => '/', 'children' => []],
            ['title' => 'دوره‌ها', 'url' => '/courses', 'children' => []],
            ['title' => 'کوچینگ', 'url' => '/coaching', 'children' => []],
            ['title' => 'خدمات', 'url' => '/services', 'children' => []],
            ['title' => 'فروشگاه', 'url' => '/shop', 'children' => [
                ['title' => 'کتاب‌ها', 'url' => '/shop/books', 'children' => []],
                ['title' => 'پادکست', 'url' => '/podcasts', 'children' => []],
            ]],
            ['title' => 'بلاگ', 'url' => '/blog', 'children' => []],
            ['title' => 'درباره ما', 'url' => '/about', 'children' => []],
            ['title' => 'تیم ما', 'url' => '/team', 'children' => []],
            ['title' => 'تماس با ما', 'url' => '/contact', 'children' => []],
            ['title' => 'وبینارها و سمینارها', 'url' => '/events', 'children' => []],
        ];

        Menu::updateOrCreate(['location' => 'header'], [
            'name' => 'منوی اصلی',
            'items' => $items,
            'is_active' => true,
        ]);

        Menu::updateOrCreate(['location' => 'footer'], [
            'name' => 'منوی فوتر',
            'items' => [
                ['title' => 'دوره‌ها', 'url' => '/courses', 'children' => []],
                ['title' => 'کوچینگ', 'url' => '/coaching', 'children' => []],
                ['title' => 'خدمات', 'url' => '/services', 'children' => []],
                ['title' => 'فروشگاه', 'url' => '/shop', 'children' => []],
                ['title' => 'بلاگ', 'url' => '/blog', 'children' => []],
                ['title' => 'تیم ما', 'url' => '/team', 'children' => []],
                ['title' => 'وبینارها و سمینارها', 'url' => '/events', 'children' => []],
            ],
            'is_active' => true,
        ]);
    }

    private function services(): void
    {
        $items = [
            [
                'title' => 'کوچینگ رشد نوجوان',
                'slug' => 'teen-growth-coaching',
                'summary' => 'برنامه اختصاصی یک‌به‌یک برای کشف استعداد و طراحی مسیر رشد نوجوان',
                'description' => 'در این برنامه، نوجوان در یک سفر ۱۲ هفته‌ای با کمک کوچ اختصاصی خود، استعدادها و علایقش را کشف می‌کند، مهارت‌های کلیدی را می‌آموزد و مسیر آینده خود را طراحی می‌کند.',
                'icon' => 'compass',
                'price' => 18000000,
                'is_featured' => true,
                'features' => ['ارزیابی تخصصی استعداد', 'جلسات هفتگی ۱:۱', 'گزارش ماهانه برای والدین', 'برنامه عملی رشد'],
                'process' => ['شناخت و ارزیابی', 'کشف استعداد', 'آموزش مهارت', 'طراحی مسیر', 'اجرا و پشتیبانی'],
                'target_audience' => ['نوجوانان ۱۲ تا ۱۸ سال', 'والدینی که به دنبال مسیر روشن برای فرزندشان هستند'],
                'outcomes' => ['شناخت دقیق استعدادها', 'افزایش اعتمادبه‌نفس', 'برنامه عملی ۶ ماهه'],
                'faqs' => [
                    ['q' => 'جلسات حضوری است یا آنلاین؟', 'a' => 'هر دو. جلسات به صورت حضوری در مرکز یا آنلاین برگزار می‌شود.'],
                    ['q' => 'چند جلسه لازم است؟', 'a' => 'برنامه پایه ۱۲ جلسه هفتگی است و بسته به نیاز قابل تمدید.'],
                ],
                'cta_text' => 'رزرو جلسه مشاوره',
                'cta_url' => '/contact',
                'sort_order' => 1,
            ],
            [
                'title' => 'کشف استعداد نوجوان',
                'slug' => 'talent-discovery',
                'summary' => 'ارزیابی تخصصی و علمی استعدادها، علایق و توانمندی‌های نوجوان',
                'description' => 'با ترکیب آزمون‌های معتبر، مصاحبه تخصصی و مشاهده رفتاری، نقشه استعداد فرزند شما ترسیم می‌شود.',
                'icon' => 'sparkles',
                'price' => 3500000,
                'is_featured' => true,
                'features' => ['آزمون‌های معتبر استعدادسنجی', 'مصاحبه تخصصی', 'گزارش جامع ۲۰ صفحه‌ای', 'جلسه تفسیر نتایج با والدین'],
                'process' => ['ثبت‌نام', 'آزمون آنلاین', 'مصاحبه حضوری', 'تفسیر و گزارش'],
                'target_audience' => ['نوجوانان ۱۰ تا ۱۸ سال'],
                'outcomes' => ['نقشه استعداد', 'مسیرهای پیشنهادی', 'گزارش والدین'],
                'faqs' => [
                    ['q' => 'آزمون چقدر طول می‌کشد؟', 'a' => 'حدود ۲ ساعت آنلاین + ۱ جلسه حضوری.'],
                ],
                'cta_text' => 'ثبت‌نام در ارزیابی',
                'cta_url' => '/contact',
                'sort_order' => 2,
            ],
            [
                'title' => 'کوچینگ تحصیلی',
                'slug' => 'academic-coaching',
                'summary' => 'برنامه‌ریزی درسی، تقویت انگیزه و بهبود عملکرد تحصیلی',
                'description' => 'کوچینگ تحصیلی به نوجوان کمک می‌کند روش صحیح درس خواندن، مدیریت زمان و هدف‌گذاری را یاد بگیرد.',
                'icon' => 'graduation-cap',
                'price' => 12000000,
                'is_featured' => true,
                'features' => ['برنامه‌ریزی درسی هفتگی', 'تقویت انگیزه و عادت مطالعه', 'آمادگی امتحان', 'گزارش پیشرفت'],
                'process' => ['ارزیابی وضعیت تحصیلی', 'طراحی برنامه', 'جلسات هفتگی', 'ارزیابی مجدد'],
                'target_audience' => ['دانش‌آموزان متوسطه اول و دوم'],
                'outcomes' => ['بهبود معدل', 'عادت مطالعه مؤثر', 'کاهش استرس امتحان'],
                'faqs' => [],
                'cta_text' => 'دریافت مشاوره',
                'cta_url' => '/contact',
                'sort_order' => 3,
            ],
            [
                'title' => 'آموزش و تربیت مدرسین',
                'slug' => 'trainer-academy',
                'summary' => 'توانمندسازی مدرسین و معلمان در روش‌های نوین آموزش و تربیت',
                'description' => 'دوره جامع تربیت مدرس با تمرکز بر روش‌های نوین تدریس، روان‌شناسی یادگیری و طراحی جلسه آموزشی.',
                'icon' => 'users',
                'price' => 9000000,
                'is_featured' => true,
                'features' => ['روش‌های نوین تدریس', 'روان‌شناسی یادگیری', 'کارگاه عملی', 'گواهینامه معتبر'],
                'process' => ['ثبت‌نام', 'آموزش آنلاین', 'کارگاه عملی', 'ارزیابی و گواهی'],
                'target_audience' => ['معلمان', 'مدرسین', 'مربیان آموزشی'],
                'outcomes' => ['توانمندی تدریس', 'گواهینامه', 'شبکه مدرسین'],
                'faqs' => [],
                'cta_text' => 'ثبت‌نام در دوره',
                'cta_url' => '/contact',
                'sort_order' => 4,
            ],
            [
                'title' => 'Business Coaching',
                'slug' => 'business-coaching',
                'summary' => 'کوچینگ کسب‌وکار برای کارآفرینان و مدیران',
                'description' => 'جلسات کوچینگ تخصصی برای توسعه فردی و حرفه‌ای کارآفرینان، مدیران و افرادی که به دنبال رشد حرفه‌ای هستند.',
                'icon' => 'briefcase',
                'price' => 15000000,
                'is_featured' => false,
                'features' => ['جلسات ۱:۱', 'تحلیل کسب‌وکار', 'برنامه رشد', 'پشتیبانی ۳ ماهه'],
                'process' => ['مصاحبه اولیه', 'تحلیل وضعیت', 'جلسات هفتگی', 'ارزیابی نتایج'],
                'target_audience' => ['کارآفرینان', 'مدیران', 'متخصصان در حال رشد'],
                'outcomes' => ['شفافیت مسیر', 'رشد درآمد', 'مهارت رهبری'],
                'faqs' => [],
                'cta_text' => 'دریافت مشاوره',
                'cta_url' => '/contact',
                'sort_order' => 5,
            ],
        ];

        foreach ($items as $item) {
            Service::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }

    private function courses(): void
    {
        $items = [
            [
                'title' => 'کشف استعداد نوجوان',
                'subtitle' => 'مسیر شناخت توانمندی‌ها و علایق',
                'slug' => 'talent-discovery-course',
                'level' => 'beginner',
                'price' => 2500000,
                'discount_price' => 1900000,
                'duration_minutes' => 420,
                'is_published' => true,
                'is_featured' => true,
                'certificate_enabled' => true,
                'description' => 'در این دوره جامع، نوجوان با روش‌های علمی استعدادها و علایق خود را می‌شناسد و اولین گام مسیر رشد خود را برمی‌دارد.',
                'category' => 'talent-discovery',
                'modules' => [
                    ['title' => 'مقدمه: چرا شناخت استعداد؟', 'lessons' => [
                        ['title' => 'معرفی دوره و مسیر رشد', 'type' => 'video', 'duration_minutes' => 15, 'is_free' => true],
                        ['title' => 'استعداد چیست و چه تفاوتی با علاقه دارد؟', 'type' => 'video', 'duration_minutes' => 20],
                        ['title' => 'خودشناسی: آزمون اولیه', 'type' => 'quiz', 'quiz' => [
                            'title' => 'آزمون اولیه خودشناسی',
                            'description' => 'پاسخ‌های خود را با دقت بدهید؛ این آزمون نقطه شروع مسیر شماست.',
                            'passing_score' => 70,
                            'questions' => [
                                ['type' => 'single', 'question' => 'کدام گزینه بهترین تعریف «استعداد» است؟', 'options' => ['توانایی ذاتی که با تمرین شکوفا می‌شود', 'همان علاقه و خوش‌گذرانی', 'نمره درسی', 'هر مهارت اکتسابی'], 'correct_answer' => ['0'], 'score' => 1],
                                ['type' => 'true_false', 'question' => 'علاقه لزوماً با استعداد یکی نیست.', 'correct_answer' => ['0'], 'score' => 1],
                                ['type' => 'multiple', 'question' => 'کدام موارد نشانه‌های استعداد هستند؟', 'options' => ['یادگیری سریع در آن حوزه', 'انرژی گرفتن از انجام آن کار', 'بی‌علاقگی به همه کارها', 'پیشرفت محسوس با تمرین کم'], 'correct_answer' => ['0', '1', '3'], 'score' => 1],
                            ],
                        ]],
                    ]],
                    ['title' => 'کشف توانمندی‌ها', 'lessons' => [
                        ['title' => 'هوش‌های چندگانه', 'type' => 'video', 'duration_minutes' => 25],
                        ['title' => 'نقشه استعداد شخصی', 'type' => 'article'],
                        ['title' => 'تمرین کشف استعداد', 'type' => 'assignment', 'assignment' => [
                            'title' => 'تمرین کشف استعداد',
                            'description' => 'سه استعدادی که فکر می‌کنید در آن‌ها قوی‌اید را بنویسید و برای هرکدام یک نمونه از موقعیتی که در آن درخشیده‌اید ذکر کنید. سپس نقشه استعداد شخصی خود را در یک صفحه ترسیم کنید.',
                            'max_score' => 100,
                            'due_days' => 7,
                        ]],
                    ]],
                    ['title' => 'طراحی مسیر', 'lessons' => [
                        ['title' => 'از استعداد تا هدف', 'type' => 'video', 'duration_minutes' => 22],
                        ['title' => 'تدوین برنامه رشد', 'type' => 'article'],
                    ]],
                ],
            ],
            [
                'title' => 'مهارت‌های آینده برای نوجوانان',
                'subtitle' => 'تفکر نقادانه، خلاقیت، ارتباط مؤثر و سواد دیجیتال',
                'slug' => 'future-skills-course',
                'level' => 'intermediate',
                'price' => 3200000,
                'discount_price' => null,
                'duration_minutes' => 600,
                'is_published' => true,
                'is_featured' => true,
                'certificate_enabled' => true,
                'description' => 'مهارت‌هایی که نوجوان امروز برای موفقیت در آینده نیاز دارد: تفکر نقادانه، حل مسئله، خلاقیت، ارتباط و سواد دیجیتال.',
                'category' => 'future-skills',
                'modules' => [
                    ['title' => 'تفکر نقادانه', 'lessons' => [
                        ['title' => 'چرا تفکر نقادانه مهم است؟', 'type' => 'video', 'duration_minutes' => 18, 'is_free' => true],
                        ['title' => 'مغالطه‌های رایج', 'type' => 'video', 'duration_minutes' => 24],
                    ]],
                    ['title' => 'خلاقیت و حل مسئله', 'lessons' => [
                        ['title' => 'تفکر طراحی', 'type' => 'video', 'duration_minutes' => 28],
                        ['title' => 'تمرین حل مسئله', 'type' => 'assignment', 'assignment' => [
                            'title' => 'تمرین حل مسئله',
                            'description' => 'یک مسئله واقعی در زندگی‌تان انتخاب کنید و با روش تفکر طراحی (همدلی، تعریف مسئله، ایده‌پردازی، نمونه‌سازی، آزمون) برای آن راه‌حل ارائه دهید.',
                            'max_score' => 100,
                            'due_days' => 10,
                        ]],
                    ]],
                    ['title' => 'ارتباط مؤثر', 'lessons' => [
                        ['title' => 'گوش دادن فعال', 'type' => 'video', 'duration_minutes' => 20],
                        ['title' => 'ارائه مؤثر', 'type' => 'video', 'duration_minutes' => 25],
                    ]],
                ],
            ],
            [
                'title' => 'تربیت مدرس و مربی',
                'subtitle' => 'روش‌های نوین تدریس و تربیت',
                'slug' => 'trainer-course',
                'level' => 'advanced',
                'price' => 4500000,
                'discount_price' => 3800000,
                'duration_minutes' => 780,
                'is_published' => true,
                'is_featured' => false,
                'certificate_enabled' => true,
                'description' => 'دوره تخصصی تربیت مدرس برای معلمان، مربیان و علاقه‌مندان به آموزش، با تمرکز بر روش‌های نوین و روان‌شناسی یادگیری.',
                'category' => 'trainers',
                'modules' => [
                    ['title' => 'مبانی آموزش', 'lessons' => [
                        ['title' => 'روان‌شناسی یادگیری', 'type' => 'video', 'duration_minutes' => 30, 'is_free' => true],
                        ['title' => 'طراحی جلسه آموزشی', 'type' => 'video', 'duration_minutes' => 35],
                    ]],
                    ['title' => 'مهارت‌های عملی تدریس', 'lessons' => [
                        ['title' => 'مدیریت کلاس', 'type' => 'video', 'duration_minutes' => 28],
                        ['title' => 'ارزیابی و بازخورد', 'type' => 'video', 'duration_minutes' => 22],
                        ['title' => 'آزمون نهایی', 'type' => 'quiz', 'quiz' => [
                            'title' => 'آزمون نهایی دوره تربیت مدرس',
                            'description' => 'پس از تماشای همه درس‌های دوره، به این آزمون پاسخ دهید.',
                            'passing_score' => 70,
                            'questions' => [
                                ['type' => 'single', 'question' => 'کدام رویکرد در طراحی جلسه آموزشی مؤثرتر است؟', 'options' => ['هدف‌محور و مبتنی بر نیازسنجی', 'متن‌محور بدون تعامل', 'طولانی‌کردن جلسه', 'حفظ کردن مطالب'], 'correct_answer' => ['0'], 'score' => 1],
                                ['type' => 'true_false', 'question' => 'بازخورد مؤثر باید مشخص و به‌موقع باشد.', 'correct_answer' => ['0'], 'score' => 1],
                                ['type' => 'multiple', 'question' => 'کدام‌ها از مهارت‌های مدیریت کلاس هستند؟', 'options' => ['برقراری قوانین شفاف', 'مدیریت زمان', 'بی‌توجهی به سؤالات', 'ایجاد محیط امن روانی'], 'correct_answer' => ['0', '1', '3'], 'score' => 1],
                            ],
                        ]],
                    ]],
                ],
            ],
        ];

        foreach ($items as $item) {
            $category = Category::where('slug', $item['category'])->first();
            $modules = $item['modules'];
            unset($item['category'], $item['modules']);

            $course = Course::updateOrCreate(['slug' => $item['slug']], [...$item, 'category_id' => $category?->id]);

            foreach ($modules as $moduleIndex => $module) {
                $moduleModel = CourseModule::updateOrCreate(
                    ['course_id' => $course->id, 'slug' => Str::slug($module['title'])],
                    ['title' => $module['title'], 'sort_order' => $moduleIndex + 1]
                );

                foreach ($module['lessons'] as $lessonIndex => $lesson) {
                    $lessonModel = Lesson::updateOrCreate(
                        ['course_id' => $course->id, 'slug' => Str::slug($lesson['title'])],
                        [
                            'module_id' => $moduleModel->id,
                            'title' => $lesson['title'],
                            'type' => $lesson['type'],
                            'duration_minutes' => $lesson['duration_minutes'] ?? 0,
                            'is_free' => $lesson['is_free'] ?? false,
                            'sort_order' => $lessonIndex + 1,
                        ]
                    );

                    // Assignment lessons get a real assignment so the player
                    // can collect the submission and gate the next lessons on it.
                    if (($lesson['type'] ?? null) === 'assignment' && filled($lesson['assignment'] ?? null)) {
                        Assignment::updateOrCreate(
                            ['lesson_id' => $lessonModel->id],
                            [
                                'course_id' => $course->id,
                                'title' => $lesson['assignment']['title'],
                                'description' => $lesson['assignment']['description'] ?? null,
                                'max_score' => $lesson['assignment']['max_score'] ?? 100,
                                'due_days' => $lesson['assignment']['due_days'] ?? null,
                            ]
                        );
                    }

                    // Quiz lessons get a real quiz with questions, so the
                    // learning player can grade and gate on it.
                    if (($lesson['type'] ?? null) === 'quiz' && filled($lesson['quiz'] ?? null)) {
                        $quiz = Quiz::updateOrCreate(
                            ['lesson_id' => $lessonModel->id],
                            [
                                'course_id' => $course->id,
                                'title' => $lesson['quiz']['title'],
                                'description' => $lesson['quiz']['description'] ?? null,
                                'passing_score' => $lesson['quiz']['passing_score'] ?? 70,
                                'time_limit_minutes' => $lesson['quiz']['time_limit_minutes'] ?? null,
                            ]
                        );
                        $quiz->questions()->delete();
                        foreach ($lesson['quiz']['questions'] as $questionIndex => $question) {
                            Question::create([
                                'quiz_id' => $quiz->id,
                                'type' => $question['type'],
                                'question' => $question['question'],
                                'options' => $question['options'] ?? ($question['type'] === 'true_false' ? ['درست', 'نادرست'] : null),
                                'correct_answer' => $question['correct_answer'],
                                'score' => $question['score'] ?? 1,
                                'sort_order' => $questionIndex,
                            ]);
                        }
                    }
                }
            }
        }
    }

    private function products(): void
    {
        $bookCategory = Category::where('slug', 'books')->first();
        $podcastCategory = Category::where('slug', 'podcast')->first();

        Product::updateOrCreate(['slug' => 'book-growth-path'], [
            'type' => 'book',
            'title' => 'کتاب مسیر رشد',
            'description' => 'راهنمای عملی والدین برای کشف استعداد و طراحی مسیر آینده نوجوانان. بر اساس ۱۵ سال تجربه میدانی مرکز رشد و کارآفرینی.',
            'author' => 'دکتر بیدی',
            'pages' => 240,
            'publisher' => 'انتشارات مسیر',
            'isbn' => '978-600-000-000-0',
            'category_id' => $bookCategory?->id,
            'price' => 280000,
            'discount_price' => 240000,
            'stock' => 50,
            'is_active' => true,
            'is_featured' => true,
        ]);

        Product::updateOrCreate(['slug' => 'book-parent-handbook'], [
            'type' => 'book',
            'title' => 'راهنمای والدین نوجوان',
            'description' => 'پاسخ به مهم‌ترین سوالات والدین درباره تربیت، رشد و آینده نوجوانان.',
            'author' => 'دکتر بیدی',
            'pages' => 180,
            'publisher' => 'انتشارات مسیر',
            'isbn' => '978-600-000-000-1',
            'category_id' => $bookCategory?->id,
            'price' => 220000,
            'stock' => 30,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $podcast = Product::updateOrCreate(['slug' => 'podcast-growth'], [
            'type' => 'podcast',
            'title' => 'پادکست مسیر رشد',
            'description' => 'گفتگوهای تخصصی درباره رشد نوجوان، استعدادیابی، مهارت‌های آینده و آموزش.',
            'category_id' => $podcastCategory?->id,
            'price' => 0,
            'stock' => 999,
            'is_active' => true,
            'is_featured' => true,
        ]);

        $episodes = [
            ['title' => 'قسمت ۱: چرا نوجوانان مسیرشان را گم می‌کنند؟', 'duration_seconds' => 1450, 'is_free' => true],
            ['title' => 'قسمت ۲: استعدادیابی علمی چگونه انجام می‌شود؟', 'duration_seconds' => 1680, 'is_free' => true],
            ['title' => 'قسمت ۳: مهارت‌هایی که مدرسه آموزش نمی‌دهد', 'duration_seconds' => 1530, 'is_free' => true],
            ['title' => 'قسمت ۴: گفتگو با یک والد موفق', 'duration_seconds' => 1210, 'is_free' => false],
        ];

        foreach ($episodes as $index => $episode) {
            $podcast->episodes()->updateOrCreate(
                ['title' => $episode['title']],
                [
                    'description' => 'توضیح قسمت '.($index + 1).' از پادکست مسیر رشد.',
                    'audio_url' => 'storage/podcasts/episode-'.($index + 1).'.mp3',
                    'duration_seconds' => $episode['duration_seconds'],
                    'is_free' => $episode['is_free'],
                    'published_at' => now()->subWeeks(4 - $index),
                    'sort_order' => $index + 1,
                ]
            );
        }

        Product::updateOrCreate(['slug' => 'digital-talent-test'], [
            'type' => 'digital',
            'title' => 'بسته آزمون استعدادیابی آنلاین',
            'description' => 'آزمون جامع آنلاین استعدادیابی با گزارش خودکار ۱۰ صفحه‌ای.',
            'category_id' => $bookCategory?->id,
            'price' => 450000,
            'discount_price' => 350000,
            'stock' => 999,
            'file_path' => 'storage/digital/talent-test.pdf',
            'is_active' => true,
            'is_featured' => false,
        ]);
    }

    private function teamMembers(): void
    {
        $items = [
            [
                'name' => 'سرکار خانم مرادی',
                'title' => 'کارشناس پذیرش و هماهنگی',
                'bio' => 'اولین همراه خانواده‌ها در مرکز؛ پاسخگوی سؤالات شما و هماهنگ‌کننده جلسات مشاوره و ارزیابی.',
                'specialties' => ['پذیرش', 'هماهنگی جلسات', 'پیگیری خانواده‌ها'],
                'sort_order' => 1,
            ],
            [
                'name' => 'آقای کریمی',
                'title' => 'کارشناس پشتیبانی آموزشی',
                'bio' => 'مسئول پیگیری پیشرفت نوجوانان در دوره‌ها و همراهی مدرسین در فرایند یادگیری.',
                'specialties' => ['پشتیبانی دوره‌ها', 'پیگیری پیشرفت', 'ارتباط با مدرسین'],
                'sort_order' => 2,
            ],
        ];

        foreach ($items as $item) {
            TeamMember::updateOrCreate(['name' => $item['name']], $item);
        }
    }

    private function testimonials(): void
    {
        $items = [
            [
                'name' => 'خانم رضایی', 'role' => 'parent', 'rating' => 5,
                'content' => 'پسرم همیشه از خودش می‌پرسید «چه کاره شوم؟». بعد از دوره کشف استعداد و جلسات کوچینگ، حالا یک مسیر روشن دارد و با انگیزه درس می‌خواند.',
            ],
            [
                'name' => 'امیرحسین', 'role' => 'student', 'rating' => 5,
                'content' => 'قبل از این دوره فکر می‌کردم فقط باید معدل بالا بیاورم. الان می‌دانم استعدادم چیست و برایش برنامه دارم.',
            ],
            [
                'name' => 'آقای محمدی', 'role' => 'parent', 'rating' => 4,
                'content' => 'گزارش‌های ماهانه کوچ خیلی به ما کمک کرد که فرزندمان را بهتر بشناسیم و در مسیرش همراه باشیم.',
            ],
            [
                'name' => 'سرکار خانم کریمی', 'role' => 'instructor', 'rating' => 5,
                'content' => 'دوره تربیت مدرس را گذراندم و حالا با روش‌های نوین تدریس، کلاس‌هایم کاملاً متحول شده است.',
            ],
        ];

        foreach ($items as $index => $item) {
            Testimonial::updateOrCreate(
                ['name' => $item['name'], 'content' => $item['content']],
                [...$item, 'sort_order' => $index + 1]
            );
        }
    }

    private function blog(): void
    {
        $author = \App\Models\User::where('email', 'dr.beidi@saradar.ir')->first() ?? \App\Models\User::first();
        if (! $author) {
            return;
        }

        $posts = [
            [
                'title' => 'چگونه استعداد فرزندمان را کشف کنیم؟',
                'slug' => 'how-to-discover-talent',
                'category' => 'talent-discovery-blog',
                'excerpt' => 'کشف استعداد یک فرآیند علمی است، نه یک شهود. در این مقاله روش عملی کشف استعداد را می‌آموزید.',
                'body' => "## کشف استعداد یک فرآیند است\n\nبسیاری از والدین تصور می‌کنند استعداد چیزی است که یا هست یا نیست. اما واقعیت این است که استعداد نیازمند **شناخت، پرورش و جهت‌دهی** است.\n\n### سه نشانه استعداد\n\n1. **یادگیری سریع:** کودک در آن حوزه سریع‌تر از دیگران یاد می‌گیرد.\n2. **لذت واقعی:** انجام آن فعالیت به او انرژی می‌دهد، نه اینکه انرژی بگیرد.\n3. **پایداری:** در برابر سختی‌های آن حوزه مقاومت می‌کند.\n\n### گام‌های عملی\n\n- مشاهده رفتاری مستند در بازه یک ماهه\n- استفاده از آزمون‌های معتبر استعدادیابی\n- مشاوره با متخصص رشد\n\nمرکز رشد و کارآفرینی دکتر بیدی با روش اختصاصی خود، سال‌هاست در این مسیر کنار خانواده‌هاست.",
            ],
            [
                'title' => 'مهارت‌های آینده که مدرسه آموزش نمی‌دهد',
                'slug' => 'future-skills-not-taught-in-school',
                'category' => 'future-skills-blog',
                'excerpt' => 'تفکر نقادانه، حل مسئله، سواد دیجیتال و هوش هیجانی؛ مهارت‌هایی که آینده شغلی نوجوان شما به آن‌ها وابسته است.',
                'body' => "## آینده به مهارت نیاز دارد، نه فقط نمره\n\nتحقیقات جهانی نشان می‌دهد بیش از ۶۰٪ مشاغل آینده هنوز ایجاد نشده‌اند. پس تنها راه آماده‌سازی نوجوانان، آموزش **مهارت‌های قابل انتقال** است.\n\n### پنج مهارت کلیدی\n\n1. تفکر نقادانه\n2. حل مسئله خلاق\n3. ارتباط مؤثر\n4. سواد دیجیتال\n5. هوش هیجانی\n\n### نقش والدین\n\nوالدین می‌توانند با ایجاد محیط امن برای آزمون و خطا، سوال‌پرسیدن و بحث آزاد، این مهارت‌ها را در خانه تقویت کنند.",
            ],
            [
                'title' => 'کوچینگ نوجوان چیست و چه تفاوتی با مشاوره دارد؟',
                'slug' => 'what-is-teen-coaching',
                'category' => 'coaching-psychology',
                'excerpt' => 'کوچینگ به جای «درمان»، بر «رشد و دستیابی به اهداف» تمرکز دارد. تفاوت‌ها را بشناسید.',
                'body' => "## کوچینگ، مشاوره یا درمان؟\n\nاین سه مفهوم اغلب اشتباه گرفته می‌شوند:\n\n- **مشاوره:** حل مسئله خاص در زمان حال\n- **درمان:** درمان آسیب‌ها و اختلالات\n- **کوچینگ:** همراهی در مسیر رشد و رسیدن به اهداف\n\nکوچینگ نوجوان بر **شناخت توانمندی‌ها، هدف‌گذاری و اقدام** متمرکز است و با ایجاد رابطه اعتماد، نوجوان را به سمت استقلال هدایت می‌کند.",
            ],
        ];

        foreach ($posts as $index => $post) {
            $postCategory = Category::where('slug', $post['category'] ?? 'articles')->first();
            BlogPost::updateOrCreate(['slug' => $post['slug']], [
                'author_id' => $author->id,
                'category_id' => $postCategory?->id,
                'title' => $post['title'],
                'excerpt' => $post['excerpt'],
                'body' => $post['body'],
                'status' => 'published',
                'published_at' => now()->subDays($index * 3),
                'reading_time' => 5,
                'views_count' => rand(50, 300),
                'is_featured' => $index === 0,
                'seo' => ['title' => $post['title'], 'description' => $post['excerpt']],
            ]);
        }
    }
}
