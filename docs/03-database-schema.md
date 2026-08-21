# طراحی پایگاه‌داده (Database Schema)

> نسخه ۱.۰ — MariaDB/MySQL — utf8mb4 — کلیدهای خارجی ایندکس‌شده

## ۱. نقشه کلی ماژول‌ها و جداول

```
┌─ Identity ─┐   ┌─ LMS ──────────────┐   ┌─ Coaching ───────────┐
│ users      │   │ categories         │   │ coaches              │
│ roles      │   │ courses            │   │ coaching_sessions    │
│ permissions│   │ course_modules     │   │ coaching_goals       │
│ students   │   │ lessons            │   │ coaching_tasks       │
│ parents    │──▶│ lesson_progress    │   │ coaching_reports     │
│ instructors│   │ enrollments        │   │ coach_availability   │
│ coaches    │   │ quizzes/questions  │   │ students             │
└────────────┘   │ quiz_attempts      │   └──────────────────────┘
                 │ assignments/subm.  │   ┌─ Shop ───────────────┐
┌─ Content ──┐   │ certificates       │   │ products             │
│ blog_posts │   │ bookmarks, notes   │   │ podcast_episodes     │
│ tags       │   └────────────────────┘   │ orders, order_items  │
│ comments   │   ┌─ Services ────────┐   │ payments, coupons    │
│ reviews    │   │ services          │   │ wishlists            │
│ faqs       │   └───────────────────┘   └──────────────────────┘
│ testimonials                            ┌─ CRM ────────────────┐
│ media      │   ┌─ CMS ─────────────┐   │ leads                │
└────────────┘   │ pages, menus      │   │ lead_activities      │
                 │ settings, banners │   │ tickets/messages     │
└────────────────┴───────────────────┘   └──────────────────────┘
```

## ۲. جدول‌های هویت (Identity)

### users
`id, name, email (unique), phone (nullable, unique), password, avatar (nullable), bio, is_active (bool, default true), email_verified_at, remember_token, timestamps`

> والد/دانش‌آموز/مدرس/کوچ همگی `users` هستند + پروفایل اختصاصی. نقش‌ها از spatie.

### roles / permissions / model_has_roles / model_has_permissions / role_has_permissions
جداول استاندارد spatie/laravel-permission. نقش‌ها: `super-admin, admin, editor, instructor, coach, student, parent, customer`.

### students
`id, user_id (unique FK), parent_id (nullable FK→users), grade (مقطع), school, birth_date, talents (json), interests (json), created_at`

### parents
`id, user_id (unique FK), children (json), created_at` — رابطه والد/فرزند از طریق `students.parent_id`.

### instructors
`id, user_id (unique FK), specialty, bio, experience_years, is_featured (bool), created_at`

### coaches
`id, user_id (unique FK), specialty, bio, experience_years, hourly_rate, rating (float), is_featured, is_available (bool), created_at`

## ۳. LMS

### categories
`id, parent_id (nullable self-FK), name, slug (unique), type [course|product|blog|service], icon, sort_order, is_active, timestamps`

### courses
`id, instructor_id (FK), category_id (FK), title, subtitle, slug (unique), description (text), thumbnail, trailer_url, level [beginner|intermediate|advanced], price (decimal 12,0), discount_price (nullable), duration_minutes, certificate_enabled (bool), is_published, is_featured, students_count (int), rating_avg (float), seo (json: title, description), timestamps`

### course_modules
`id, course_id (FK), title, slug, sort_order, timestamps`

### lessons
`id, module_id (FK), course_id (FK), title, slug, type [video|article|quiz|assignment], video_url, video_type [upload|embed|vimeo|aparat], duration_minutes, content (longText), attachments (json), is_free (bool), sort_order, timestamps`

### enrollments
`id, user_id (FK), course_id (FK), status [active|completed], progress_percent, completed_at, enrolled_at, unique(user_id, course_id)`

### lesson_progress
`id, user_id (FK), lesson_id (FK), status [started|completed], progress_percent, completed_at, unique(user_id, lesson_id)`

### quizzes / questions / quiz_attempts
- `quizzes`: `id, lesson_id (FK), course_id (FK), title, description, passing_score, time_limit_minutes`
- `questions`: `id, quiz_id (FK), type [single|multiple|true_false], question, options (json), correct_answer (json), score`
- `quiz_attempts`: `id, user_id, quiz_id, score, answers (json), passed (bool), started_at, submitted_at`

### assignments / submissions
- `assignments`: `id, lesson_id (FK), course_id (FK), title, description, max_score, due_days`
- `submissions`: `id, assignment_id (FK), user_id, content, attachment, score (nullable), feedback, status [submitted|graded], submitted_at`

### certificates
`id, user_id (FK), course_id (FK), certificate_number (unique), issued_at, file_path, unique(user_id, course_id)`

### bookmarks / notes
- `bookmarks`: `id, user_id, lesson_id, unique(user_id, lesson_id)`
- `notes`: `id, user_id, lesson_id, content (text)`

## ۴. کوچینگ

### coaching_sessions
`id, coach_id (FK→users), student_id (FK→users), scheduled_at (datetime), duration_minutes, status [pending|confirmed|completed|cancelled], meeting_link, price, report (text), notes, rating (nullable), timestamps`

### coaching_goals
`id, student_id (FK), coach_id (FK), title, description, status [pending|in_progress|achieved], due_date, sort_order, timestamps`

### coaching_tasks
`id, goal_id (FK), student_id (FK), coach_id (FK), title, description, due_date, status [pending|done|overdue], completed_at, timestamps`

### coaching_reports
`id, session_id (FK), coach_id (FK), student_id (FK), content (text), next_steps, created_at`

### coach_availability
`id, coach_id (FK), available_date (date), start_time, end_time, is_booked (bool), timestamps`

## ۵. فروشگاه

### products
`id, type [book|podcast|digital|physical], title, slug (unique), description, image, category_id (FK), price, discount_price (nullable), stock (int), file_path, author, pages, publisher, isbn, audio_duration_seconds, preview_url, is_active, is_featured, meta (json), timestamps`

### podcast_episodes
`id, product_id (FK, نوع podcast), title, description, audio_url, cover, duration_seconds, transcript (longText), is_free, published_at, sort_order`

### orders
`id, order_number (unique), user_id (FK), status [cart|pending|paid|failed|cancelled|refunded], subtotal, discount, coupon_id (nullable FK), total, payment_method, paid_at (nullable), billing (json), timestamps`

### order_items
`id, order_id (FK), purchasable_type, purchasable_id (polymorphic: Course|Product|Service), title, unit_price, quantity, total` — ایندکس مرکب (purchasable_type, purchasable_id)

### payments
`id, order_id (FK), user_id (FK), gateway [zarinpal|payping|idpay|zibal|cash], transaction_id, amount, status [pending|success|failed|refunded], reference_id, verified_at, meta (json), timestamps`

### coupons
`id, code (unique), type [percent|fixed], value, max_uses, used_count, min_order, expires_at, is_active, timestamps`

### wishlists
`id, user_id (FK), wishlistable_type, wishlistable_id (polymorphic), unique(user_id, wishlistable_type, wishlistable_id)`

## ۶. محتوا

### blog_posts
`id, author_id (FK→users), category_id (FK), title, slug (unique), excerpt, body (longText), cover_image, status [draft|published|archived], published_at, reading_time, views_count, is_featured, seo (json), timestamps`

### tags / taggables
- `tags`: `id, name (unique), slug (unique)`
- `taggables`: `tag_id, taggable_type, taggable_id`

### media
`id, name, file_name, mime_type, disk [local|s3], size, folder, url_path, alt, type [image|video|audio|document], collection, mediable_type, mediable_id (nullable), created_at` — قابل اتصال به هر مدل

### comments
`id, user_id (FK), commentable_type, commentable_id, parent_id (nullable self-FK), body, is_approved (bool), timestamps`

### reviews
`id, user_id (FK), reviewable_type, reviewable_id, rating (1-5), title, body, is_approved (bool), timestamps`

### faqs
`id, faqable_type, faqable_id, question, answer, sort_order`

### testimonials
`id, name, role [parent|student|instructor|coach|partner], avatar, content, rating, is_approved, sort_order`

### banners
`id, title, image, link, position [home_hero|home_middle|sidebar], sort_order, is_active, timestamps`

## ۷. خدمات

### services
`id, title, slug (unique), summary, description (longText), icon, image, price (nullable decimal), is_active, is_featured, features (json), process (json), target_audience (json), outcomes (json), faqs (json), cta_text, cta_url, sort_order, seo (json), timestamps`

## ۸. CRM

### leads
`id, name, phone, email (nullable), child_age, grade, need, service_type, source [website|instagram|eitaa|referral|other], status [new|contacted|interested|consultation|registered|customer], assigned_to (nullable FK→users), notes (text), tags (json), last_activity_at, timestamps`

### lead_activities
`id, lead_id (FK), user_id (nullable FK), type [note|call|follow_up|status_change], description, created_at`

### tickets / ticket_messages
- `tickets`: `id, user_id (FK), subject, body, status [open|answered|closed], priority [low|medium|high], assigned_to (nullable FK), timestamps`
- `ticket_messages`: `id, ticket_id (FK), user_id (FK), body, attachment (nullable), created_at`

## ۹. CMS / سیستم

### pages
`id, title, slug (unique), template, sections (json — Page Builder), seo (json), status [draft|published], timestamps`

### menus
`id, name, location [header|footer|mobile], items (json: title, url, children), is_active, timestamps`

### settings
`id, group, key, value (json), is_public (bool), unique(group, key)` — اطلاعات تماس، برند، SEO، درگاه، ایمیل...

### page_views (Analytics)
`id, url, title, referrer, user_agent, ip_hash, user_id (nullable FK), visited_at`

### جداول فریم‌ورک
`jobs, job_batches, failed_jobs, cache, cache_locks, sessions, password_reset_tokens` (پیش‌فرض Laravel)

## ۱۰. روابط کلیدی (Highlights)

- `students.parent_id → users.id` : والد می‌تواند چند فرزند (student) داشته باشد.
- `lessons → course_modules → courses` : سلسله‌مراتب دوره.
- `order_items` با `purchasable_*` : یک سفارش می‌تواند دوره/محصول/سرویس ترکیبی داشته باشد.
- `reviews/comments/faqs/wishlists/media` : Polymorphic → قابل استفاده برای هر موجودیت.
- `coaching_sessions` هم کوچ و هم دانش‌آموز از `users` (بدون جدول میانی اضافه).
- `settings` گروه‌بندی‌شده (site, contact, brand, seo, payment, email, notifications, security, storage, general).
