import { useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Save, SendHorizontal, Sparkles } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type AiSetting = {
    enabled: boolean; provider: string; base_url: string | null; model: string;
    temperature: number; max_tokens: number; system_prompt: string | null; has_key: boolean;
};

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

export default function EitaaAi() {
    const { ai } = usePage<PageProps & { ai: AiSetting }>().props;
    const form = useForm({
        enabled: ai.enabled,
        provider: ai.provider,
        base_url: ai.base_url ?? '',
        model: ai.model,
        temperature: ai.temperature,
        max_tokens: ai.max_tokens,
        system_prompt: ai.system_prompt ?? '',
        api_key: '',
    });
    const [draftBrief, setDraftBrief] = useState('');
    const [draftTone, setDraftTone] = useState('friendly');
    const [draftResult, setDraftResult] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [drafting, setDrafting] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put('/admin/eitaa/ai', { preserveScroll: true, onSuccess: () => form.setData('api_key', '') });
    };

    const runDraft = async () => {
        setDrafting(true);
        setDraftError(null);
        setDraftResult(null);
        try {
            const response = await fetch('/admin/eitaa/ai/draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ brief: draftBrief, tone: draftTone }),
            });
            const payload = await response.json();
            if (payload.ok) {
                setDraftResult(payload.text ?? payload.draft ?? '');
            } else {
                setDraftError(payload.message ?? 'تولید پیش‌نویس ناموفق بود.');
            }
        } catch {
            setDraftError('ارتباط با سرور برقرار نشد.');
        } finally {
            setDrafting(false);
        }
    };

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Sparkles className="size-6 text-brand-600" /> هوش مصنوعی برای پیش‌نویس پیام</h1>
            <p className="mt-2 text-sm text-navy/50">اتصال به OpenAI یا سرویس سازگار برای تولید متن پیام‌های ایتا.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <h2 className="text-sm font-black text-navy">تنظیمات اتصال</h2>
                <div className="mt-5 space-y-4">
                    <label className="flex items-center justify-between gap-3 rounded-xl bg-soft-gray px-4 py-3">
                        <span className="text-xs font-black text-navy/70">فعال‌سازی تولید متن با هوش مصنوعی</span>
                        <input type="checkbox" checked={form.data.enabled} onChange={(e) => form.setData('enabled', e.target.checked)} className="rounded border-navy/20 text-brand-600" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">سرویس‌دهنده</span>
                            <select value={form.data.provider} onChange={(e) => form.setData('provider', e.target.value)} className={inputClass}>
                                <option value="openai">OpenAI</option>
                                <option value="custom">سرویس سازگار (Custom)</option>
                            </select></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">مدل</span>
                            <input value={form.data.model} onChange={(e) => form.setData('model', e.target.value)} className={`${inputClass} font-mono text-xs`} dir="ltr" /></label>
                    </div>
                    {form.data.provider === 'custom' && <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">آدرس پایه API</span>
                        <input value={form.data.base_url} onChange={(e) => form.setData('base_url', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="https://api.example.com/v1" dir="ltr" /></label>}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">خلاقیت (Temperature)</span>
                            <input type="number" step="0.1" min={0} max={2} value={form.data.temperature} onChange={(e) => form.setData('temperature', Number(e.target.value))} className={inputClass} /></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">حداکثر توکن</span>
                            <input type="number" min={50} max={4000} value={form.data.max_tokens} onChange={(e) => form.setData('max_tokens', Number(e.target.value))} className={inputClass} /></label>
                    </div>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">کلید API {ai.has_key && <span className="text-emerald-600">(ذخیره شده — برای تعویض مقدار جدید وارد کنید)</span>}</span>
                        <input type="password" value={form.data.api_key} onChange={(e) => form.setData('api_key', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="sk-..." dir="ltr" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">دستور سیستمی (System Prompt)</span>
                        <textarea rows={4} value={form.data.system_prompt} onChange={(e) => form.setData('system_prompt', e.target.value)} className={inputClass} placeholder="تو دستیار پیام‌رسانی مرکز رشد و کارآفرینی دکتر بیدی هستی..." /></label>
                    <Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره تنظیمات</Button>
                </div>
            </form>

            <div className="h-fit rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <h2 className="flex items-center gap-2 text-sm font-black text-navy"><SendHorizontal className="size-4 text-brand-600" /> آزمایش تولید متن</h2>
                <p className="mt-1 text-[0.68rem] leading-5 text-navy/45">موضوع پیام را بنویسید تا پیش‌نویس تولید شود؛ نتیجه را می‌توانید در ارسال سریع استفاده کنید.</p>
                <div className="mt-4 space-y-3">
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">موضوع / دستور</span>
                        <textarea rows={4} value={draftBrief} onChange={(e) => setDraftBrief(e.target.value)} className={inputClass} placeholder="معرفی دوره مدیریت زمان برای والدین نوجوانان" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">لحن</span>
                        <select value={draftTone} onChange={(e) => setDraftTone(e.target.value)} className={inputClass}>
                            <option value="friendly">صمیمی</option>
                            <option value="formal">رسمی</option>
                            <option value="sales">تبلیغاتی</option>
                        </select></label>
                    <Button type="button" variant="outline" loading={drafting} disabled={!ai.enabled || !draftBrief.trim()} onClick={runDraft}>
                        <Sparkles className="size-4" /> تولید پیش‌نویس
                    </Button>
                    {!ai.enabled && <p className="text-[0.68rem] font-bold text-amber-600">ابتدا قابلیت هوش مصنوعی را فعال و کلید API را ذخیره کنید.</p>}
                    {draftError && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{draftError}</p>}
                    {draftResult && <div className="rounded-xl bg-soft-gray p-4"><p className="whitespace-pre-wrap text-xs leading-6 text-navy/75">{draftResult}</p></div>}
                </div>
            </div>
        </section>
    </div>;
}

EitaaAi.layout = (page: ReactNode) => <AdminLayout title="هوش مصنوعی ایتا">{page}</AdminLayout>;