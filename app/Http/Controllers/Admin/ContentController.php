<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\BlogPost;
use App\Models\CoachingSession;
use App\Models\CourseModule;
use App\Models\Coupon;
use App\Models\Category;
use App\Models\Course;
use App\Models\Lead;
use App\Models\Lesson;
use App\Models\Media;
use App\Models\Order;
use App\Models\Page;
use App\Models\PodcastEpisode;
use App\Models\Product;
use App\Models\Review;
use App\Models\Service;
use App\Models\Student;
use App\Models\TeamMember;
use App\Models\Testimonial;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    /**
     * The public-facing modules are deliberately whitelisted here. This keeps
     * the generic studio safe while allowing the admin UI to grow module by module.
     *
     * @var array<string, array<string, mixed>>
     */
    private const RESOURCES = [
        'services' => [
            'model' => Service::class,
            'label' => 'خدمات',
            'singular' => 'خدمت',
            'search' => ['title', 'summary'],
            'fields' => [
                ['name' => 'title', 'label' => 'عنوان', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'summary', 'label' => 'خلاصه', 'type' => 'text'],
                ['name' => 'description', 'label' => 'توضیحات کامل', 'type' => 'textarea', 'wide' => true],
                ['name' => 'image', 'label' => 'تصویر (URL)', 'type' => 'text'],
                ['name' => 'icon', 'label' => 'نام آیکون', 'type' => 'text'],
                ['name' => 'price', 'label' => 'قیمت (تومان)', 'type' => 'number'],
                ['name' => 'features', 'label' => 'مزایا (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
                ['name' => 'process', 'label' => 'مراحل (هر خط یک مرحله)', 'type' => 'lines', 'wide' => true],
                ['name' => 'target_audience', 'label' => 'مخاطبان هدف (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
                ['name' => 'outcomes', 'label' => 'نتایج مورد انتظار (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
                ['name' => 'faqs', 'label' => 'سؤالات متداول (هر خط: سؤال | پاسخ)', 'type' => 'lines', 'wide' => true],
                ['name' => 'cta_text', 'label' => 'متن CTA', 'type' => 'text'],
                ['name' => 'cta_url', 'label' => 'لینک CTA', 'type' => 'text'],
                ['name' => 'sort_order', 'label' => 'ترتیب نمایش', 'type' => 'number'],
                ['name' => 'is_active', 'label' => 'فعال در سایت', 'type' => 'boolean'],
                ['name' => 'is_featured', 'label' => 'ویژه در صفحه اصلی', 'type' => 'boolean'],
            ],
        ],
        'products' => [
            'model' => Product::class,
            'label' => 'محصولات فروشگاه',
            'singular' => 'محصول',
            'search' => ['title', 'description', 'author'],
            'fields' => [
                ['name' => 'title', 'label' => 'عنوان', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'type', 'label' => 'نوع محصول', 'type' => 'select', 'options' => ['book' => 'کتاب', 'podcast' => 'پادکست', 'digital' => 'دیجیتال', 'physical' => 'فیزیکی']],
                ['name' => 'category_id', 'label' => 'دسته‌بندی', 'type' => 'category'],
                ['name' => 'description', 'label' => 'توضیحات', 'type' => 'textarea', 'wide' => true],
                ['name' => 'image', 'label' => 'تصویر (URL)', 'type' => 'text'],
                ['name' => 'price', 'label' => 'قیمت مطالعه آنلاین (تومان)', 'type' => 'number'],
                ['name' => 'discount_price', 'label' => 'تخفیف مطالعه آنلاین', 'type' => 'number'],
                ['name' => 'download_price', 'label' => 'قیمت نسخه دانلودی', 'type' => 'number', 'help' => 'برای فروش PDF دانلودی مبلغی بیشتر از مطالعه آنلاین تعیین کنید.'],
                ['name' => 'download_discount_price', 'label' => 'تخفیف نسخه دانلودی', 'type' => 'number'],
                ['name' => 'stock', 'label' => 'موجودی', 'type' => 'number'],
                ['name' => 'preview_file', 'label' => 'فایل PDF مطالعه آنلاین', 'type' => 'file', 'accept' => 'application/pdf', 'mimes' => ['pdf'], 'help' => 'فایل در نمایشگر داخلی و بدون لینک دانلود مستقیم ارائه می‌شود.'],
                ['name' => 'download_file', 'label' => 'فایل نسخه دانلودی', 'type' => 'file', 'accept' => 'application/pdf,application/zip', 'mimes' => ['pdf', 'zip'], 'help' => 'این فایل فقط بعد از خرید نسخه دانلودی قابل دریافت است.'],
                ['name' => 'file_path', 'label' => 'مسیر فایل دانلود قدیمی', 'type' => 'text'],
                ['name' => 'preview_url', 'label' => 'لینک پیش‌نمایش', 'type' => 'text'],
                ['name' => 'author', 'label' => 'نویسنده / تولیدکننده', 'type' => 'text'],
                ['name' => 'pages', 'label' => 'تعداد صفحات', 'type' => 'number'],
                ['name' => 'publisher', 'label' => 'ناشر', 'type' => 'text'],
                ['name' => 'isbn', 'label' => 'ISBN', 'type' => 'text'],
                ['name' => 'audio_duration_seconds', 'label' => 'مدت صوت (ثانیه)', 'type' => 'number'],
                ['name' => 'is_active', 'label' => 'فعال در فروشگاه', 'type' => 'boolean'],
                ['name' => 'is_featured', 'label' => 'محصول ویژه', 'type' => 'boolean'],
                ['name' => 'meta_title', 'label' => 'عنوان متا (SEO)', 'type' => 'text'],
                ['name' => 'meta_description', 'label' => 'توضیحات متا (SEO)', 'type' => 'textarea'],
                ['name' => 'meta_keywords', 'label' => 'کلمات کلیدی (SEO)', 'type' => 'text'],
            ],
        ],
        'blog' => [
            'model' => BlogPost::class,
            'label' => 'مقالات بلاگ',
            'singular' => 'مقاله',
            'search' => ['title', 'excerpt', 'body'],
            'fields' => [
                ['name' => 'title', 'label' => 'عنوان مقاله', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'category_id', 'label' => 'دسته‌بندی', 'type' => 'category'],
                ['name' => 'excerpt', 'label' => 'خلاصه', 'type' => 'textarea', 'wide' => true],
                ['name' => 'body', 'label' => 'متن مقاله', 'type' => 'textarea', 'wide' => true, 'required' => true],
                ['name' => 'cover_image', 'label' => 'تصویر کاور (URL)', 'type' => 'text'],
                ['name' => 'video_url', 'label' => 'لینک ویدیو (آپارات، یوتیوب، ویمئو یا MP4)', 'type' => 'text', 'help' => 'لینک ویدیو داخل مقاله پخش می‌شود؛ فقط لینک صفحه ویدیو را وارد کنید، نه کد iframe.'],
                ['name' => 'status', 'label' => 'وضعیت', 'type' => 'select', 'options' => ['draft' => 'پیش‌نویس', 'published' => 'منتشرشده', 'archived' => 'بایگانی']],
                ['name' => 'published_at', 'label' => 'تاریخ انتشار', 'type' => 'datetime'],
                ['name' => 'reading_time', 'label' => 'زمان مطالعه (دقیقه)', 'type' => 'number'],
                ['name' => 'is_featured', 'label' => 'مقاله ویژه', 'type' => 'boolean'],
            ],
        ],
        'team' => [
            'model' => TeamMember::class,
            'label' => 'مدرس‌ها و تیم',
            'singular' => 'عضو تیم',
            'search' => ['name', 'title', 'bio'],
            'filters' => [
                ['name' => 'role', 'label' => 'نقش در تیم', 'options' => TeamMember::ROLES],
            ],
            'fields' => [
                ['name' => 'user_id', 'label' => 'کاربر (اختیاری — نام و عکس خودکار پر می‌شود)', 'type' => 'user'],
                ['name' => 'name', 'label' => 'نام', 'type' => 'text', 'required' => true],
                ['name' => 'title', 'label' => 'سمت / نقش (مثلاً کارشناس پذیرش)', 'type' => 'text'],
                ['name' => 'role', 'label' => 'بخش نمایش در صفحه تیم', 'type' => 'select', 'options' => TeamMember::ROLES],
                ['name' => 'photo', 'label' => 'تصویر اعضای تیم', 'type' => 'image', 'help' => 'پس از انتخاب، عکس را می‌توانید جابه‌جا و بزرگنمایی کنید تا کادر مربع دلخواه ثبت شود.'],
                ['name' => 'bio', 'label' => 'معرفی کوتاه', 'type' => 'textarea', 'wide' => true],
                ['name' => 'specialties', 'label' => 'تخصص‌ها (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
                ['name' => 'sort_order', 'label' => 'ترتیب نمایش', 'type' => 'number'],
                ['name' => 'is_featured', 'label' => 'ویژه در صفحه تیم', 'type' => 'boolean'],
                ['name' => 'is_active', 'label' => 'نمایش در سایت', 'type' => 'boolean'],
            ],
        ],
        'categories' => [
            'model' => Category::class,
            'label' => 'دسته‌بندی‌ها',
            'singular' => 'دسته‌بندی',
            'search' => ['name', 'slug'],
            'fields' => [
                ['name' => 'name', 'label' => 'نام دسته', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'type', 'label' => 'کاربرد', 'type' => 'select', 'options' => ['course' => 'دوره', 'product' => 'محصول', 'blog' => 'بلاگ', 'service' => 'خدمت']],
                ['name' => 'icon', 'label' => 'نام آیکون', 'type' => 'text'],
                ['name' => 'sort_order', 'label' => 'ترتیب نمایش', 'type' => 'number'],
                ['name' => 'is_active', 'label' => 'فعال', 'type' => 'boolean'],
            ],
        ],
        'reviews' => [
            'model' => Review::class,
            'label' => 'نظرات دوره‌ها و محصولات',
            'singular' => 'نظر',
            'search' => ['title', 'body'],
            'fields' => [
                ['name' => 'user_id', 'label' => 'کاربر', 'type' => 'user', 'required' => true],
                ['name' => 'rating', 'label' => 'امتیاز از ۵', 'type' => 'number'],
                ['name' => 'title', 'label' => 'عنوان نظر', 'type' => 'text'],
                ['name' => 'body', 'label' => 'متن نظر', 'type' => 'textarea', 'wide' => true],
                ['name' => 'is_approved', 'label' => 'نمایش در سایت', 'type' => 'boolean'],
            ],
        ],
        'testimonials' => [
            'model' => Testimonial::class,
            'label' => 'نظرات و تجربه‌ها',
            'singular' => 'نظر',
            'search' => ['name', 'content'],
            'fields' => [
                ['name' => 'name', 'label' => 'نام', 'type' => 'text', 'required' => true],
                ['name' => 'role', 'label' => 'نقش', 'type' => 'select', 'options' => ['parent' => 'والد', 'student' => 'نوجوان', 'instructor' => 'مدرس', 'coach' => 'کوچ', 'partner' => 'همکار']],
                ['name' => 'avatar', 'label' => 'تصویر (URL)', 'type' => 'text'],
                ['name' => 'content', 'label' => 'متن تجربه', 'type' => 'textarea', 'wide' => true, 'required' => true],
                ['name' => 'rating', 'label' => 'امتیاز از ۵', 'type' => 'number'],
                ['name' => 'sort_order', 'label' => 'ترتیب نمایش', 'type' => 'number'],
                ['name' => 'is_approved', 'label' => 'نمایش در سایت', 'type' => 'boolean'],
            ],
        ],
        'banners' => [
            'model' => Banner::class,
            'label' => 'بنرها و کمپین‌ها',
            'singular' => 'بنر',
            'search' => ['title', 'position'],
            'fields' => [
                ['name' => 'title', 'label' => 'عنوان بنر', 'type' => 'text'],
                ['name' => 'image', 'label' => 'تصویر (URL)', 'type' => 'text', 'required' => true],
                ['name' => 'link', 'label' => 'لینک مقصد', 'type' => 'text'],
                ['name' => 'position', 'label' => 'محل نمایش', 'type' => 'select', 'options' => ['home_hero' => 'هیرو صفحه اصلی', 'home_middle' => 'میانه صفحه اصلی', 'sidebar' => 'سایدبار']],
                ['name' => 'sort_order', 'label' => 'ترتیب نمایش', 'type' => 'number'],
                ['name' => 'is_active', 'label' => 'فعال', 'type' => 'boolean'],
            ],
        ],
        'pages' => [
            'model' => Page::class,
            'label' => 'صفحات و Page Builder',
            'singular' => 'صفحه',
            'search' => ['title', 'slug'],
            'fields' => [
                ['name' => 'title', 'label' => 'عنوان صفحه', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'template', 'label' => 'قالب', 'type' => 'select', 'options' => ['default' => 'پیش‌فرض', 'landing' => 'لندینگ', 'about' => 'درباره ما', 'contact' => 'تماس با ما']],
                ['name' => 'status', 'label' => 'وضعیت', 'type' => 'select', 'options' => ['draft' => 'پیش‌نویس', 'published' => 'منتشرشده']],
                ['name' => 'sections', 'label' => 'بخش‌های صفحه (JSON)', 'type' => 'json', 'wide' => true],
                ['name' => 'seo', 'label' => 'SEO صفحه (JSON)', 'type' => 'json', 'wide' => true],
            ],
        ],
        'leads' => [
            'model' => Lead::class,
            'label' => 'سرنخ‌ها و CRM',
            'singular' => 'سرنخ',
            'search' => ['name', 'phone', 'need'],
            'fields' => [
                ['name' => 'name', 'label' => 'نام', 'type' => 'text', 'required' => true],
                ['name' => 'phone', 'label' => 'شماره موبایل', 'type' => 'text', 'required' => true],
                ['name' => 'email', 'label' => 'ایمیل', 'type' => 'text'],
                ['name' => 'child_age', 'label' => 'سن فرزند', 'type' => 'text'],
                ['name' => 'grade', 'label' => 'پایه تحصیلی', 'type' => 'text'],
                ['name' => 'need', 'label' => 'نیاز اصلی', 'type' => 'text'],
                ['name' => 'service_type', 'label' => 'خدمت موردنظر', 'type' => 'text'],
                ['name' => 'source', 'label' => 'منبع', 'type' => 'select', 'options' => ['website' => 'وب‌سایت', 'instagram' => 'اینستاگرام', 'eitaa' => 'ایتا', 'referral' => 'معرفی', 'other' => 'سایر']],
                ['name' => 'status', 'label' => 'مرحله قیف', 'type' => 'select', 'options' => ['new' => 'جدید', 'contacted' => 'تماس گرفته‌شده', 'interested' => 'علاقه‌مند', 'consultation' => 'مشاوره', 'registered' => 'ثبت‌نام‌کرده', 'customer' => 'مشتری']],
                ['name' => 'notes', 'label' => 'یادداشت پیگیری', 'type' => 'textarea', 'wide' => true],
            ],
        ],
        'students' => [
            'model' => Student::class,
            'label' => 'فرزندان و ارتباط والدین',
            'singular' => 'فرزند',
            'search' => ['grade', 'school'],
            'fields' => [
                ['name' => 'user_id', 'label' => 'فرزند (کاربر دانش‌آموز)', 'type' => 'student', 'required' => true],
                ['name' => 'parent_id', 'label' => 'والد (حساب کاربری والد)', 'type' => 'parent', 'required' => true],
                ['name' => 'grade', 'label' => 'پایه تحصیلی', 'type' => 'text'],
                ['name' => 'school', 'label' => 'مدرسه', 'type' => 'text'],
                ['name' => 'birth_date', 'label' => 'تاریخ تولد', 'type' => 'datetime'],
                ['name' => 'talents', 'label' => 'استعدادها (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
                ['name' => 'interests', 'label' => 'علاقه‌مندی‌ها (هر خط یک مورد)', 'type' => 'lines', 'wide' => true],
            ],
        ],
        'coaching' => [
            'model' => CoachingSession::class,
            'label' => 'جلسات کوچینگ',
            'singular' => 'جلسه کوچینگ',
            'search' => ['status', 'meeting_link', 'notes'],
            'fields' => [
                ['name' => 'coach_id', 'label' => 'کوچ', 'type' => 'user', 'required' => true],
                ['name' => 'student_id', 'label' => 'نوجوان', 'type' => 'user', 'required' => true],
                ['name' => 'scheduled_at', 'label' => 'زمان جلسه', 'type' => 'datetime', 'required' => true],
                ['name' => 'duration_minutes', 'label' => 'مدت (دقیقه)', 'type' => 'number'],
                ['name' => 'status', 'label' => 'وضعیت', 'type' => 'select', 'options' => ['pending' => 'در انتظار', 'confirmed' => 'تأییدشده', 'completed' => 'انجام‌شده', 'cancelled' => 'لغوشده']],
                ['name' => 'meeting_link', 'label' => 'لینک جلسه', 'type' => 'text'],
                ['name' => 'price', 'label' => 'هزینه', 'type' => 'number'],
                ['name' => 'report', 'label' => 'گزارش کوچ', 'type' => 'textarea', 'wide' => true],
                ['name' => 'notes', 'label' => 'یادداشت', 'type' => 'textarea', 'wide' => true],
                ['name' => 'rating', 'label' => 'امتیاز', 'type' => 'number'],
            ],
        ],
        'lessons' => [
            'model' => Lesson::class,
            'label' => 'درس‌ها و محتوای دوره',
            'singular' => 'درس',
            'search' => ['title', 'slug', 'content'],
            'fields' => [
                ['name' => 'course_id', 'label' => 'دوره', 'type' => 'course', 'required' => true],
                ['name' => 'module_id', 'label' => 'ماژول', 'type' => 'module'],
                ['name' => 'title', 'label' => 'عنوان درس', 'type' => 'text', 'required' => true],
                ['name' => 'slug', 'label' => 'اسلاگ', 'type' => 'text'],
                ['name' => 'type', 'label' => 'نوع درس', 'type' => 'select', 'options' => ['video' => 'ویدیویی', 'article' => 'متنی', 'quiz' => 'آزمون', 'assignment' => 'تکلیف']],
                ['name' => 'video_url', 'label' => 'آدرس ویدیو', 'type' => 'text'],
                ['name' => 'video_type', 'label' => 'نوع ویدیو', 'type' => 'select', 'options' => ['upload' => 'آپلود', 'embed' => 'Embed', 'vimeo' => 'Vimeo', 'aparat' => 'آپارات']],
                ['name' => 'duration_minutes', 'label' => 'مدت (دقیقه)', 'type' => 'number'],
                ['name' => 'content', 'label' => 'محتوای درس', 'type' => 'textarea', 'wide' => true],
                ['name' => 'attachments', 'label' => 'پیوست‌ها (JSON)', 'type' => 'json', 'wide' => true],
                ['name' => 'is_free', 'label' => 'درس رایگان', 'type' => 'boolean'],
                ['name' => 'sort_order', 'label' => 'ترتیب', 'type' => 'number'],
            ],
        ],
        'podcasts' => [
            'model' => PodcastEpisode::class,
            'label' => 'اپیزودهای پادکست',
            'singular' => 'اپیزود',
            'search' => ['title', 'description'],
            'fields' => [
                ['name' => 'product_id', 'label' => 'محصول پادکست', 'type' => 'product', 'required' => true],
                ['name' => 'title', 'label' => 'عنوان اپیزود', 'type' => 'text', 'required' => true],
                ['name' => 'description', 'label' => 'توضیحات', 'type' => 'textarea', 'wide' => true],
                ['name' => 'audio_url', 'label' => 'آدرس فایل صوتی', 'type' => 'text', 'required' => true],
                ['name' => 'cover', 'label' => 'کاور (URL)', 'type' => 'text'],
                ['name' => 'duration_seconds', 'label' => 'مدت (ثانیه)', 'type' => 'number'],
                ['name' => 'transcript', 'label' => 'متن پیاده‌سازی‌شده', 'type' => 'textarea', 'wide' => true],
                ['name' => 'is_free', 'label' => 'رایگان', 'type' => 'boolean'],
                ['name' => 'published_at', 'label' => 'تاریخ انتشار', 'type' => 'datetime'],
                ['name' => 'sort_order', 'label' => 'ترتیب', 'type' => 'number'],
            ],
        ],
        'coupons' => [
            'model' => Coupon::class,
            'label' => 'کدهای تخفیف',
            'singular' => 'کد تخفیف',
            'search' => ['code', 'type'],
            'fields' => [
                ['name' => 'code', 'label' => 'کد', 'type' => 'text', 'required' => true],
                ['name' => 'type', 'label' => 'نوع تخفیف', 'type' => 'select', 'options' => ['percent' => 'درصدی', 'fixed' => 'مبلغ ثابت']],
                ['name' => 'value', 'label' => 'مقدار تخفیف', 'type' => 'number'],
                ['name' => 'max_uses', 'label' => 'حداکثر استفاده', 'type' => 'number'],
                ['name' => 'used_count', 'label' => 'تعداد مصرف', 'type' => 'number'],
                ['name' => 'min_order', 'label' => 'حداقل سفارش', 'type' => 'number'],
                ['name' => 'expires_at', 'label' => 'انقضا', 'type' => 'datetime'],
                ['name' => 'is_active', 'label' => 'فعال', 'type' => 'boolean'],
            ],
        ],
        'media' => [
            'model' => Media::class,
            'label' => 'کتابخانه رسانه',
            'singular' => 'رسانه',
            'search' => ['name', 'file_name', 'folder'],
            'fields' => [
                ['name' => 'name', 'label' => 'نام رسانه', 'type' => 'text', 'required' => true],
                ['name' => 'file_name', 'label' => 'نام فایل', 'type' => 'text', 'required' => true],
                ['name' => 'url_path', 'label' => 'مسیر / URL', 'type' => 'text', 'required' => true],
                ['name' => 'type', 'label' => 'نوع', 'type' => 'select', 'options' => ['image' => 'تصویر', 'video' => 'ویدیو', 'audio' => 'صوت', 'document' => 'سند']],
                ['name' => 'disk', 'label' => 'فضای ذخیره‌سازی', 'type' => 'select', 'options' => ['local' => 'Local', 's3' => 'S3']],
                ['name' => 'size', 'label' => 'حجم (بایت)', 'type' => 'number'],
                ['name' => 'folder', 'label' => 'پوشه', 'type' => 'text'],
                ['name' => 'alt', 'label' => 'متن جایگزین', 'type' => 'text'],
                ['name' => 'collection', 'label' => 'مجموعه', 'type' => 'text'],
            ],
        ],
        'tickets' => [
            'model' => Ticket::class,
            'label' => 'تیکت‌های پشتیبانی',
            'singular' => 'تیکت',
            'search' => ['subject', 'body', 'status'],
            'fields' => [
                ['name' => 'user_id', 'label' => 'کاربر', 'type' => 'user', 'required' => true],
                ['name' => 'subject', 'label' => 'موضوع', 'type' => 'text', 'required' => true],
                ['name' => 'body', 'label' => 'متن درخواست', 'type' => 'textarea', 'wide' => true, 'required' => true],
                ['name' => 'status', 'label' => 'وضعیت', 'type' => 'select', 'options' => ['open' => 'باز', 'answered' => 'پاسخ داده‌شده', 'closed' => 'بسته']],
                ['name' => 'priority', 'label' => 'اولویت', 'type' => 'select', 'options' => ['low' => 'کم', 'medium' => 'متوسط', 'high' => 'زیاد']],
                ['name' => 'assigned_to', 'label' => 'مسئول پیگیری', 'type' => 'user'],
            ],
        ],
        'orders' => [
            'model' => Order::class,
            'label' => 'سفارش‌ها و پرداخت‌ها',
            'singular' => 'سفارش',
            'search' => ['order_number', 'status'],
            'fields' => [
                ['name' => 'order_number', 'label' => 'شماره سفارش', 'type' => 'text', 'required' => true],
                ['name' => 'status', 'label' => 'وضعیت', 'type' => 'select', 'options' => ['cart' => 'سبد خرید', 'pending' => 'در انتظار پرداخت', 'paid' => 'پرداخت موفق', 'failed' => 'ناموفق', 'cancelled' => 'لغوشده', 'refunded' => 'مرجوع‌شده']],
                ['name' => 'subtotal', 'label' => 'مبلغ اولیه', 'type' => 'number'],
                ['name' => 'discount', 'label' => 'تخفیف', 'type' => 'number'],
                ['name' => 'total', 'label' => 'مبلغ نهایی', 'type' => 'number'],
                ['name' => 'payment_method', 'label' => 'روش پرداخت', 'type' => 'text'],
            ],
        ],
    ];

    public function index(Request $request, string $resource): Response
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'view');
        $model = $config['model'];
        $query = $model::query();
        $search = trim((string) $request->string('search'));

        if ($search !== '') {
            $query->where(function ($nested) use ($config, $search) {
                foreach ($config['search'] as $index => $column) {
                    $method = $index === 0 ? 'where' : 'orWhere';
                    $nested->{$method}($column, 'like', "%{$search}%");
                }
            });
        }

        // Declarative select filters (e.g. team members by role).
        $filters = ['search' => $search];
        foreach ($config['filters'] ?? [] as $filter) {
            $name = $filter['name'];
            $value = trim((string) $request->string($name));
            if ($value !== '' && isset($filter['options'][$value])) {
                $query->where($name, $value);
                $filters[$name] = $value;
            } else {
                $filters[$name] = '';
            }
        }

        $items = $query->latest()->paginate(15)->withQueryString();
        $fields = $this->fieldsFor($resource, $config);

        return Inertia::render('Admin/Content/Index', [
            'resource' => $resource,
            'resourceTitle' => $config['label'],
            'singularTitle' => $config['singular'],
            'fields' => $fields,
            'items' => $items->through(fn (Model $item) => $this->presentItem($item, $fields)),
            'filters' => $filters,
            'filterFields' => $config['filters'] ?? [],
            'canCreate' => $resource !== 'reviews' && $this->can($request, "create {$resource}"),
            'canUpdate' => $this->can($request, "update {$resource}"),
            'canDelete' => $this->can($request, "delete {$resource}"),
        ]);
    }

    public function create(Request $request, string $resource): Response
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'create');

        return Inertia::render('Admin/Content/Form', [
            'resource' => $resource,
            'resourceTitle' => $config['label'],
            'singularTitle' => $config['singular'],
            'fields' => $this->fieldsFor($resource, $config),
            'item' => null,
        ]);
    }

    public function edit(Request $request, string $resource, int $id): Response
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'update');
        $item = $config['model']::findOrFail($id);
        $fields = $this->fieldsFor($resource, $config);

        return Inertia::render('Admin/Content/Form', [
            'resource' => $resource,
            'resourceTitle' => $config['label'],
            'singularTitle' => $config['singular'],
            'fields' => $fields,
            'item' => $this->presentItem($item, $fields),
        ]);
    }

    public function store(Request $request, string $resource): RedirectResponse
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'create');
        $data = $this->validated($request, $resource, $config);

        if ($resource === 'blog') {
            $data['author_id'] = $request->user()->id;
        }

        $data = $this->prepareData($data, $resource);
        $data = $this->finalizeSeo($data, $resource);
        $item = $config['model']::create($this->withoutUploads($config, $data));
        $this->applyImages($request, $resource, $config, $item, $data);
        $this->applyFiles($request, $resource, $config, $item);

        return redirect()->route('admin.content.index', $resource)->with('success', "{$config['singular']} با موفقیت ایجاد شد.");
    }

    public function update(Request $request, string $resource, int $id): RedirectResponse
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'update');
        $item = $config['model']::findOrFail($id);
        $data = $this->validated($request, $resource, $config, $id);
        $data = $this->finalizeSeo($data, $resource, $item);

        $item->update($this->withoutUploads($config, $data));
        $this->applyImages($request, $resource, $config, $item, $data);
        $this->applyFiles($request, $resource, $config, $item);

        return redirect()->route('admin.content.index', $resource)->with('success', "{$config['singular']} به‌روزرسانی شد.");
    }

    public function destroy(Request $request, string $resource, int $id): RedirectResponse
    {
        $config = $this->config($resource);
        $this->authorizeResource($request, $resource, 'delete');
        $item = $config['model']::findOrFail($id);
        $this->deleteImageFiles($resource, $config, $item->getKey());
        $this->deleteFiles($resource, $config, $item);
        $item->delete();

        return back()->with('success', "{$config['singular']} حذف شد.");
    }

    /** @return array<string, mixed> */
    private function config(string $resource): array
    {
        abort_unless(isset(self::RESOURCES[$resource]), 404);

        return self::RESOURCES[$resource];
    }

    private function authorizeResource(Request $request, string $resource, string $action): void
    {
        abort_unless($this->can($request, "{$action} {$resource}"), 403);
    }

    private function can(Request $request, string $permission): bool
    {
        return (bool) ($request->user()?->can('manage all') || $request->user()?->can($permission));
    }

    /** @param array<string, mixed> $config */
    private function fieldsFor(string $resource, array $config): array
    {
        return collect($config['fields'])->map(function (array $field) use ($resource) {
            if ($field['type'] === 'category') {
                $type = $resource === 'products' ? 'product' : ($resource === 'blog' ? 'blog' : 'course');
                $field['type'] = 'select';
                $field['options'] = Category::where('type', $type)->orderBy('name')->get(['id', 'name'])->mapWithKeys(fn ($category) => [$category->id => $category->name])->all();
            }
            if ($field['type'] === 'user') {
                $field['type'] = 'select';
                $field['options'] = User::query()->where('is_active', true)->orderBy('name')->pluck('name', 'id')->all();
            }
            if ($field['type'] === 'product') {
                $field['type'] = 'select';
                $field['options'] = Product::query()->orderBy('title')->pluck('title', 'id')->all();
            }
            if ($field['type'] === 'course') {
                $field['type'] = 'select';
                $field['options'] = Course::query()->orderBy('title')->pluck('title', 'id')->all();
            }
            if ($field['type'] === 'module') {
                $field['type'] = 'select';
                $field['options'] = CourseModule::query()->with('course')->orderBy('course_id')->orderBy('sort_order')->get()->mapWithKeys(fn ($module) => [$module->id => ($module->course?->title ? $module->course->title.' — ' : '').$module->title])->all();
            }
            if ($field['type'] === 'student') {
                $field['type'] = 'select';
                $field['options'] = User::query()->whereHas('roles', fn ($query) => $query->where('name', 'student'))->orderBy('name')->pluck('name', 'id')->all();
            }
            if ($field['type'] === 'parent') {
                $field['type'] = 'select';
                $field['options'] = User::query()->whereHas('roles', fn ($query) => $query->where('name', 'parent'))->orderBy('name')->pluck('name', 'id')->all();
            }

            return $field;
        })->values()->all();
    }

    private function presentItem(Model $item, array $fields): array
    {
        $payload = ['id' => $item->getKey()];
        foreach ($fields as $field) {
            $payload[$field['name']] = $item->getAttribute($field['name']);
        }

        return $payload;
    }

    /** @param array<string, mixed> $config */
    private function validated(Request $request, string $resource, array $config, ?int $id = null): array
    {
        $rules = [];
        foreach ($config['fields'] as $field) {
            $name = $field['name'];
            $type = $field['type'];
            $rule = [];
            if ($field['required'] ?? false) {
                $rule[] = 'required';
            } else {
                $rule[] = 'nullable';
            }
            $rule[] = match ($type) {
                'number' => 'integer',
                'boolean' => 'boolean',
                'datetime' => 'date',
                'json' => 'nullable',
                // An image field can carry a file upload, an already-saved URL
                // (unchanged), or an empty value (removed). Only enforce the file
                // rules when a real upload is present.
                'image', 'file' => $request->hasFile($name) ? 'file' : 'nullable',
                default => 'string',
            };
            if ($type === 'image' && $request->hasFile($name)) {
                $rule[] = 'mimes:png,jpg,jpeg,webp';
                $rule[] = 'max:8192';
            }
            if ($type === 'file' && $request->hasFile($name)) {
                $rule[] = 'mimes:'.implode(',', $field['mimes'] ?? ['pdf']);
                $rule[] = 'max:51200';
            }
            if ($type === 'select' && isset($field['options'])) {
                $rule[] = 'in:'.implode(',', array_keys($field['options']));
            }
            if ($name === 'category_id') {
                $rule = ['nullable', 'integer', 'exists:categories,id'];
            }
            if (in_array($name, ['user_id', 'assigned_to', 'coach_id', 'student_id', 'parent_id'], true)) {
                $rule = [$field['required'] ?? false ? 'required' : 'nullable', 'integer', 'exists:users,id'];
            }
            if ($name === 'product_id') {
                $rule = ['required', 'integer', 'exists:products,id'];
            }
            if ($name === 'course_id') {
                $rule = ['required', 'integer', 'exists:courses,id'];
            }
            if ($name === 'module_id') {
                $rule = ['nullable', 'integer', 'exists:course_modules,id'];
            }
            if ($name === 'slug') {
                $rule[] = 'max:255';
            }
            $rules[$name] = $rule;
        }

        $data = $request->validate($rules);
        foreach ($config['fields'] as $field) {
            if ($field['type'] === 'boolean' && ! array_key_exists($field['name'], $data)) {
                $data[$field['name']] = false;
            }
        }

        if (isset($data['slug']) && $data['slug'] === '') {
            $data['slug'] = Str::slug((string) ($data['title'] ?? $data['name'] ?? 'item')).'-'.Str::lower(Str::random(4));
        }
        if ($resource === 'blog' && ($data['status'] ?? null) === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        return $data;
    }

    private function prepareData(array $data, string $resource): array
    {
        $lineFields = match ($resource) {
            'services' => ['features', 'process', 'target_audience', 'outcomes', 'faqs'],
            'team' => ['specialties'],
            'students' => ['talents', 'interests'],
            default => [],
        };

        // Members created without an explicit role fall back to the rest-of-team section.
        if ($resource === 'team' && empty($data['role'] ?? null)) {
            $data['role'] = 'team';
        }
        foreach ($lineFields as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = collect(preg_split('/\r?\n/', (string) $data[$field]) ?: [])
                    ->map(fn ($line) => trim($line))
                    ->filter()
                    ->values()
                    ->all();
            }
        }

        foreach (['sections', 'seo', 'attachments'] as $field) {
            if (($resource === 'pages' || $resource === 'lessons') && array_key_exists($field, $data)) {
                $decoded = json_decode((string) $data[$field], true);
                $data[$field] = is_array($decoded) ? $decoded : [];
            }
        }

        return $data;
    }

    /**
     * Products keep their SEO inside the `meta` JSON column. The studio exposes
     * the three meta_* fields as flat inputs and folds them back here.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function finalizeSeo(array $data, string $resource, ?Model $item = null): array
    {
        if ($resource !== 'products') {
            return $data;
        }

        $meta = is_array($item?->getAttribute('meta')) ? $item->getAttribute('meta') : [];
        $title = trim((string) ($data['meta_title'] ?? ''));
        $description = trim((string) ($data['meta_description'] ?? ''));
        $keywords = trim((string) ($data['meta_keywords'] ?? ''));

        $productTitle = (string) ($data['title'] ?? $item?->title ?? '');
        $productDescription = (string) ($data['description'] ?? $item?->description ?? '');
        $siteName = (string) \App\Models\Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');

        $meta['title'] = $title !== '' ? $title : $this->buildMetaTitle($productTitle, $siteName);
        $meta['description'] = $description !== '' ? $description : $this->buildMetaDescription($productDescription, $productTitle);
        $meta['keywords'] = $keywords !== '' ? $keywords : $this->buildMetaKeywords($productTitle);

        unset($data['meta_title'], $data['meta_description'], $data['meta_keywords']);
        $data['meta'] = $meta;

        return $data;
    }

    private function buildMetaTitle(string $title, string $siteName): string
    {
        $title = preg_replace('/\s+/', ' ', trim($title)) ?: 'محصول آموزشی';

        return Str::limit($title, 55, '') !== '' && mb_strlen($title) <= 55
            ? $title.' | '.$siteName
            : mb_substr($title, 0, 60);
    }

    private function buildMetaDescription(string $description, string $fallbackTitle): string
    {
        $clean = preg_replace('/\s+/', ' ', trim((string) $description)) ?: '';
        if ($clean === '') {
            $clean = $fallbackTitle;
        }

        return mb_substr($clean, 0, 165);
    }

    private function buildMetaKeywords(string $title): string
    {
        return mb_substr(trim($title), 0, 120);
    }

    /** @param array<string, mixed> $config */
    private function withoutUploads(array $config, array $data): array
    {
        foreach ($config['fields'] as $field) {
            if (in_array(($field['type'] ?? ''), ['image', 'file'], true)) {
                unset($data[$field['name']]);
            }
        }

        return $data;
    }

    /**
     * Persists new uploads / removals for image-type fields. The model must already
     * exist so files can be named after its id (`{resource}-{id}-{field}.{ext}`) and
     * old files with the same prefix are cleaned up when replaced or removed.
     *
     * @param array<string, mixed> $config
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function applyImages(Request $request, string $resource, array $config, Model $item, array $data): array
    {
        $changes = [];
        foreach ($config['fields'] as $field) {
            if (($field['type'] ?? '') !== 'image') {
                continue;
            }

            $name = $field['name'];
            $value = $data[$name] ?? null;

            // An untouched field keeps its saved URL; nothing to do.
            if (is_string($value) && $value !== '') {
                continue;
            }

            $directory = public_path('images');
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $prefix = $resource.'-'.$item->getKey().'-'.$name;
            foreach (glob($directory.'/'.$prefix.'.*') ?: [] as $oldFile) {
                if (is_file($oldFile)) {
                    @unlink($oldFile);
                }
            }

            $file = $request->file($name);
            if ($file && $file->isValid()) {
                $extension = strtolower($file->extension() ?: 'jpg');
                $file->move($directory, $prefix.'.'.$extension);
                $changes[$name] = '/images/'.$prefix.'.'.$extension;
            } else {
                // Empty value: the image was explicitly removed.
                $changes[$name] = null;
            }
        }

        if ($changes !== []) {
            $item->update($changes);
        }

        return $changes;
    }

    /** @param array<string, mixed> $config */
    private function applyFiles(Request $request, string $resource, array $config, Model $item): void
    {
        foreach ($config['fields'] as $field) {
            if (($field['type'] ?? '') !== 'file') {
                continue;
            }

            $name = $field['name'];
            $file = $request->file($name);
            if (! $file || ! $file->isValid()) {
                continue;
            }

            $column = match ($name) {
                'preview_file' => 'preview_file_path',
                'download_file' => 'file_path',
                default => null,
            };
            if (! $column) {
                continue;
            }

            $disk = Storage::disk('local');
            $oldPath = $item->getAttribute($column);
            if (filled($oldPath)) {
                $disk->delete(ltrim((string) $oldPath, '/'));
            }

            $extension = strtolower($file->extension() ?: 'pdf');
            $path = $disk->putFileAs('products/'.$item->getKey(), $file, $name.'.'.$extension);
            $item->update([$column => $path]);
        }
    }

    /** @param array<string, mixed> $config */
    private function deleteFiles(string $resource, array $config, Model $item): void
    {
        foreach ($config['fields'] as $field) {
            if (($field['type'] ?? '') !== 'file') {
                continue;
            }

            $column = match ($field['name']) {
                'preview_file' => 'preview_file_path',
                'download_file' => 'file_path',
                default => null,
            };
            if ($column && filled($item->getAttribute($column))) {
                Storage::disk('local')->delete(ltrim((string) $item->getAttribute($column), '/'));
            }
        }
    }

    /** @param array<string, mixed> $config */
    private function deleteImageFiles(string $resource, array $config, int|string $id): void
    {
        foreach ($config['fields'] as $field) {
            if (($field['type'] ?? '') !== 'image') {
                continue;
            }

            foreach (glob(public_path('images/'.$resource.'-'.$id.'-'.$field['name'].'.*')) ?: [] as $oldFile) {
                if (is_file($oldFile)) {
                    @unlink($oldFile);
                }
            }
        }
    }
}
