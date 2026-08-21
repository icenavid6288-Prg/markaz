<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\Instructor;
use App\Models\ParentProfile;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $seedPassword = env('SEED_ADMIN_PASSWORD');
        if (app()->environment('production') && blank($seedPassword)) {
            throw new \RuntimeException('SEED_ADMIN_PASSWORD must be set before seeding production accounts.');
        }
        $seedPassword ??= 'password';

        $admin = User::updateOrCreate(
            ['email' => 'admin@saradar.ir'],
            [
                'name' => 'مدیر سیستم',
                'phone' => '09330961312',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $admin->syncRoles(['super-admin']);

        $drBeidi = User::updateOrCreate(
            ['email' => 'dr.beidi@saradar.ir'],
            [
                'name' => 'دکتر بیدی',
                'phone' => '09150000001',
                'bio' => 'بنیان‌گذار مرکز رشد و کارآفرینی دکتر بیدی؛ طراح مسیر رشد نوجوانان و مدرس مهارت‌های آینده.',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $drBeidi->syncRoles(['admin']);
        Instructor::updateOrCreate(['user_id' => $drBeidi->id], [
            'specialty' => 'طراحی مسیر رشد، کارآفرینی، مهارت‌های آینده',
            'bio' => $drBeidi->bio,
            'experience_years' => 15,
            'is_featured' => true,
        ]);
        Coach::updateOrCreate(['user_id' => $drBeidi->id], [
            'specialty' => 'کوچینگ رشد نوجوان و والدین',
            'bio' => $drBeidi->bio,
            'experience_years' => 15,
            'hourly_rate' => 1500000,
            'rating' => 5.0,
            'is_featured' => true,
            'is_available' => true,
        ]);

        $instructor = User::updateOrCreate(
            ['email' => 'instructor@saradar.ir'],
            [
                'name' => 'مدرس نمونه',
                'phone' => '09120000002',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $instructor->syncRoles(['instructor']);
        Instructor::updateOrCreate(['user_id' => $instructor->id], [
            'specialty' => 'مهارت‌های ارتباطی و تفکر نقادانه',
            'experience_years' => 8,
            'is_featured' => true,
        ]);

        $coach = User::updateOrCreate(
            ['email' => 'coach@saradar.ir'],
            [
                'name' => 'کوچ نمونه',
                'phone' => '09120000003',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $coach->syncRoles(['coach']);
        Coach::updateOrCreate(['user_id' => $coach->id], [
            'specialty' => 'کوچینگ تحصیلی و رشد فردی',
            'experience_years' => 6,
            'hourly_rate' => 900000,
            'rating' => 4.8,
            'is_featured' => true,
            'is_available' => true,
        ]);

        $student = User::updateOrCreate(
            ['email' => 'student@saradar.ir'],
            [
                'name' => 'دانش‌آموز نمونه',
                'phone' => '09120000004',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $student->syncRoles(['student']);
        Student::updateOrCreate(['user_id' => $student->id], [
            'grade' => 'پایه نهم',
            'school' => 'دبیرستان نمونه',
            'talents' => ['خلاقیت', 'برنامه‌نویسی'],
            'interests' => ['کشف استعداد', 'مهارت‌های آینده'],
        ]);

        $parent = User::updateOrCreate(
            ['email' => 'parent@saradar.ir'],
            [
                'name' => 'والد نمونه',
                'phone' => '09120000005',
                'password' => $seedPassword,
                'is_active' => true,
            ]
        );
        $parent->syncRoles(['parent']);
        ParentProfile::updateOrCreate(['user_id' => $parent->id], ['relation' => 'پدر']);
        Student::where('user_id', $student->id)->update(['parent_id' => $parent->id]);
    }
}
