<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'summary' => fake()->sentence(),
            'description' => fake()->paragraphs(2, true),
            'icon' => 'compass',
            'price' => fake()->numberBetween(2000000, 20000000),
            'is_active' => true,
            'is_featured' => false,
            'features' => [fake()->sentence(), fake()->sentence()],
            'process' => [fake()->word(), fake()->word()],
            'target_audience' => [fake()->word()],
            'outcomes' => [fake()->word()],
            'faqs' => [],
            'cta_text' => 'دریافت مشاوره',
            'cta_url' => '/contact',
            'sort_order' => 0,
        ];
    }
}
