<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\AppIconController;
use App\Http\Controllers\AppManifestController;
use App\Http\Controllers\Admin\AdminLeadsController;
use App\Http\Controllers\Admin\CrmDashboardController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\OrderRefundController;
use App\Http\Controllers\Admin\ReportExportController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\InstagramController;
use App\Http\Controllers\Admin\EitaaBotController;
use App\Http\Controllers\Admin\SurveyController as AdminSurveyController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\Admin\MarketingController;
use App\Http\Controllers\Admin\PageStudioController;
use App\Http\Controllers\Admin\PerslineController;
use App\Http\Controllers\Admin\MarketingRecipientImportController;
use App\Http\Controllers\Admin\BulkSmsController;
use App\Http\Controllers\Admin\BulkSmsReportController;
use App\Http\Controllers\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Admin\AssignmentController as AdminAssignmentController;
use App\Http\Controllers\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CoursePlayerController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MarketingConsentController;
use App\Http\Controllers\NotificationCenterController;
use App\Http\Controllers\CoachDashboardController;
use App\Http\Controllers\ParentDashboardController;
use App\Http\Controllers\CoachingBookingController;
use App\Http\Controllers\InstructorDashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\PublicStorageController;
use App\Http\Controllers\SiteLogoController;
use App\Http\Controllers\ProductDownloadController;
use App\Http\Controllers\ProductPreviewController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\NotificationSubscriptionController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\SupportChatController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\Admin\SupportChatController as AdminSupportChatController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\Public\AboutController;
use App\Http\Controllers\Public\BlogController;
use App\Http\Controllers\Public\CoachingController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\CourseController as PublicCourseController;
use App\Http\Controllers\Public\ServiceController as PublicServiceController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\ShopController;
use App\Http\Controllers\Public\TeamController;
use App\Http\Controllers\Public\InstructorController;
use App\Http\Controllers\Public\CoachController;
use App\Http\Controllers\Public\CmsPageController;
use App\Http\Controllers\Public\EventController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LearningSupportController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

// Google Search Console prerequisites: the sitemap and robots.txt must be
// reachable at the domain root and are registered before the storage fallback.
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', fn () => response(implode("\n", [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /dashboard',
    'Disallow: /panel',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /profile',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /verify-email',
    'Disallow: /confirm-password',
    '',
    'Sitemap: '.url('/sitemap.xml'),
    '',
]))->header('Content-Type', 'text/plain; charset=UTF-8')->header('Cache-Control', 'public, max-age=3600'))->name('robots');

// Shared-host fallback for installations where `storage:link` is unavailable.
// Public uploads remain under storage/app/public and private downloads never use this route.
Route::get('/storage/{path}', PublicStorageController::class)
    ->where('path', '.*')
    ->name('public.storage');
Route::get('/site-logo', SiteLogoController::class)->name('site.logo');
Route::get('/app-icon', AppIconController::class)->name('app.icon');
Route::get('/app-manifest.webmanifest', AppManifestController::class)->name('app.manifest');

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/courses', [PublicCourseController::class, 'index'])->name('courses.index');
Route::get('/courses/{course:slug}', [PublicCourseController::class, 'show'])->name('courses.show');
Route::get('/services', [PublicServiceController::class, 'index'])->name('services.index');
Route::get('/services/{service:slug}', [PublicServiceController::class, 'show'])->name('services.show');
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{post:slug}', [BlogController::class, 'show'])->name('blog.show');
Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('/shop/{product:slug}', [ShopController::class, 'show'])->name('shop.show');
Route::get('/search', SearchController::class)->middleware('throttle:30,1')->name('search');
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/products/{product}', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/products/{product}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/products/{product}', [CartController::class, 'destroy'])->name('cart.destroy');
    Route::post('/cart/coupon', [CartController::class, 'applyCoupon'])->middleware('throttle:10,1')->name('cart.coupon.apply');
    Route::delete('/cart/coupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.remove');
Route::get('/coaching', [CoachingController::class, 'index'])->name('coaching.index');
Route::get('/about', [AboutController::class, 'index'])->name('about.index');
Route::get('/team', [TeamController::class, 'index'])->name('team.index');
Route::get('/instructors/{instructor}', [InstructorController::class, 'show'])->name('instructors.show');
Route::get('/coaches/{coach}', [CoachController::class, 'show'])->name('coaches.show');
Route::get('/contact', [ContactController::class, 'index'])->name('contact.index');
Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{event:slug}', [EventController::class, 'show'])->name('events.show');
Route::get('/p/{page:slug}', [CmsPageController::class, 'show'])->name('pages.show');

// Private, unlisted surveys are shared directly from the admin panel.
Route::get('/survey/{survey}/register', [SurveyController::class, 'register'])->name('survey.register');
Route::post('/survey/{survey}/register', [SurveyController::class, 'storeRegistration'])->middleware('throttle:5,1')->name('survey.register.store');
    Route::post('/survey/{survey}/register/verify', [SurveyController::class, 'verifyRegistration'])->middleware('throttle:5,1')->name('survey.register.verify');
Route::post('/survey/{survey}/answer', [SurveyController::class, 'answer'])->middleware('throttle:30,1')->name('survey.answer');
Route::get('/survey/{survey}', [SurveyController::class, 'show'])->name('survey.show');

// پشتیبانی زنده — چت سایت؛ پاسخ‌دهی ترکیبی هوش مصنوعی و ادمین‌ها
Route::prefix('support-chat')->name('support-chat.')->group(function () {
    Route::post('/conversations', [SupportChatController::class, 'store'])->middleware('throttle:20,1')->name('conversations.store');
    Route::get('/conversations/{conversation}/messages', [SupportChatController::class, 'messages'])->name('messages');
    Route::post('/conversations/{conversation}/messages', [SupportChatController::class, 'send'])->middleware('throttle:12,1')->name('send');
});

// Public certificate verification — anyone can look up a certificate number.
Route::get('/verify/{certificate:certificate_number}', [CertificateController::class, 'verify'])->name('certificates.verify');

Route::get('/invite/{code}', [ReferralController::class, 'invite'])->name('invite');
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:5,1')->name('leads.store');
Route::get('/payments/{order:order_number}/callback/{gateway}', [CheckoutController::class, 'callback'])->name('payments.callback');

Route::middleware('auth')->group(function () {
    Route::post('/courses/{course:slug}/checkout', [CheckoutController::class, 'store'])->middleware('throttle:10,1')->name('courses.checkout');
    Route::post('/events/{event:slug}/checkout', [CheckoutController::class, 'storeEvent'])->middleware('throttle:10,1')->name('events.checkout');
    Route::post('/courses/{course:slug}/reviews', [ReviewController::class, 'storeCourse'])->middleware('throttle:5,1')->name('courses.reviews.store');
    Route::post('/products/{product:slug}/reviews', [ReviewController::class, 'storeProduct'])->middleware('throttle:5,1')->name('products.reviews.store');
    Route::post('/blog/{post:slug}/comments', [CommentController::class, 'store'])->middleware('throttle:8,1')->name('blog.comments.store');
    Route::post('/wishlist', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::get('/dashboard/wishlist', [WishlistController::class, 'index'])->name('dashboard.wishlist');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/notes', [LearningSupportController::class, 'storeNote'])->name('learning.notes.store');
    Route::delete('/dashboard/courses/{course:slug}/lessons/{lesson}/notes', [LearningSupportController::class, 'destroyNote'])->name('learning.notes.destroy');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/bookmark', [LearningSupportController::class, 'toggleBookmark'])->name('learning.bookmark.toggle');
    Route::get('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');
    Route::get('/products/{product}/preview', ProductPreviewController::class)->name('products.preview');
    Route::get('/products/{product}/download', ProductDownloadController::class)->name('products.download');
    Route::get('/dashboard/courses/{course:slug}/learn/{lesson?}', [CoursePlayerController::class, 'show'])->name('learning.player');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/progress', [CoursePlayerController::class, 'progress'])->name('learning.progress');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/quiz/start', [QuizController::class, 'start'])->name('learning.quiz.start');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/quiz/attempts/{attempt}', [QuizController::class, 'submit'])->name('learning.quiz.submit');
    Route::post('/dashboard/courses/{course:slug}/lessons/{lesson}/assignment/submit', [AssignmentController::class, 'submit'])->name('learning.assignment.submit');
    Route::get('/dashboard/assignments/submissions/{submission}/attachment', \App\Http\Controllers\AssignmentDownloadController::class)->name('learning.assignment.download');
    Route::post('/notifications/subscriptions', [NotificationSubscriptionController::class, 'store'])->name('notifications.subscriptions.store');
    Route::delete('/notifications/subscriptions', [NotificationSubscriptionController::class, 'destroy'])->name('notifications.subscriptions.destroy');
    Route::post('/checkout/{order:order_number}/pay', [CheckoutController::class, 'pay'])->middleware('throttle:10,1')->name('checkout.pay');
    Route::post('/checkout/{order:order_number}/coupon', [CheckoutController::class, 'applyCoupon'])->middleware('throttle:10,1')->name('checkout.coupon.apply');
    Route::delete('/checkout/{order:order_number}/coupon', [CheckoutController::class, 'removeCoupon'])->name('checkout.coupon.remove');
    Route::get('/checkout/{order:order_number}', [CheckoutController::class, 'show'])->name('checkout.show');
    Route::get('/dashboard/orders/{order:order_number}/invoice', InvoiceController::class)->name('dashboard.orders.invoice');
    Route::patch('/marketing/consent', [MarketingConsentController::class, 'update'])->name('marketing.consent.update');

    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/certificates', [CertificateController::class, 'index'])->name('dashboard.certificates');
    // Printable certificate — the owner or certificate managers (see controller).
    Route::get('/certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');
    // Real PDF download — same access rule as the printable page.
    Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download'])->name('certificates.download');
    Route::get('/dashboard/onboarding', [OnboardingController::class, 'show'])->name('dashboard.onboarding');
    Route::post('/dashboard/onboarding', [OnboardingController::class, 'store'])->name('dashboard.onboarding.store');
    Route::get('/dashboard/courses', [UserDashboardController::class, 'courses'])->name('dashboard.courses');
    Route::get('/dashboard/assignments', [UserDashboardController::class, 'assignments'])->name('dashboard.assignments');
    Route::get('/dashboard/goals', [UserDashboardController::class, 'goals'])->name('dashboard.goals');
    Route::get('/dashboard/sessions', [UserDashboardController::class, 'sessions'])->name('dashboard.sessions');
    Route::post('/dashboard/sessions/{session}/cancel', [CoachingBookingController::class, 'cancel'])->name('dashboard.sessions.cancel');
    Route::post('/coaching/book', [CoachingBookingController::class, 'store'])->name('coaching.book');
    Route::get('/dashboard/orders', [UserDashboardController::class, 'orders'])->name('dashboard.orders');
    Route::get('/dashboard/library', [UserDashboardController::class, 'library'])->name('dashboard.library');
    Route::get('/dashboard/support', [SupportTicketController::class, 'index'])->name('dashboard.support.index');
    Route::post('/dashboard/support', [SupportTicketController::class, 'store'])->name('dashboard.support.store');
    Route::get('/dashboard/support/{ticket}', [SupportTicketController::class, 'show'])->name('dashboard.support.show');
    Route::post('/dashboard/support/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('dashboard.support.reply');
    Route::get('/dashboard/referrals', [ReferralController::class, 'index'])->name('dashboard.referrals.index');
    Route::get('/referrals/lookup', [ReferralController::class, 'lookup'])->name('referrals.lookup');
    Route::get('/dashboard/notifications', [NotificationCenterController::class, 'index'])->name('dashboard.notifications.index');
    Route::post('/dashboard/notifications/read-all', [NotificationCenterController::class, 'markAllRead'])->name('dashboard.notifications.read-all');
    Route::post('/dashboard/notifications/{notification}/read', [NotificationCenterController::class, 'markRead'])->name('dashboard.notifications.read');

    Route::middleware('role:instructor')->prefix('panel/instructor')->name('panel.instructor.')->group(function () {
        Route::get('/', [InstructorDashboardController::class, 'index'])->name('dashboard');
        Route::post('/submissions/{submission}/grade', [InstructorDashboardController::class, 'grade'])->name('submissions.grade');
    });

    Route::middleware('role:coach')->prefix('panel/coach')->name('panel.coach.')->group(function () {
        Route::get('/', [CoachDashboardController::class, 'index'])->name('dashboard');
        Route::patch('/sessions/{session}', [CoachDashboardController::class, 'updateSession'])->name('sessions.update');
        Route::post('/goals', [CoachDashboardController::class, 'storeGoal'])->name('goals.store');
        Route::patch('/goals/{goal}', [CoachDashboardController::class, 'updateGoal'])->name('goals.update');
        Route::post('/tasks', [CoachDashboardController::class, 'storeTask'])->name('tasks.store');
        Route::post('/availability', [CoachDashboardController::class, 'storeAvailability'])->name('availability.store');
        Route::delete('/availability/{slot}', [CoachDashboardController::class, 'destroyAvailability'])->name('availability.destroy');
    });

    Route::middleware('role:parent')->prefix('panel/parent')->name('panel.parent.')->group(function () {
        Route::get('/', [ParentDashboardController::class, 'index'])->name('dashboard');
        Route::post('/children', [ParentDashboardController::class, 'linkChild'])->name('children.link');
        Route::post('/children/{student}/select', [ParentDashboardController::class, 'selectChild'])->name('children.select');
        Route::get('/children/{student}', [ParentDashboardController::class, 'show'])->name('children.show');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthenticatedSessionController::class, 'adminCreate'])->name('admin.login');
    Route::post('/admin/login', [AuthenticatedSessionController::class, 'adminStore'])->name('admin.login.store');
    Route::post('/admin/login/verify', [AuthenticatedSessionController::class, 'adminVerify'])->name('admin.login.verify.store');
});

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'role:super-admin|admin|editor|instructor|coach', 'admin.audit'])
    ->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');

        Route::middleware('permission:view reports|manage all')->group(function () {
            Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
            Route::get('/reports', [ReportExportController::class, 'index'])->name('reports.index');
            Route::get('/reports/print', [ReportExportController::class, 'print'])->name('reports.print');
            Route::get('/reports/orders.csv', [ReportExportController::class, 'orders'])->name('reports.orders.export');
            Route::get('/reports/payments.csv', [ReportExportController::class, 'payments'])->name('reports.payments.export');
            Route::get('/reports/enrollments.csv', [ReportExportController::class, 'enrollments'])->name('reports.enrollments.export');
            Route::get('/reports/sessions.csv', [ReportExportController::class, 'sessions'])->name('reports.sessions.export');
            Route::get('/reports/users.csv', [ReportExportController::class, 'users'])->name('reports.users.export');
            Route::post('/orders/{order}/refund', [OrderRefundController::class, 'store'])
                ->middleware('permission:update orders|manage all')
                ->name('orders.refund');
        });

        Route::middleware('permission:view media|manage all')->prefix('media')->name('media.')->group(function () {
            Route::get('/', [MediaLibraryController::class, 'index'])->name('index');
            Route::post('/', [MediaLibraryController::class, 'store'])->middleware('permission:create media|manage all')->name('store');
            Route::post('/{media}/replace', [MediaLibraryController::class, 'replace'])->middleware('permission:update media|manage all')->name('replace');
            Route::delete('/{media}', [MediaLibraryController::class, 'destroy'])->middleware('permission:delete media|update media|manage all')->name('destroy');
        });

        Route::middleware('permission:view roles|view permissions|manage all')->group(function () {
            Route::get('/access', [RolePermissionController::class, 'index'])->name('access.index');
            Route::put('/access/roles/{role}', [RolePermissionController::class, 'update'])
                ->middleware('permission:update roles|manage all')
                ->name('access.roles.update');
            Route::patch('/access/roles/{role}/users', [RolePermissionController::class, 'assignUser'])
                ->middleware('permission:update roles|manage all')
                ->name('access.roles.users.assign');
        });

        Route::middleware('permission:view surveys|manage all')->prefix('surveys')->name('surveys.')->group(function () {
            Route::get('/', [AdminSurveyController::class, 'index'])->name('index');
            Route::get('/create', [AdminSurveyController::class, 'create'])->middleware('permission:create surveys|manage all')->name('create');
            Route::post('/', [AdminSurveyController::class, 'store'])->middleware('permission:create surveys|manage all')->name('store');
            Route::get('/{survey}/responses.csv', [AdminSurveyController::class, 'export'])->middleware('permission:view surveys|manage all')->name('responses.export');
            Route::get('/{survey}/responses', [AdminSurveyController::class, 'responses'])->middleware('permission:view surveys|manage all')->name('responses');
            Route::get('/{survey}/edit', [AdminSurveyController::class, 'edit'])->middleware('permission:update surveys|manage all')->name('edit');
            Route::put('/{survey}', [AdminSurveyController::class, 'update'])->middleware('permission:update surveys|manage all')->name('update');
            Route::delete('/{survey}', [AdminSurveyController::class, 'destroy'])->middleware('permission:delete surveys|manage all')->name('destroy');
            Route::post('/{survey}/publish-eitaa', [AdminSurveyController::class, 'publishToEitaa'])->middleware('permission:view surveys|manage all')->name('publish-eitaa');
            Route::post('/{survey}/send-eitaa-summary', [AdminSurveyController::class, 'sendSummaryToEitaa'])->middleware('permission:view surveys|manage all')->name('send-eitaa-summary');
        });

        // پرسلاین — فرم‌های لیدگیر آماده بر پایه قالب‌ها (تبلیغات، کانال ایتا، لید گرم)
        Route::middleware('permission:view surveys|manage all')->prefix('persline')->name('persline.')->group(function () {
            Route::get('/', [PerslineController::class, 'index'])->name('index');
            Route::get('/create', [PerslineController::class, 'create'])->middleware('permission:create surveys|manage all')->name('create');
            Route::post('/', [PerslineController::class, 'store'])->middleware('permission:create surveys|manage all')->name('store');
            Route::get('/{survey}/responses.csv', [PerslineController::class, 'export'])->middleware('permission:view surveys|manage all')->name('responses.export');
            Route::get('/{survey}/responses', [PerslineController::class, 'responses'])->middleware('permission:view surveys|manage all')->name('responses');
            Route::get('/{survey}/edit', [PerslineController::class, 'edit'])->middleware('permission:update surveys|manage all')->name('edit');
            Route::put('/{survey}', [PerslineController::class, 'update'])->middleware('permission:update surveys|manage all')->name('update');
            Route::delete('/{survey}', [PerslineController::class, 'destroy'])->middleware('permission:delete surveys|manage all')->name('destroy');
            Route::post('/{survey}/publish-eitaa', [PerslineController::class, 'publishToEitaa'])->middleware('permission:view surveys|manage all')->name('publish-eitaa');
            Route::post('/{survey}/send-eitaa-summary', [PerslineController::class, 'sendSummaryToEitaa'])->middleware('permission:view surveys|manage all')->name('send-eitaa-summary');
        });

        // ── Eitaa Bot Automation Module ─────────────────────────────────────────
        Route::middleware('permission:view eitaa|manage all')->prefix('eitaa')->name('eitaa.')->group(function (): void {
            Route::get('/', [EitaaBotController::class, 'dashboard'])->name('dashboard');
            Route::get('/bots', [EitaaBotController::class, 'bots'])->name('bots');
            Route::post('/bots', [EitaaBotController::class, 'storeBot'])->middleware('permission:create eitaa|manage all')->name('bots.store');
            Route::put('/bots/{bot}', [EitaaBotController::class, 'updateBot'])->middleware('permission:update eitaa|manage all')->name('bots.update');
            Route::post('/bots/{bot}/connect', [EitaaBotController::class, 'connectBot'])->middleware('permission:update eitaa|manage all')->name('bots.connect');
            Route::post('/bots/{bot}/test', [EitaaBotController::class, 'testBot'])->middleware('permission:update eitaa|manage all')->name('bots.test');
            Route::delete('/bots/{bot}', [EitaaBotController::class, 'destroyBot'])->middleware('permission:delete eitaa|manage all')->name('bots.destroy');

            Route::get('/targets', [EitaaBotController::class, 'targets'])->name('targets');
            Route::post('/targets', [EitaaBotController::class, 'storeTarget'])->middleware('permission:create eitaa|manage all')->name('targets.store');
            Route::post('/targets/import', [EitaaBotController::class, 'importTargets'])->middleware('permission:create eitaa|manage all')->name('targets.import');
            Route::post('/targets/manual-send', [EitaaBotController::class, 'manualSend'])->middleware('permission:create eitaa|manage all')->name('targets.manual-send');
            Route::post('/targets/{target}/verify', [EitaaBotController::class, 'verifyTarget'])->middleware('permission:update eitaa|manage all')->name('targets.verify');
            Route::put('/targets/{target}', [EitaaBotController::class, 'updateTarget'])->middleware('permission:update eitaa|manage all')->name('targets.update');
            Route::delete('/targets/{target}', [EitaaBotController::class, 'destroyTarget'])->middleware('permission:delete eitaa|manage all')->name('targets.destroy');

            Route::get('/campaigns', [EitaaBotController::class, 'campaigns'])->name('campaigns');
            Route::post('/campaigns', [EitaaBotController::class, 'storeCampaign'])->middleware('permission:create eitaa|manage all')->name('campaigns.store');
            Route::get('/campaigns/{campaign}', [EitaaBotController::class, 'showCampaign'])->name('campaigns.show');
            Route::put('/campaigns/{campaign}', [EitaaBotController::class, 'updateCampaign'])->middleware('permission:update eitaa|manage all')->name('campaigns.update');
            Route::post('/campaigns/{campaign}/launch', [EitaaBotController::class, 'launchCampaign'])->middleware('permission:update eitaa|manage all')->name('campaigns.launch');
            Route::post('/campaigns/{campaign}/pause', [EitaaBotController::class, 'pauseCampaign'])->middleware('permission:update eitaa|manage all')->name('campaigns.pause');
            Route::post('/campaigns/{campaign}/resume', [EitaaBotController::class, 'resumeCampaign'])->middleware('permission:update eitaa|manage all')->name('campaigns.resume');
            Route::post('/campaigns/{campaign}/cancel', [EitaaBotController::class, 'cancelCampaign'])->middleware('permission:update eitaa|manage all')->name('campaigns.cancel');

            Route::get('/send', [EitaaBotController::class, 'send'])->name('send');
            Route::post('/send', [EitaaBotController::class, 'sendNow'])->middleware('permission:create eitaa|manage all')->name('send.now');

            Route::get('/templates', [EitaaBotController::class, 'templates'])->name('templates');
            Route::post('/templates', [EitaaBotController::class, 'storeTemplate'])->middleware('permission:create eitaa|manage all')->name('templates.store');
            Route::put('/templates/{template}', [EitaaBotController::class, 'updateTemplate'])->middleware('permission:update eitaa|manage all')->name('templates.update');
            Route::delete('/templates/{template}', [EitaaBotController::class, 'destroyTemplate'])->middleware('permission:delete eitaa|manage all')->name('templates.destroy');

            Route::get('/keywords', [EitaaBotController::class, 'keywords'])->name('keywords');
            Route::post('/keywords', [EitaaBotController::class, 'storeKeyword'])->middleware('permission:create eitaa|manage all')->name('keywords.store');
            Route::put('/keywords/{keyword}', [EitaaBotController::class, 'updateKeyword'])->middleware('permission:update eitaa|manage all')->name('keywords.update');
            Route::delete('/keywords/{keyword}', [EitaaBotController::class, 'destroyKeyword'])->middleware('permission:delete eitaa|manage all')->name('keywords.destroy');

            Route::get('/conversations', [EitaaBotController::class, 'conversations'])->name('conversations');
            Route::get('/reports', [EitaaBotController::class, 'reports'])->name('reports');
            Route::get('/logs', [EitaaBotController::class, 'logs'])->name('logs');
            Route::get('/notifications', [EitaaBotController::class, 'notifications'])->name('notifications');
            Route::post('/notifications/read-all', [EitaaBotController::class, 'markNotificationsRead'])->middleware('permission:update eitaa|manage all')->name('notifications.read_all');
            Route::get('/settings', [EitaaBotController::class, 'settings'])->name('settings');
            Route::put('/settings', [EitaaBotController::class, 'updateSettings'])->middleware('permission:update eitaa|manage all')->name('settings.update');
            Route::get('/ai', [EitaaBotController::class, 'ai'])->name('ai');
            Route::put('/ai', [EitaaBotController::class, 'updateAi'])->middleware('permission:update eitaa|manage all')->name('ai.update');
            Route::post('/ai/draft', [EitaaBotController::class, 'aiDraft'])->middleware('permission:create eitaa|manage all')->name('ai.draft');
        });

        Route::middleware('permission:view instagram|manage all')->prefix('instagram')->name('instagram.')->group(function () {
            Route::get('/', [InstagramController::class, 'index'])->name('index');
            Route::get('/automations', [InstagramController::class, 'automations'])->middleware('permission:update instagram|manage all')->name('automations');
            Route::post('/automations', [InstagramController::class, 'storeAutomation'])->middleware('permission:create instagram|manage all')->name('automations.store');
            Route::put('/automations/{automation}', [InstagramController::class, 'updateAutomation'])->middleware('permission:update instagram|manage all')->name('automations.update');
            Route::post('/automations/{automation}/toggle', [InstagramController::class, 'toggleAutomation'])->middleware('permission:update instagram|manage all')->name('automations.toggle');
            Route::delete('/automations/{automation}', [InstagramController::class, 'destroyAutomation'])->middleware('permission:delete instagram|manage all')->name('automations.destroy');
            Route::get('/templates', [InstagramController::class, 'templates'])->middleware('permission:view instagram|manage all')->name('templates');
            Route::post('/templates', [InstagramController::class, 'storeTemplate'])->middleware('permission:create instagram|manage all')->name('templates.store');
            Route::put('/templates/{template}', [InstagramController::class, 'updateTemplate'])->middleware('permission:update instagram|manage all')->name('templates.update');
            Route::delete('/templates/{template}', [InstagramController::class, 'destroyTemplate'])->middleware('permission:delete instagram|manage all')->name('templates.destroy');
            Route::get('/media', [InstagramController::class, 'media'])->middleware('permission:view instagram|manage all')->name('media');
            Route::post('/media/publish', [InstagramController::class, 'publishMedia'])->middleware('permission:create instagram|manage all')->name('media.publish');
            Route::post('/media/{media}/retry', [InstagramController::class, 'retryMedia'])->middleware('permission:update instagram|manage all')->name('media.retry');
            Route::delete('/media/{media}', [InstagramController::class, 'destroyMedia'])->middleware('permission:delete instagram|manage all')->name('media.destroy');
            Route::get('/webhooks', [InstagramController::class, 'webhooks'])->middleware('permission:view instagram|manage all')->name('webhooks');
            Route::get('/analytics', [InstagramController::class, 'analytics'])->middleware('permission:view instagram|manage all')->name('analytics');
            Route::get('/{conversation}', [InstagramController::class, 'show'])->name('show');
            Route::post('/{conversation}/reply', [InstagramController::class, 'reply'])->middleware('permission:reply instagram|manage all')->name('reply');
            Route::post('/{conversation}/status', [InstagramController::class, 'updateStatus'])->middleware('permission:update instagram|manage all')->name('status');
            Route::post('/{conversation}/assign', [InstagramController::class, 'assign'])->middleware('permission:update instagram|manage all')->name('assign');
            Route::post('/messages/{message}/moderate', [InstagramController::class, 'moderateComment'])->middleware('permission:update instagram|manage all')->name('messages.moderate');
        });

        Route::middleware('permission:view marketing|manage all')->prefix('marketing')->name('marketing.')->group(function () {
            Route::get('/', [MarketingController::class, 'index'])->name('index');
            Route::get('/create', [MarketingController::class, 'create'])->middleware('permission:create marketing|manage all')->name('create');
            Route::post('/', [MarketingController::class, 'store'])->middleware('permission:create marketing|manage all')->name('store');
            Route::get('/{campaign}/edit', [MarketingController::class, 'edit'])->middleware('permission:update marketing|manage all')->name('edit');
            Route::put('/{campaign}', [MarketingController::class, 'update'])->middleware('permission:update marketing|manage all')->name('update');
            Route::delete('/{campaign}', [MarketingController::class, 'destroy'])->middleware('permission:delete marketing|manage all')->name('destroy');
            Route::post('/{campaign}/toggle', [MarketingController::class, 'toggle'])->middleware('permission:update marketing|manage all')->name('toggle');
            Route::post('/{campaign}/run', [MarketingController::class, 'run'])->middleware('permission:run marketing|manage all')->name('run');
            Route::post('/{campaign}/import', [MarketingRecipientImportController::class, 'store'])->middleware('permission:update marketing|manage all')->name('import');
            Route::get('/bulk-sms', [BulkSmsController::class, 'index'])->middleware('permission:create marketing|manage all')->name('bulk-sms');
            Route::get('/bulk-sms/reports', [BulkSmsReportController::class, 'index'])->middleware('permission:view marketing|manage all')->name('bulk-sms.reports');
            Route::post('/bulk-sms/preview', [BulkSmsController::class, 'preview'])->middleware('permission:create marketing|manage all')->name('bulk-sms.preview');
            Route::post('/bulk-sms', [BulkSmsController::class, 'send'])->middleware('permission:create marketing|manage all')->name('bulk-sms.send');
        });

        Route::middleware('permission:view pages|manage all')->prefix('site-pages')->name('site-pages.')->group(function () {
            Route::get('/', [PageStudioController::class, 'index'])->name('index');
            Route::get('/{page}/edit', [PageStudioController::class, 'edit'])->name('edit');
            Route::put('/{page}', [PageStudioController::class, 'update'])->middleware('permission:update pages|manage all')->name('update');
        });

        Route::prefix('content')->name('content.')->group(function () {
            Route::get('/{resource}', [ContentController::class, 'index'])->name('index');
            Route::get('/{resource}/create', [ContentController::class, 'create'])->name('create');
            Route::post('/{resource}', [ContentController::class, 'store'])->name('store');
            Route::get('/{resource}/{id}/edit', [ContentController::class, 'edit'])->name('edit');
            Route::put('/{resource}/{id}', [ContentController::class, 'update'])->name('update');
            Route::delete('/{resource}/{id}', [ContentController::class, 'destroy'])->name('destroy');
        });

        // تیکت‌های پشتیبانی — گفتگو و پاسخ‌دهی ادمین
        Route::prefix('content/tickets')->name('content.tickets.')->group(function () {
            Route::get('/{ticket}', [AdminTicketController::class, 'show'])->name('show');
            Route::post('/{ticket}/reply', [AdminTicketController::class, 'reply'])->name('reply');
        });

        Route::middleware('permission:view leads|manage all')->group(function () {
            Route::get('/crm', CrmDashboardController::class)->name('crm.dashboard');
            Route::get('/leads', [AdminLeadsController::class, 'index'])->name('leads.index');
        });

        Route::middleware('permission:view users|manage all')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
            Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
        });

        Route::middleware('permission:update users|manage all')->group(function () {
            Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::patch('/users/{user}/toggle-active', [AdminUserController::class, 'toggleActive'])->name('users.toggle-active');
            Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole'])->name('users.update-role');
        });

        Route::middleware('permission:view settings|manage all')->group(function () {
            Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
            Route::get('/settings/sms', [SettingsController::class, 'sms'])->name('settings.sms');
            Route::get('/settings/payments', [SettingsController::class, 'payments'])->name('settings.payments');
            Route::get('/settings/automations', [SettingsController::class, 'automations'])->name('settings.automations');
            Route::get('/settings/chat', [SettingsController::class, 'chat'])->name('settings.chat');
            Route::get('/settings/instagram', [SettingsController::class, 'instagram'])->name('settings.instagram');
            Route::get('/settings/instagram/status', [SettingsController::class, 'instagramStatus'])->name('settings.instagram.status');
            Route::post('/settings/instagram/test', [SettingsController::class, 'instagramTest'])->name('settings.instagram.test');
            Route::post('/settings/instagram/refresh', [SettingsController::class, 'instagramRefresh'])->name('settings.instagram.refresh');
            Route::get('/settings/instagram/connect', [SettingsController::class, 'instagramConnect'])->name('settings.instagram.connect');
            Route::get('/settings/instagram/callback', [SettingsController::class, 'instagramCallback'])->name('settings.instagram.callback');
            Route::post('/settings/instagram/disconnect', [SettingsController::class, 'instagramDisconnect'])->name('settings.instagram.disconnect');
            Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');
            Route::post('/settings/logo', [SettingsController::class, 'updateLogo'])->name('settings.logo.update');
            Route::post('/settings/app-logo', [SettingsController::class, 'updateAppLogo'])->name('settings.app-logo.update');
            Route::post('/settings/hero-image', [SettingsController::class, 'updateHeroImage'])->name('settings.hero-image.update');
            Route::post('/settings/hero-background', [SettingsController::class, 'updateHeroBackground'])->name('settings.hero-background.update');
            Route::post('/settings/sms/test', [SettingsController::class, 'testSms'])->name('settings.sms.test');
            Route::post('/settings/sms/connection', [SettingsController::class, 'testSmsConnection'])->name('settings.sms.connection');
            Route::get('/settings/sms/status', [SettingsController::class, 'smsConnectionStatus'])->name('settings.sms.status');
            Route::get('/settings/payment/status', [SettingsController::class, 'paymentConnectionStatus'])->name('settings.payment.status');
            Route::post('/settings/payment/test', [SettingsController::class, 'testPayment'])->name('settings.payment.test');
            Route::post('/settings/winback/run', [SettingsController::class, 'runWinback'])->name('settings.winback.run');
            Route::post('/settings/lead-reminder/run', [SettingsController::class, 'runLeadReminder'])->name('settings.lead-reminder.run');
            Route::post('/settings/eitaa/test', [SettingsController::class, 'testEitaa'])->name('settings.eitaa.test');
            Route::post('/settings/chat/test', [SettingsController::class, 'testChat'])->name('settings.chat.test');
        });

        Route::middleware('permission:view tickets|manage all')->prefix('support-chat')->name('support-chat.')->group(function () {
            Route::get('/', [AdminSupportChatController::class, 'index'])->name('index');
            Route::get('/{conversation}/messages', [AdminSupportChatController::class, 'messages'])->name('messages');
            Route::post('/{conversation}/reply', [AdminSupportChatController::class, 'reply'])->name('reply');
        });

        Route::middleware('permission:view courses|manage all')->group(function () {
            Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
            Route::get('/courses/create', [CourseController::class, 'create'])->name('courses.create');
            Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
            Route::get('/courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
            Route::put('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');
            Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
        });

        // Quizzes reuse the lessons permissions — a quiz is the assessment of a lesson.
        Route::middleware('permission:view lessons|manage all')->prefix('quizzes')->name('quizzes.')->group(function () {
            Route::get('/', [AdminQuizController::class, 'index'])->name('index');
            Route::get('/create', [AdminQuizController::class, 'create'])->middleware('permission:create lessons|manage all')->name('create');
            Route::post('/', [AdminQuizController::class, 'store'])->middleware('permission:create lessons|manage all')->name('store');
            Route::get('/{quiz}/edit', [AdminQuizController::class, 'edit'])->middleware('permission:update lessons|manage all')->name('edit');
            Route::put('/{quiz}', [AdminQuizController::class, 'update'])->middleware('permission:update lessons|manage all')->name('update');
            Route::delete('/{quiz}', [AdminQuizController::class, 'destroy'])->middleware('permission:update lessons|manage all')->name('destroy');
        });

        // Assignments reuse the lessons permissions — an assignment is the
        // practical exercise of a lesson, graded from the admin panel.
        Route::middleware('permission:view lessons|manage all')->prefix('assignments')->name('assignments.')->group(function () {
            Route::get('/', [AdminAssignmentController::class, 'index'])->name('index');
            Route::get('/create', [AdminAssignmentController::class, 'create'])->middleware('permission:create lessons|manage all')->name('create');
            Route::post('/', [AdminAssignmentController::class, 'store'])->middleware('permission:create lessons|manage all')->name('store');
            Route::get('/{assignment}/edit', [AdminAssignmentController::class, 'edit'])->middleware('permission:update lessons|manage all')->name('edit');
            Route::put('/{assignment}', [AdminAssignmentController::class, 'update'])->middleware('permission:update lessons|manage all')->name('update');
            Route::delete('/{assignment}', [AdminAssignmentController::class, 'destroy'])->middleware('permission:update lessons|manage all')->name('destroy');
            Route::get('/{assignment}/submissions', [AdminAssignmentController::class, 'submissions'])->middleware('permission:update lessons|manage all')->name('submissions');
            Route::post('/{assignment}/submissions/{submission}/grade', [AdminAssignmentController::class, 'grade'])->middleware('permission:update lessons|manage all')->name('grade');
        });

        Route::middleware('permission:view certificates|manage all')->group(function () {
            Route::get('/certificates', [AdminCertificateController::class, 'index'])->name('certificates.index');
        });
    });

require __DIR__.'/auth.php';
