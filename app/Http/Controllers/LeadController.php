<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use App\Services\Crm\LeadService;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request, MarketingCampaignDispatcher $marketing, LeadService $leads)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'child_age' => ['nullable', 'string', 'max:50'],
            'grade' => ['nullable', 'string', 'max:50'],
            'need' => ['nullable', 'string', 'max:255'],
            'consent' => ['nullable', 'boolean'],
        ]);

        // موافقت با حریم خصوصی فقط اعتبارسنجی می‌شود و در لید ذخیره نمی‌شود.
        $leadData = [...$validated];
        unset($leadData['consent']);

        $attribution = (array) $request->session()->get('instagram_attribution', []);
        $source = ($attribution['source'] ?? null) === 'instagram' ? 'instagram' : 'website';
        $lead = Lead::create([
            ...$leadData,
            'source' => $source,
            'status' => 'new',
            'attribution' => $attribution !== [] ? $attribution : null,
        ]);

        $leads->record($lead, 'note', ($source === 'instagram' ? 'لید جدید از اینستاگرام و فرم وب‌سایت' : 'لید جدید از فرم وب‌سایت').' ('.now()->format('Y/m/d H:i').')', $request->user());

        // If this phone already belongs to a registered user, link the lead to
        // that account so the CRM sees one continuous journey.
        $existingUser = User::where('phone', $lead->phone)->where('is_active', true)->first();
        if ($existingUser) {
            $leads->linkToUser($lead, $existingUser, 'اتصال خودکار به حساب کاربری موجود');
        }

        $marketing->dispatchForTrigger('lead_created', [
            'name' => $lead->name,
            'phone' => $lead->phone,
            'email' => $lead->email,
        ]);

        return back()->with('success', 'درخواست شما ثبت شد؛ کارشناسان ما به‌زودی با شما تماس می‌گیرند.');
    }
}
