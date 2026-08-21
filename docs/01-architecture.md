# معماری پلتفرم «مرکز رشد و کارآفرینی دکتر بیدی»

> سند معماری سطح بالا — نسخه ۱.۰ — مرداد ۱۴۰۵

## ۱. خلاصه اجرایی

این پلتفرم یک **Ecosystem دیجیتال کامل** است: وب‌سایت عمومی + LMS + کوچینگ + فروشگاه دیجیتال + CRM + پنل‌های اختصاصی (کاربر، والد، دانش‌آموز، مدرس، کوچ، ادمین). تمام داده‌ها از Database خوانده می‌شوند؛ هیچ بخشی Static یا Fake نیست. مفهوم مرکزی طراحی، **«مسیر رشد»** است: شناخت ← کشف ← رشد ← مهارت ← تصمیم ← اقدام ← استقلال ← آینده.

## ۲. انتخاب‌های فنی (Tech Stack)

| لایه | انتخاب | دلیل |
|---|---|---|
| Backend | **Laravel 12** (PHP 8.2+) | آخرین نسخه Stable؛ اکوسیستم بالغ |
| Database | **MariaDB 10.4 / MySQL** | نصب‌شده روی XAMPP محلی؛ Production-ready |
| Cache / Queue | **Redis** (در Production) | معماری از ابتدا آماده؛ در Dev از `database`/`sync` استفاده می‌شود |
| Auth | **Laravel Breeze + Sanctum** | session-based برای پنل‌ها + توکن برای API |
| Authorization | **spatie/laravel-permission** | Roles/Permissions کاملاً Dynamic |
| Frontend | **Inertia.js v3 + React 19 + TypeScript** | SPA بدون API جدا؛ تفکیک‌پذیر |
| CSS | **Tailwind CSS v4** + Design System اختصاصی | سریع، سازگار با RTL |
| Icons | **Lucide React** | مدرن و سبک |
| Charts | **Recharts** | داشبوردهای پویا |
| Forms | **React Hook Form + Zod** | Validation دوطرفه |
| Storage | **Laravel Filesystem (local → S3-ready)** | از طریق `FILESYSTEM_DISK` |
| Build | **Vite 8 + @inertiajs/vite** | Code splitting و Lazy loading خودکار |

> **تفکیک‌پذیری Frontend/Backend:** Inertia به معنی چسبیدن به هم نیست؛ تمام داده‌ها از طریق Controllerهای استاندارد و Resourceها منتقل می‌شوند و لایه API (فصل ۴) به‌صورت موازی قابل توسعه است. در صورت نیاز به اپ موبایل، همان Controllerها به‌صورت JSON در می‌آیند.

## ۳. معماری کلان

```
┌─────────────────────────────────────────────────────────┐
│  وب‌سایت عمومی (Inertia SPA)  │  پنل‌های اختصاصی (SPA) │
│  /  /courses /coaching ...    │  /dashboard  /admin    │
└───────────────┬──────────────────────────┬─────────────┘
                │        Inertia (JSON)     │
┌───────────────▼──────────────────────────▼─────────────┐
│  لایه HTTP: Controllers + Middleware + Form Requests   │
│  (Auth, Role, Permission, RateLimit, Verified)         │
├────────────────────────────────────────────────────────┤
│  لایه Domain: Services + Actions (Domain Services)     │
│  (EnrollmentService, OrderService, BookingService,     │
│   PaymentService, LeadService, NotificationService)    │
├────────────────────────────────────────────────────────┤
│  لایه Data: Eloquent Models + Repositories (اختیاری)  │
├────────────────────────────────────────────────────────┤
│  زیرساخت: Queue (jobs/notifications) + Cache (Redis)  │
│  + Filesystem (media) + Events/Listeners               │
└────────────────────────────────────────────────────────┘
```

### قواعد معماری
- **بدون God Controller:** هر Controller فقط یک Resource را مدیریت می‌کند.
- **بدون God Component:** کامپوننت‌های React کوچک و تک‌وظیفه.
- **منطق تجاری در Domain Services** قرار می‌گیرد، نه در Controller.
- **همه‌چیز Dynamic:** Settings، Menus، Pages، SEO از Database.
- **Permission روی هر Action مدیریتی** — هیچ کاری بدون Check انجام نمی‌شود.

## ۴. ساختار ماژول‌ها

| ماژول | مسئولیت‌ها |
|---|---|
| `Auth` | ثبت‌نام، ورود، بازیابی رمز، Verify ایمیل |
| `Users/Roles/Permissions` | کاربران، نقش‌ها، دسترسی‌ها (Dynamic) |
| `LMS` | دوره، ماژول، درس، پیشرفت، آزمون، تکلیف، گواهینامه |
| `Coaching` | کوچ‌ها، جلسات، اهداف، تسک‌ها، گزارش جلسه، والد/دانش‌آموز |
| `Shop` | محصولات، کتاب، پادکست، سبد خرید، سفارش، پرداخت، کوپن |
| `Content` | بلاگ، دسته‌بندی، برچسب، نظرات، مدیا |
| `CMS` | صفحات، منوها، بنرها، SEO، بخش‌های صفحه |
| `CRM` | لید، قیف، فعالیت‌ها، پیگیری |
| `Notifications` | In-App + Email (SMS در آینده) |
| `Reports/Analytics` | آمار، نمودارها، Export |

## ۵. ساختار پوشه‌ها (Backend)

```
app/
├── Http/
│   ├── Controllers/          # Resource Controllers (Admin/Public/Api)
│   ├── Middleware/           # Role, Permission, ForceJson, etc.
│   └── Requests/             # Form Request Validation
├── Models/                   # Eloquent Models
├── Services/                 # Domain Services (تجاری)
├── Actions/                  # تک‌عملیات‌ها (مثل ChargeWallet)
├── Jobs/                     # Queue Jobs (ایمیل، اعلان، گزارش)
├── Events/ + Listeners/      # رویدادها (OrderPaid, SessionBooked...)
├── Enums/                    # Enumهای PHP (OrderStatus, PaymentStatus...)
├── Support/                  # Helpers (PersianNumber, Money...)
└── Providers/
routes/
├── web.php                   # صفحات عمومی + پنل‌ها
├── admin.php                 # مسیرهای ادمین (با middleware)
├── api.php                   # API نسخه‌دار /api/v1
└── console.php               # Cron ها (کپی بکاپ، پاکسازی، یادآوری‌ها)
```

## ۶. معماری Frontend

```
resources/js/
├── app.tsx                   # Boot Inertia v3
├── css/app.css               # Tailwind v4 + Design Tokens
├── Components/ui/            # Design System (Button, Card, Badge, Modal...)
├── Components/               # کامپوننت‌های حوزه‌ای (CourseCard, SessionCalendar...)
├── Layouts/                  # PublicLayout, AdminLayout, DashboardLayout
├── Pages/                    # صفحات (Home, Courses, Admin/Users, ...)
├── Composables/ (hooks)      # useMoney, useToast, usePermission...
├── Types/                    # تایپ‌های مشترک با Backend
└── lib/                      # api client, formatters, validators
```

## ۷. امنیت

- CSRF (توکن پیش‌فرض Laravel)، XSS (فرار خودکار Inertia/React)، SQL Injection (Eloquent + Prepared)
- Rate Limiting روی Auth و API (`throttle`)
- **Authorization:** middleware نقش + `can()` + Policy برای هر Resource
- آپلود امن فایل: اعتبارسنجی MIME + ذخیره خارج از `public` + نام‌گذاری هش
- هش رمز (bcrypt/argon)، Session امن، لاگ‌گیری (Laravel Logging)
- تمام تراکنش‌های مالی در `payments` ثبت می‌شوند (قابل Audit)

## ۸. Performance

- Lazy loading صفحات (کداسپلیت خودکار Vite/Inertia)
- کش Redis برای Settings، منوها، صفحات عمومی
- ایندکس‌گذاری کلیدهای خارجی و ستون‌های پرتکرار
- Eager Loading برای جلوگیری از N+1
- تصاویر WebP/AVIF + CDN-ready (storage به S3)
- Query بهینه + pagination استاندارد
