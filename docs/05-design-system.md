# سیستم طراحی (Design System)

> نسخه ۱.۰ — مفهوم مرکزی: «مسیر رشد»

## ۱. هویت برند

**پیام:** اعتماد، رشد، تخصص، آینده‌نگری، امنیت، حرفه‌ای‌گری، نوآوری، اصالت

**شخصیت بصری:** Premium، Modern، Clean — با حس «سفر/مسیر» (خطوط، گرادیان‌های ملایم، عمق و لایه‌بندی).

## ۲. پالت رنگ (Tailwind v4 tokens)

| توکن | مقدار | کاربرد |
|---|---|---|
| `--color-brand-50…950` | سبز اصلی (Emerald-based, متمایل به Deep) | دکمه‌ها، لینک‌ها، تأکید |
| `--color-deep-green` | سبز تیره (`#0c3b2e`) | هدرها، پس‌زمینه‌های تیره |
| `--color-navy` | سرمه‌ای تیره (`#0b1f3a`) | متن‌ها، بخش‌های تیره |
| `--color-soft-gray` | خاکستری ملایم (`#f4f7f6`) | پس‌زمینه بخش‌ها |
| `--color-gold` | طلایی (`#c9a227`) — **بسیار محدود** | Accent لوکس (نشان‌ها، امتیاز) |
| `--color-white` | سفید | پس‌زمینه اصلی |

**قاعده:** حداکثر ۲-۳ رنگ در هر View؛ طلایی فقط برای نقاط خاص.

## ۳. تایپوگرافی

- فونت: **Vazirmatn** (وزن‌های 300/400/500/700/900) — فارسی، RTL، خوانا
- سلسله‌مراتب: `display (4xl-6xl, font-black) → h1-h3 → body → caption`
- متن بدنه ۱۶px، خط ۱.۸ — تایپوگرافی خوانا (WCAG AA)

## ۴. فضاسازی و شکل

- Radius: `rounded-2xl` (کارت‌ها)، `rounded-full` (دکمه‌ها/نشان‌ها)
- سایه: سایه‌های نرم چندلایه + `ring` ظریف
- Glassmorphism: `backdrop-blur` کنترل‌شده فقط روی Navbar/Cards شناور
- گرادیان: `deep-green → emerald` برای CTA و Hero

## ۵. کامپوننت‌های UI (resources/js/Components/ui)

```
Button (variants: primary, secondary, ghost, gold; sizes; loading)
Input / Textarea / Select / Checkbox / Radio / Switch / SearchInput
Card (interactive hover, floating icon)
Badge / StatusBadge / Pill
Modal / Drawer
Dropdown / Menu
Tabs / Accordion / Stepper
Table / DataTable (sort, filter, pagination)
Toast / Alert / EmptyState
Progress (خطی، حلقوی)
Timeline (مسیر رشد)
StatCard (آمار متحرک)
Avatar / Skeleton / Spinner
Navbar / Footer / Sidebar / Breadcrumb
Pagination / Calendar (رزرو کوچ) / RatingStars
SectionHeading (عنوان + دکمه)
```

## ۶. موشن (Performance-Friendly)

- Scroll reveal (IntersectionObserver — سبک، بدون کتابخانه سنگین)
- Hover: lift + shadow، دکمه‌ها با `active:scale-[0.98]`
- اعداد متحرک (CountUp) برای آمار
- انتقال صفحات: Fade/Slide کوتاه (Inertia progress)
- همه با CSS transitions/transform (GPU-friendly)، بدون کتابخانه انیمیشن سنگین

## ۷. مفهوم «مسیر رشد» در UI

- **Timeline عمودی** در صفحه اصلی (شناخت ← کشف ← تجربه ← مهارت ← تصمیم ← اجرا ← استقلال)
- **Progress Ring / Bar** در داشبوردها
- **نقشه مسیر** (Path visualization) در پنل دانش‌آموز
- اعداد و نشان‌های مرحله (`01 … 07`) در بخش‌های سرویس‌ها

## ۸. RTL

- `dir="rtl"` در `<html>`، `lang="fa"`
- Tailwind v4 با `rtl:` variant برای فواصل
- Font-feature اعداد فارسی (`font-feature-settings`)

## ۹. دسترس‌پذیری (WCAG)

- کنتراست ≥ 4.5:1 متن‌ها
- Keyboard navigation کامل
- ARIA labels روی آیکون‌ها و اینتراکشن‌ها
- Focus visible ring برند
- `prefers-reduced-motion` برای غیرفعال‌کردن انیمیشن‌ها
