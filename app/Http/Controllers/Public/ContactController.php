<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Setting;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $seo = Seo::page(
            $request,
            'تماس با مرکز رشد و کارآفرینی دکتر بیدی',
            'برای دریافت مشاوره رایگان و شناخت مسیر مناسب فرزندتان با کارشناسان مرکز رشد و کارآفرینی دکتر بیدی گفتگو کنید.',
            null,
            [
                '@type' => 'ContactPage',
                'mainEntity' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                    'telephone' => (string) Setting::get('phone', ''),
                    'email' => (string) Setting::get('email', ''),
                    'address' => [
                        '@type' => 'PostalAddress',
                        'streetAddress' => (string) Setting::get('address', ''),
                        'addressCountry' => 'IR',
                    ],
                ],
            ],
        );

        return Inertia::render('Contact/Index', [
            'seo' => $seo,
            'services' => Service::active()->limit(6)->get(),
        ]);
    }
}
