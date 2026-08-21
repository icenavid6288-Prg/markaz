# نقشه راه توسعه (Development Roadmap)

> هر فاز: قابل اجرا + قابل تست — پیش‌نیاز فاز بعد

## فاز ۰ — زیرساخت ✅ (در حال اجرا)
- [x] راه‌اندازی Laravel 12 + Inertia v3 + React 19 + TS + Tailwind v4
- [x] MariaDB + .env + Breeze Auth
- [x] spatie/laravel-permission
- [ ] مستندات معماری (این پوشه)

## فاز ۱ — داده و هویت (Database + Auth + RBAC)
- [ ] Migrationهای کامل (فصل ۳)
- [ ] Modelهای Eloquent + روابط
- [ ] Seeder: نقش‌ها/دسترسی‌ها، کاربر ادمین، تنظیمات سایت (آدرس/تلفن/Eitaa/site)
- [ ] Verification ایمیل + صفحات Auth (Breeze)
- [ ] تست‌های Auth

## فاز ۲ — پنل ادمین (Admin Panel)
- [ ] AdminLayout (RTL, Sidebar, Topbar)
- [ ] داشبورد: آمار + نمودار درآمد/ثبت‌نام/فروش (Recharts)
- [ ] مدیریت کاربران + نقش‌ها + دسترسی‌ها
- [ ] Settings (تماس، برند، SEO، درگاه، ایمیل)
- [ ] مدیا لایبرری (آپلود، دسته‌بندی، جایگزینی)
- [ ] ماژول‌های CRUD: دوره‌ها، خدمات، محصولات، بلاگ، لیدها (CRM)

## فاز ۳ — وب‌سایت عمومی
- [ ] Design System نهایی (کامپوننت‌ها + موشن)
- [ ] صفحه اصلی Story-driven (Hero، Problem، روش، مسیر رشد، دوره‌ها، نظرات، CTA)
- [ ] صفحات دوره/سرویس/محصول/بلاگ/کوچینگ
- [ ] جستجوی جامع + فیلترها
- [ ] فرم‌های لید → CRM
- [ ] CMS: صفحات و منوها از دیتابیس + SEO

## فاز ۴ — LMS
- [ ] داشبورد دانش‌آموز (پیشرفت، ادامه یادگیری)
- [ ] Course Player (ویدیو، ناوبری، یادداشت، بوکمارک)
- [ ] آزمون و تکلیف + تصحیح
- [ ] گواهینامه

## فاز ۵ — کوچینگ
- [ ] پروفایل کوچ + تقویم رزرو
- [ ] جلسات + گزارش + اهداف + تسک‌ها
- [ ] پنل والد (وضعیت فرزند، گزارش‌ها)

## فاز ۶ — فروشگاه و پرداخت
- [ ] سبد خرید + کوپن + تسویه
- [ ] درگاه پرداخت (Gateway-independent: Zarinpal/IDPay/Zibal)
- [ ] سفارش/فاکتور/پیگیری
- [ ] پادکست‌پلیر + کتاب‌ها

## فاز ۷ — اعلان، گزارش، تکمیل
- [ ] Notification Center (In-App + Email + Queue)
- [ ] تیکت‌ها و پشتیبانی
- [ ] گزارش‌ها + Export (CSV/Excel/PDF)
- [ ] آنالیتیکس (page_views)

## فاز ۸ — Production
- [ ] تست‌های Feature (Auth, Orders, Enrollment, Booking, Payments)
- [ ] Redis + Queue + Cron
- [ ] S3 Storage + CDN
- [ ] Nginx + Supervisor + بکاپ
- [ ] Docker (اختیاری) + مستندات Deploy

## فاز ۹ — آینده
PWA، اپ موبایل، AI Recommendation، لایو کلاس، اشتراک (Subscription)، Marketplace، CRM پیشرفته.
