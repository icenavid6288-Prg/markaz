<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CoachingGoal;
use App\Models\Submission;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Product;
use App\Models\UserOnboardingProfile;
use App\Services\Recommendations\CatalogRecommendationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function index(Request $request, CatalogRecommendationService $recommendations): Response|\Illuminate\Http\RedirectResponse
    {
        // Parents get their own panel — the student dashboard is for learners.
        if ($request->user()->hasRole('parent') && ! $request->user()->hasRole('student')) {
            return redirect()->route('panel.parent.dashboard');
        }

        return Inertia::render('Dashboard', $this->dashboardData($request, $recommendations));
    }

    public function courses(Request $request, CatalogRecommendationService $recommendations): Response
    {
        $data = $this->dashboardData($request, $recommendations);

        return Inertia::render('Dashboard/Courses', [
            'profile' => $data['profile'],
            'stats' => $data['stats'],
            'courses' => $data['courses'],
            'recommendations' => $data['recommendations'],
        ]);
    }

    public function assignments(Request $request): Response
    {
        $user = $request->user();
        $payload = $this->assignmentPayload($user->id);

        return Inertia::render('Dashboard/Assignments', [
            'profile' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->getRoleNames()->first() ?: 'کاربر',
            ],
            'stats' => $payload['stats'],
            'assignments' => $payload['assignments'],
        ]);
    }

    public function goals(Request $request, CatalogRecommendationService $recommendations): Response
    {
        $data = $this->dashboardData($request, $recommendations);

        return Inertia::render('Dashboard/Goals', [
            'profile' => $data['profile'],
            'goals' => $data['goals'],
        ]);
    }

    public function sessions(Request $request, CatalogRecommendationService $recommendations): Response
    {
        $data = $this->dashboardData($request, $recommendations);

        return Inertia::render('Dashboard/Sessions', [
            'profile' => $data['profile'],
            'sessions' => $data['sessions'],
        ]);
    }

    public function orders(Request $request, CatalogRecommendationService $recommendations): Response
    {
        $data = $this->dashboardData($request, $recommendations);

        return Inertia::render('Dashboard/Orders', [
            'profile' => $data['profile'],
            'orders' => $data['orders'],
        ]);
    }

    public function library(Request $request): Response
    {
        $paidOrders = $request->user()->orders()
            ->where('status', 'paid')
            ->with('items')
            ->latest('paid_at')
            ->latest('id')
            ->get();

        $productIds = $paidOrders->flatMap(fn (Order $order) => $order->items
            ->where('purchasable_type', Product::class)
            ->pluck('purchasable_id'))
            ->unique()
            ->values();

        $downloadableIds = $paidOrders->flatMap(fn (Order $order) => $order->items
            ->where('purchasable_type', Product::class)
            ->filter(fn ($item) => in_array($item->purchase_mode ?? 'download', ['download', null], true))
            ->pluck('purchasable_id'))
            ->unique()
            ->values();

        $products = Product::active()
            ->whereIn('id', $productIds)
            ->with('episodes')
            ->get()
            ->keyBy('id');

        // Iterate from oldest to newest so a repeated purchase keeps the latest date.
        $purchasedAt = $paidOrders->reverse()->values()->flatMap(fn (Order $order) => $order->items
            ->where('purchasable_type', Product::class)
            ->mapWithKeys(fn ($item) => [$item->purchasable_id => $order->paid_at?->toISOString() ?? $order->created_at?->toISOString()]))
            ->all();

        $mapProduct = function (Product $product): array {
            return [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'description' => $product->description,
                'image' => $product->image,
            ];
        };

        return Inertia::render('Dashboard/Library', [
            'podcasts' => $products->where('type', 'podcast')->map(function (Product $product) use ($mapProduct, $purchasedAt): array {
                return [
                    ...$mapProduct($product),
                    'purchased_at' => $purchasedAt[$product->id] ?? null,
                    'episodes' => $product->episodes->map(fn ($episode) => [
                        'id' => $episode->id,
                        'title' => $episode->title,
                        'description' => $episode->description,
                        'audio_url' => $episode->audio_url,
                        'duration_seconds' => $episode->duration_seconds,
                        'is_free' => $episode->is_free,
                    ])->values(),
                ];
            })->values(),
            'downloads' => $products->whereIn('type', ['book', 'digital'])->map(function (Product $product) use ($mapProduct, $purchasedAt, $downloadableIds): array {
                $canDownload = $downloadableIds->contains($product->id) && $product->hasDownloadEdition() && filled($product->file_path);

                return [
                    ...$mapProduct($product),
                    'type' => $product->type,
                    'purchased_at' => $purchasedAt[$product->id] ?? null,
                    'has_preview' => $product->hasPreviewEdition(),
                    'preview_url' => $product->hasPreviewEdition() ? route('products.preview', $product) : null,
                    'has_file' => $canDownload,
                    'download_url' => $canDownload ? route('products.download', $product) : null,
                ];
            })->values(),
        ]);
    }

    private function dashboardData(Request $request, CatalogRecommendationService $recommendations): array
    {
        $user = $request->user();
        $enrollments = Enrollment::query()
            ->with('course')
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->get();
        $courseIds = $enrollments->pluck('course_id');

        $courses = $enrollments->filter(fn ($enrollment) => $enrollment->course)->map(fn ($enrollment) => [
            'id' => $enrollment->course->id,
            'title' => $enrollment->course->title,
            'slug' => $enrollment->course->slug,
            'thumbnail' => $enrollment->course->thumbnail,
            'duration_minutes' => $enrollment->course->duration_minutes,
            'progress_percent' => (int) $enrollment->progress_percent,
            'status' => $enrollment->status,
            'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
        ])->values();

        $sessions = CoachingSession::query()
            ->with('coach')
            ->where('student_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('scheduled_at')
            ->limit(12)
            ->get()
            ->map(fn ($session) => [
                'id' => $session->id,
                'scheduled_at' => $session->scheduled_at?->toISOString(),
                'duration_minutes' => $session->duration_minutes,
                'status' => $session->status,
                'meeting_link' => $session->meeting_link,
                'coach' => $session->coach?->name,
                'can_cancel' => in_array($session->status, ['pending', 'confirmed'], true)
                    && $session->scheduled_at
                    && $session->scheduled_at->isFuture(),
            ])->values();

        $goals = CoachingGoal::query()
            ->withCount(['tasks as total_tasks'])
            ->withCount(['tasks as completed_tasks' => fn ($query) => $query->where('status', 'done')])
            ->where('student_id', $user->id)
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderBy('due_date')
            ->limit(12)
            ->get()
            ->map(fn ($goal) => [
                'id' => $goal->id,
                'title' => $goal->title,
                'description' => $goal->description,
                'status' => $goal->status,
                'due_date' => $goal->due_date?->toISOString(),
                'total_tasks' => (int) $goal->total_tasks,
                'completed_tasks' => (int) $goal->completed_tasks,
            ])->values();

        $certificates = Certificate::query()
            ->with('course:id,title,slug')
            ->where('user_id', $user->id)
            ->latest('issued_at')
            ->get()
            ->map(fn ($certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->format('Y/m/d'),
                'course' => $certificate->course ? ['id' => $certificate->course->id, 'title' => $certificate->course->title] : null,
                'url' => route('certificates.show', $certificate),
                'download_url' => route('certificates.download', $certificate),
            ])->values();

        $assignmentPayload = $this->assignmentPayload($user->id, 8);

        $orders = Order::query()
            ->with('items.purchasable')
            ->where('user_id', $user->id)
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'total' => $order->total,
                'created_at' => $order->created_at?->toISOString(),
                'items_count' => $order->items->count(),
                'first_item' => $order->items->first()?->title,
                'downloads' => $order->status === 'paid'
                    ? $order->items->filter(fn ($item) => $item->purchasable instanceof Product && in_array($item->purchasable->type, ['digital', 'book'], true) && in_array($item->purchase_mode ?? 'download', ['download'], true) && filled($item->purchasable->file_path))->map(fn ($item) => [
                        'title' => $item->title,
                        'url' => route('products.download', $item->purchasable),
                    ])->values()
                    : collect(),
            ])->values();

        $recommendedCourses = $recommendations->coursesFor($user, $courseIds);
        $recommendationPayload = $recommendedCourses->map(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'level' => $course->level,
                'price' => $course->price,
                'discount_price' => $course->discount_price,
                'duration_minutes' => $course->duration_minutes,
                'students_count' => $course->students_count,
                'rating_avg' => $course->rating_avg,
                'instructor' => $course->instructor ? ['user' => ['name' => $course->instructor->user?->name]] : null,
            ])->values();

        return [
            'onboarding_incomplete' => ! UserOnboardingProfile::query()->where('user_id', $user->id)->whereNotNull('completed_at')->exists(),
            'profile' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->getRoleNames()->first() ?: 'کاربر',
            ],
            'stats' => [
                'courses_count' => $courses->count(),
                'average_progress' => $courses->isNotEmpty() ? (int) round($courses->avg('progress_percent')) : 0,
                'active_goals' => $goals->whereIn('status', ['pending', 'in_progress'])->count(),
                'upcoming_sessions' => $sessions->count(),
            ],
            'courses' => $courses,
            'sessions' => $sessions,
            'goals' => $goals,
            'certificates' => $certificates,
            'assignments' => $assignmentPayload['assignments'],
            'assignment_stats' => $assignmentPayload['stats'],
            'orders' => $orders,
            'recommendations' => $recommendationPayload,
        ];
    }

    /**
     * The student's submissions across all courses — used by the dashboard
     * overview (recent list) and the dedicated assignments page (full list).
     *
     * @return array{assignments: \Illuminate\Support\Collection<int, array<string, mixed>>, stats: array<string, int>}
     */
    private function assignmentPayload(int $userId, ?int $limit = null): array
    {
        $query = Submission::query()
            ->with(['assignment.course:id,title,slug', 'assignment.lesson:id,title,module_id'])
            ->where('user_id', $userId)
            ->latest('submitted_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        $submissions = $query->get();
        $pending = (int) $submissions->where('status', 'submitted')->count();
        $graded = $submissions->where('status', 'graded');
        $averageScore = $graded->isNotEmpty() ? (int) round($graded->avg('score')) : 0;

        return [
            'assignments' => $submissions->map(fn (Submission $submission) => [
                'id' => $submission->id,
                'title' => $submission->assignment?->title ?? 'تکلیف',
                'course' => $submission->assignment?->course?->title ?? '—',
                'lesson_id' => $submission->assignment?->lesson_id,
                'course_slug' => $submission->assignment?->course?->slug,
                'status' => $submission->status,
                'score' => $submission->score,
                'max_score' => (int) ($submission->assignment?->max_score ?? 100),
                'feedback' => $submission->feedback,
                'submitted_at' => $submission->submitted_at?->toISOString(),
                'url' => $submission->assignment?->course
                    ? route('learning.player', ['course' => $submission->assignment->course->slug, 'lesson' => $submission->assignment->lesson_id])
                    : null,
            ])->values(),
            'stats' => [
                'pending' => $pending,
                'graded' => $graded->count(),
                'average_score' => $averageScore,
            ],
        ];
    }
}
