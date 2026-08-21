<?php

namespace Database\Factories;

use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Testimonial>
 */
class TestimonialFactory extends Factory
{
    protected $model = Testimonial::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name('female'),
            'role' => fake()->randomElement(['parent', 'student', 'instructor', 'coach']),
            'content' => fake()->paragraph(),
            'rating' => fake()->numberBetween(4, 5),
            'is_approved' => true,
            'sort_order' => 0,
        ];
    }
}
