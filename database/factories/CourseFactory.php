<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => $title,
            'subtitle' => fake()->sentence(),
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'description' => fake()->paragraphs(3, true),
            'level' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'price' => fake()->numberBetween(500000, 5000000),
            'discount_price' => fake()->optional(0.4)->numberBetween(300000, 4500000),
            'duration_minutes' => fake()->numberBetween(120, 1200),
            'certificate_enabled' => true,
            'is_published' => true,
            'is_featured' => false,
            'students_count' => fake()->numberBetween(0, 500),
            'rating_avg' => fake()->randomFloat(1, 3.5, 5),
        ];
    }
}
