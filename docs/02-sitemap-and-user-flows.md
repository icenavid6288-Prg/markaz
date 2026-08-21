# نقشه سایت (Sitemap) و جریان‌های کاربر

> نسخه ۱.۰ — «مرکز رشد و کارآفرینی دکتر بیدی»

## ۱. نقشه سایت

### بخش عمومی (Public)
```
/
├── دوره‌ها              /courses            (فیلتر: دسته، سطح، مدرس، جستجو)
│   └── جزئیات دوره     /courses/{slug}      (سرفصل، مدرس، نظرات، FAQ، CTA)
├── کوچینگ              /coaching            (معرفی، کوچ‌ها، روش کار)
│   └── پروفایل کوچ     /coaching/coaches/{slug}
│   └── رزرو جلسه       /coaching/book
├── خدمات               /services            (لیست سرویس‌ها)
│   └── جزئیات سرویس   /services/{slug}
├── فروشگاه             /shop                (محصولات + جستجو + فیلتر)
│   ├── کتاب‌ها         /shop/books
│   ├── پادکست‌ها       /podcasts
│   └── جزئیات محصول   /shop/{slug}
├── بلاگ                /blog                (دسته، برچسب، جستجو)
│   └── مقاله           /blog/{slug}
├── درباره ما           /about               (دکتر بیدی، تیم، سوابق، مجوزها)
├── تماس با ما          /contact             (فرم لید + اطلاعات تماس از Settings)
├── ثبت‌نام / ورود      /register  /login
└── صفحات CMS           /pages/{slug}        (ساخته‌شده از پنل ادمین)
```

### پنل کاربری (ورود اجباری)
```
/dashboard                 خانه: سلام، مسیر رشد، پیشنهادها
/dashboard/courses         دوره‌های من + پیشرفت + ادامه یادگیری
/dashboard/coaching        جلسات من، اهداف، تسک‌ها
/dashboard/orders          سفارش‌ها و فاکتورها
/dashboard/wishlist        علاقه‌مندی‌ها
/dashboard/notifications   اعلان‌ها
/dashboard/profile         پروفایل
```

### پنل والد
```
/parent/dashboard          وضعیت فرزند: پیشرفت، جلسات، گزارش کوچ، اهداف، مهارت‌ها
/parent/children           مدیریت فرزندان (ارتباط student ↔ parent)
```

### پنل مدرس
```
/instructor/dashboard      آمار دوره‌ها و دانش‌آموزان
/instructor/courses        مدیریت دوره‌ها (CRUD)
/instructor/lessons        مدیریت درس‌ها، فایل‌ها، آزمون، تکلیف
/instructor/students       دانش‌آموزان و پیشرفت آن‌ها
/instructor/reviews        نظرات
```

### پنل کوچ
```
/coach/dashboard           تقویم جلسات، جلسات امروز
/coach/students            دانش‌آموزان و فایل رشد
/coach/sessions            جلسات + گزارش جلسه + یادداشت
/coach/goals               اهداف و تسک‌های دانش‌آموزان
/coach/calendar            زمان‌های آزاد و رزروها
```

### پنل ادمین
```
/admin                     داشبورد: آمار، نمودار درآمد/ثبت‌نام/فروش
/admin/users  /roles  /permissions
/admin/students  /parents  /instructors  /coaches
/admin/courses  /lessons  /modules  /quizzes  /certificates
/admin/services
/admin/products  /books  /podcasts  /coupons  /orders  /payments
/admin/categories  /blog  /tags  /comments  /reviews
/admin/testimonials  /tickets  /notifications
/admin/leads  (CRM)
/admin/pages  /menus  /banners  /seo  /settings  /settings/sms  /settings/payments  /settings/automations  /media
/admin/reports
```

## ۲. جریان‌های کاربر (User Flows)

### جریان «والد نوجوان» (مسیر اصلی فروش)
```
ورود به سایت
  → دیدن مسئله (Hero: «آیا فرزند شما مسیرش را می‌شناسد؟»)
  → بخش «آیا این برای شما آشناست؟» (تعامل، Need Creation)
  → معرفی روش اختصاصی (Understanding + Trust)
  → مشاهده دوره‌ها / کوچینگ / خدمات (Desire)
  → مشاهده نظرات والدین و نتایج (Proof)
  → CTA: «دریافت مشاوره رایگان» → فرم لید (نام، موبایل، سن فرزند، مقطع، نیاز)
  → ثبت لید در CRM → تیم تماس می‌گیرد
  → (یا) ثبت‌نام + خرید دوره / رزرو جلسه کوچینگ
```

### جریان «خرید دوره»
```
مرور دوره → جزئیات (سرفصل، مدرس، نظرات) → افزودن به سبد
  → تسویه (کوپن، فاکتور) → پرداخت (درگاه) → Verify → فعال‌سازی دسترسی
  → اعلان (ایمیل + In-App) → شروع یادگیری در داشبورد
```

### جریان «کوچینگ»
```
انتخاب کوچ → مشاهده پروفایل (تخصص، تجربه، امتیاز) → انتخاب زمان از تقویم
  → پرداخت → رزرو ثبت شد → یادآوری جلسه → گزارش جلسه توسط کوچ
  → والد پیشرفت را در پنل والد می‌بیند → پیشنهادهای بعدی
```

### جریان «ثبت‌نام»
```
ثبت‌نام (نام، ایمیل/موبایل، رمز) → Verify ایمیل → انتخاب نقش
  (دانش‌آموز / والد / مدرس / کوچ) → تکمیل پروفایل → دسترسی به داشبورد مناسب
```

## ۳. قیف لید (Lead Funnel)
```
New → Contacted → Interested → Consultation → Registered → Customer
(هر تغییر وضعیت در lead_activities ثبت و در CRM اعلان می‌شود)
```

## ۴. سفر طراحی (Design Journey)
کل سایت بر اساس این توالی طراحی می‌شود:
```
Problem → Awareness → Understanding → Trust → Desire → Solution → Proof → Action
```
این توالی در صفحه اصلی، صفحه هر سرویس و صفحات دوره پیاده‌سازی می‌شود.
