<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Service;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_admin_can_upload_a_course_thumbnail(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->post('/admin/courses', [
                'title' => 'دوره مسیر آینده',
                'slug' => 'future-path-course',
                'description' => 'توضیحات دوره',
                'level' => 'beginner',
                'price' => 250000,
                'duration_minutes' => 120,
                'thumbnail_file' => UploadedFile::fake()->create('course.jpg', 100, 'image/jpeg'),
                'certificate_enabled' => true,
                'is_published' => false,
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/courses');

        $course = Course::where('slug', 'future-path-course')->firstOrFail();
        $this->assertStringStartsWith('/images/courses/course-'.$course->id.'-thumbnail.', $course->thumbnail);
        $this->assertFileExists(public_path(ltrim($course->thumbnail, '/')));

        @unlink(public_path(ltrim($course->thumbnail, '/')));
    }

    public function test_editor_can_upload_article_thumbnail_and_body_image(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)
            ->post('/admin/content/blog', [
                'title' => 'مقاله تصویری',
                'slug' => 'image-article',
                'excerpt' => 'خلاصه مقاله تصویری',
                'body' => "مقدمه مقاله\n\nادامه مقاله",
                'cover_image' => UploadedFile::fake()->create('thumbnail.jpg', 100, 'image/jpeg'),
                'article_image' => UploadedFile::fake()->create('article.png', 100, 'image/png'),
                'status' => 'draft',
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/blog');

        $post = BlogPost::where('slug', 'image-article')->firstOrFail();
        $this->assertStringStartsWith('/images/blog-'.$post->id.'-cover_image.', $post->cover_image);
        $this->assertStringStartsWith('/images/blog-'.$post->id.'-article_image.', $post->article_image);
        $this->assertFileExists(public_path(ltrim($post->cover_image, '/')));
        $this->assertFileExists(public_path(ltrim($post->article_image, '/')));

        $coverImage = $post->cover_image;
        $articleImage = $post->article_image;
        $this->actingAs($editor)
            ->put("/admin/content/blog/{$post->id}", [
                'title' => 'مقاله تصویری',
                'slug' => 'image-article',
                'excerpt' => 'خلاصه به‌روزشده',
                'body' => 'متن جدید',
                'status' => 'draft',
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/blog');

        $this->assertSame($coverImage, $post->fresh()->cover_image);
        $this->assertSame($articleImage, $post->fresh()->article_image);

        $this->actingAs($editor)
            ->put("/admin/content/blog/{$post->id}", [
                'title' => 'مقاله تصویری',
                'slug' => 'image-article',
                'excerpt' => 'خلاصه به‌روزشده',
                'body' => 'متن جدیدتر',
                'cover_image' => '',
                'article_image' => '',
                'status' => 'draft',
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/blog');

        $this->assertNull($post->fresh()->cover_image);
        $this->assertNull($post->fresh()->article_image);
        $this->assertFileDoesNotExist(public_path(ltrim($coverImage, '/')));
        $this->assertFileDoesNotExist(public_path(ltrim($articleImage, '/')));
    }

    public function test_admin_can_manage_public_services_from_content_studio(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/content/services')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Content/Index')
                ->where('resource', 'services')
                ->where('canCreate', true)
                ->where('canUpdate', true));

        $this->actingAs($admin)
            ->post('/admin/content/services', [
                'title' => 'مسیر کشف استعداد',
                'slug' => 'talent-path',
                'summary' => 'برای شناخت بهتر توانمندی‌ها',
                'description' => 'توضیحات خدمت',
                'features' => "شناخت استعداد\nگزارش اختصاصی",
                'is_active' => true,
                'is_featured' => true,
            ])
            ->assertRedirect('/admin/content/services');

        $service = Service::where('slug', 'talent-path')->firstOrFail();
        $this->assertSame(['شناخت استعداد', 'گزارش اختصاصی'], $service->features);

        $this->actingAs($admin)
            ->put("/admin/content/services/{$service->id}", [
                'title' => 'مسیر کشف استعداد پیشرفته',
                'slug' => 'talent-path',
                'is_active' => false,
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/services');

        $this->assertSame('مسیر کشف استعداد پیشرفته', $service->fresh()->title);
        $this->assertFalse($service->fresh()->is_active);
    }

    public function test_admin_can_manage_team_members_from_content_studio(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/content/team')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Content/Index')
                ->where('resource', 'team')
                ->where('canCreate', true)
                ->where('canUpdate', true));

        $this->actingAs($admin)
            ->post('/admin/content/team', [
                'name' => 'خانم احمدی',
                'title' => 'کارشناس پشتیبانی آموزشی',
                'bio' => 'همراه خانواده‌ها در مسیر یادگیری.',
                'specialties' => "پشتیبانی دوره\nپیگیری پیشرفت",
                'sort_order' => 3,
                'is_active' => true,
                'is_featured' => true,
            ])
            ->assertRedirect('/admin/content/team');

        $member = TeamMember::where('name', 'خانم احمدی')->firstOrFail();
        $this->assertSame(['پشتیبانی دوره', 'پیگیری پیشرفت'], $member->specialties);
        $this->assertTrue($member->is_active);
        $this->assertTrue($member->is_featured);

        $this->actingAs($admin)
            ->put("/admin/content/team/{$member->id}", [
                'name' => 'خانم احمدی',
                'title' => 'کارشناس ارشد پشتیبانی',
                'bio' => 'به‌روزرسانی شد.',
                'is_active' => false,
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/team');

        $this->assertSame('کارشناس ارشد پشتیبانی', $member->fresh()->title);
        $this->assertFalse($member->fresh()->is_active);

        $this->actingAs($admin)->delete("/admin/content/team/{$member->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('team_members', ['id' => $member->id]);
    }

    public function test_admin_can_filter_team_members_by_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        TeamMember::create(['name' => 'مدرس رفیعی', 'role' => 'instructor', 'is_active' => true]);
        TeamMember::create(['name' => 'کوچ رفیعی', 'role' => 'coach', 'is_active' => true]);
        TeamMember::create(['name' => 'کارشناس پذیرش', 'role' => 'team', 'is_active' => true]);

        $this->actingAs($admin)->get('/admin/content/team?role=coach')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Content/Index')
                ->where('filters.role', 'coach')
                ->where('filterFields.0.name', 'role')
                ->where('items.total', 1)
                ->where('items.data.0.name', 'کوچ رفیعی'));

        $this->actingAs($admin)->get('/admin/content/team?role=instructor')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('items.total', 1)
                ->where('items.data.0.name', 'مدرس رفیعی'));

        // مقدار نامعتبر نادیده گرفته می‌شود و همه رکوردها نمایش داده می‌شوند.
        $this->actingAs($admin)->get('/admin/content/team?role=alien')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.role', '')
                ->where('items.total', 3));
    }

    public function test_admin_can_upload_replace_and_remove_a_team_member_photo(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->post('/admin/content/team', [
                'name' => 'استاد رضایی',
                'title' => 'مدرس مهارت‌های آینده',
                'photo' => UploadedFile::fake()->create('rezaei.jpg', 100, 'image/jpeg'),
                'is_active' => true,
                'is_featured' => true,
            ])
            ->assertRedirect('/admin/content/team');

        $member = TeamMember::where('name', 'استاد رضایی')->firstOrFail();
        $this->assertNotNull($member->photo);
        $this->assertStringStartsWith('/images/team-', $member->photo);
        $this->assertStringEndsWith('.jpg', $member->photo);
        $this->assertFileExists(public_path(ltrim($member->photo, '/')));

        $firstPhoto = $member->photo;
        $this->actingAs($admin)
            ->put("/admin/content/team/{$member->id}", [
                'name' => 'استاد رضایی',
                'title' => 'مدرس مهارت‌های آینده',
                'photo' => UploadedFile::fake()->create('rezaei-new.png', 100, 'image/png'),
                'is_active' => true,
                'is_featured' => true,
            ])
            ->assertRedirect('/admin/content/team');

        $fresh = $member->fresh();
        $this->assertNotSame($firstPhoto, $fresh->photo);
        $this->assertStringEndsWith('.png', $fresh->photo);
        $this->assertFileExists(public_path(ltrim($fresh->photo, '/')));
        $this->assertFileDoesNotExist(public_path(ltrim($firstPhoto, '/')));

        // خالی‌کردن فیلد تصویر یعنی حذف عکس
        $this->actingAs($admin)
            ->put("/admin/content/team/{$member->id}", [
                'name' => 'استاد رضایی',
                'title' => 'مدرس مهارت‌های آینده',
                'photo' => '',
                'is_active' => true,
                'is_featured' => true,
            ])
            ->assertRedirect('/admin/content/team');

        $this->assertNull($member->fresh()->photo);
        $this->assertFileDoesNotExist(public_path(ltrim($fresh->photo, '/')));

        @unlink(public_path('images/team-'.$member->id.'-photo.png'));
        @unlink(public_path('images/team-'.$member->id.'-photo.jpg'));
    }

    public function test_editor_cannot_manage_team_members(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)->get('/admin/content/team')->assertForbidden();
        $this->actingAs($editor)->post('/admin/content/team', ['name' => 'غیرمجاز'])->assertForbidden();
    }

    public function test_editor_can_manage_blog_but_cannot_manage_services(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)->get('/admin/content/blog')->assertOk();
        $this->actingAs($editor)
            ->post('/admin/content/blog', [
                'title' => 'مقاله ویدیویی',
                'slug' => 'video-article',
                'excerpt' => 'خلاصه مقاله',
                'body' => 'متن مقاله',
                'video_url' => 'https://www.aparat.com/v/abc123',
                'status' => 'published',
                'is_featured' => false,
            ])
            ->assertRedirect('/admin/content/blog');

        $this->assertDatabaseHas('blog_posts', [
            'slug' => 'video-article',
            'video_url' => 'https://www.aparat.com/v/abc123',
        ]);

        $this->actingAs($editor)->get('/admin/content/services')->assertForbidden();
        $this->actingAs($editor)->post('/admin/content/services', [
            'title' => 'غیرمجاز',
            'description' => 'نباید ساخته شود',
        ])->assertForbidden();
    }

    public function test_admin_can_update_role_permissions_from_access_center(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/access')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Access/Index')
                ->has('roles')
                ->has('permissionGroups'));

        $this->actingAs($admin)
            ->put('/admin/access/roles/editor', [
                'permissions' => ['view blog', 'create blog', 'update blog', 'view services'],
            ])
            ->assertSessionHas('success');

        $this->assertTrue(
            \Spatie\Permission\Models\Role::findByName('editor')->hasPermissionTo('view services')
        );
    }
}
