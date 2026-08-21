# طراحی API

> نسخه ۱.۰ — RESTful — Versioned (`/api/v1`)

## ۱. اصول

- نسخه‌بندی از مسیر: `/api/v1/...`
- Auth: **Sanctum** (Bearer token) برای API؛ Session برای پنل‌های Inertia
- پاسخ‌ها JSON با ساختار یکسان:
```json
{ "data": { ... }, "meta": { "pagination": {...} } }
```
- خطاها: `{ "message": "...", "errors": { "field": ["..."] } }` (اعتبارسنجی 422)
- Rate Limiting: `throttle:api` (پیش‌فرض ۶۰/دقیقه)، ورود ۵/دقیقه
- همه Resourceها Paginated و قابل فیلتر (`?search=&category=&sort=`)
- Caching با `Cache-Control` روی Resourceهای عمومی

## ۲. فهرست Endpointها

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/verify-email/{id}/{hash}
POST   /api/v1/auth/email/verification-notification
GET    /api/v1/auth/user
```

### کاربران و نقش‌ها (Admin)
```
GET/POST    /api/v1/users            (index, store)
GET/PUT/DEL /api/v1/users/{user}
GET/POST    /api/v1/roles
GET/PUT/DEL /api/v1/roles/{role}
GET/POST    /api/v1/permissions
```

### محتوای عمومی
```
GET  /api/v1/courses                (?search, category, level, instructor, sort, page)
GET  /api/v1/courses/{course}       (سرفصل کامل، مدرس، نظرات)
GET  /api/v1/courses/{course}/lessons
GET  /api/v1/services
GET  /api/v1/services/{service}
GET  /api/v1/products               (?type=book|podcast|digital)
GET  /api/v1/products/{product}
GET  /api/v1/podcasts               (پادکست‌ها + اپیزودها)
GET  /api/v1/blog                   (?category, tag, search)
GET  /api/v1/blog/{post}
GET  /api/v1/categories             (?type=)
GET  /api/v1/search?q=              (جستجوی جامع)
GET  /api/v1/instructors
GET  /api/v1/coaches
GET  /api/v1/testimonials
```

### یادگیری (Authenticated)
```
GET  /api/v1/my/courses             (دوره‌های من + پیشرفت)
GET  /api/v1/my/progress
POST /api/v1/lessons/{lesson}/progress
POST /api/v1/lessons/{lesson}/bookmark
POST /api/v1/lessons/{lesson}/notes
POST /api/v1/quizzes/{quiz}/attempt
POST /api/v1/assignments/{assignment}/submit
GET  /api/v1/my/certificates
```

### کوچینگ (Authenticated)
```
GET  /api/v1/coaches/{coach}/availability
POST /api/v1/coaching/book           (رزرو جلسه + پرداخت)
GET  /api/v1/my/coaching/sessions
POST /api/v1/coaching/sessions/{session}/report   (کوچ)
GET  /api/v1/my/coaching/goals
POST /api/v1/coaching/goals/{goal}/tasks
GET  /api/v1/parent/children/{student}/progress   (والد)
```

### فروشگاه (Authenticated)
```
GET    /api/v1/cart
POST   /api/v1/cart/items
DELETE /api/v1/cart/items/{item}
POST   /api/v1/cart/apply-coupon
POST   /api/v1/orders
POST   /api/v1/orders/{order}/pay       (شروع پرداخت → لینک درگاه)
POST   /api/v1/payments/verify          (Verify از درگاه)
GET    /api/v1/my/orders
GET    /api/v1/my/orders/{order}
GET/POST /api/v1/wishlist
```

### اعلان‌ها و پشتیبانی
```
GET  /api/v1/notifications
POST /api/v1/notifications/{id}/read
GET/POST /api/v1/tickets
POST /api/v1/tickets/{ticket}/messages
```

### CRM (Admin)
```
GET/POST /api/v1/leads
GET/PUT  /api/v1/leads/{lead}
POST     /api/v1/leads/{lead}/activities
```

### آمار (Admin)
```
GET /api/v1/admin/dashboard       (خلاصه)
GET /api/v1/admin/reports/revenue
GET /api/v1/admin/reports/registrations
GET /api/v1/admin/reports/sales
GET /api/v1/admin/analytics       (بازدیدها)
GET /api/v1/admin/analytics/export (CSV/Excel/PDF)
```

## ۳. قواعد پیاده‌سازی

- Resource Controllers: `App\Http\Controllers\Api\V1\...`
- Authorization با Policy + Middleware (`role:admin`, `permission:manage-courses`)
- Form Request برای هر ورودی
- `ApiResource` برای شکل‌دهی خروجی
- تراکنش‌های مالی: DB transaction + Events (`OrderPaid`, `SessionBooked`)
- اعلان‌ها از طریق Queue (ایمیل) + جدول notifications (In-App)
