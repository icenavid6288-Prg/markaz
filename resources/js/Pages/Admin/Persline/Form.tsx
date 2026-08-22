import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart3, Check, ClipboardPen, Clock, Copy, FileUp, Info, Megaphone, MessagesSquare, Plus, Save, Send, Share2, Sparkles, Target, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type QuestionSettings = Record<string, string | number | boolean | null>;
interface Question { type: string; title: string; description: string | null; options: string[]; settings: QuestionSettings; is_required: boolean; include_in_summary: boolean; }
interface Settings { registration_after: number; show_progress: boolean; randomize_questions: boolean; allow_multiple_responses: boolean; allow_back_navigation: boolean; completion_redirect: string; summary_intro: string; summary_outro: string; }
interface Template { key: string; label: string; short_label: string; description: string; title: string; intro: string; welcome_message: string; completion_message: string; default_settings: Settings; questions: Question[]; }
interface PerslineForm { id: number; title: string; persline_type: string; share_token: string; share_url: string; description: string | null; welcome_message: string | null; completion_message: string | null; status: 'draft' | 'published' | 'closed'; settings: Settings; questions: Question[]; questions_count: number; responses_count: number; completed_responses_count: number; eitaa_scheduled_at: string | null; eitaa_published_at: string | null; eitaa_summary_sent_at: string | null; }

const defaultSettings: Settings = { registration_after: 0, show_progress: true, randomize_questions: false, allow_multiple_responses: false, allow_back_navigation: true, completion_redirect: '', summary_intro: '', summary_outro: '' };
const emptyQuestion = (): Question => ({ type: 'single', title: '', description: null, options: [], settings: {}, is_required: true, include_in_summary: true });
const typeIcons: Record<string, typeof Megaphone> = { ads: Megaphone, eitaa: MessagesSquare, warm_lead: Target };

export default function PerslineForm() {
    const props = usePage<PageProps & { form: PerslineForm | null; types: Record<string, { label: string; short_label: string; description: string }>; questionTypes: Record<string, string>; templates: Record<string, Template>; selectedTemplate: Template | null }>().props;
    const { form: existing, types, questionTypes, templates, selectedTemplate } = props;
    const isEdit = Boolean(existing);
    const [copied, setCopied] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const form = useForm<{
        persline_type: string; title: string; description: string; welcome_message: string; completion_message: string; status: string;
        settings: Settings; questions: Question[]; eitaa_scheduled_at: string; file: File | null;
    }>({
        persline_type: existing?.persline_type ?? selectedTemplate?.key ?? '',
        title: existing?.title ?? selectedTemplate?.title ?? '',
        description: existing?.description ?? selectedTemplate?.intro ?? '',
        welcome_message: existing?.welcome_message ?? selectedTemplate?.welcome_message ?? '',
        completion_message: existing?.completion_message ?? selectedTemplate?.completion_message ?? '',
        status: existing?.status ?? 'draft',
        settings: { ...defaultSettings, ...(existing?.settings ?? selectedTemplate?.default_settings ?? {}) },
        questions: existing?.questions?.length
            ? existing.questions
            : selectedTemplate?.questions?.length
                ? selectedTemplate.questions.map((q) => ({ ...q }))
                : [emptyQuestion()],
        eitaa_scheduled_at: existing?.eitaa_scheduled_at ?? '',
        file: null,
    });

    const input = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    const typeKey = form.data.persline_type;
    const typeMeta = typeKey ? types[typeKey] : null;
    const TypeIcon = typeKey ? (typeIcons[typeKey] ?? Sparkles) : Sparkles;

    const loadTemplate = (key: string) => {
        const template = templates[key];
        if (!template) return;
        if (confirm(`قالب «${template.label}» انتخاب شود؟ محتوای فعلی فرم جایگزین می‌شود.`)) {
            form.setData({
                ...form.data,
                persline_type: key,
                title: template.title,
                description: template.intro ?? '',
                welcome_message: template.welcome_message ?? '',
                completion_message: template.completion_message ?? '',
                settings: { ...defaultSettings, ...template.default_settings },
                questions: template.questions.length ? template.questions.map((q) => ({ ...q })) : [emptyQuestion()],
            });
        }
    };

    const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => form.setData('settings', { ...form.data.settings, [key]: value });
    const updateQuestion = (index: number, patch: Partial<Question>) => form.setData('questions', form.data.questions.map((question, i) => (i === index ? { ...question, ...patch } : question)));
    const addQuestion = () => form.setData('questions', [...form.data.questions, emptyQuestion()]);
    const removeQuestion = (index: number) => form.setData('questions', form.data.questions.filter((_, i) => i !== index));
    const moveQuestion = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= form.data.questions.length) return;
        const next = [...form.data.questions];
        [next[index], next[target]] = [next[target], next[index]];
        form.setData('questions', next);
    };

    const copyLink = async () => {
        if (existing?.share_url) { await navigator.clipboard?.writeText(existing.share_url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    };
    const publishToEitaa = () => { if (existing && confirm(`لینک فرم «${existing.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/persline/${existing.share_token}/publish-eitaa`, {}, { preserveScroll: true }); };
    const shareOnEitaa = () => { if (existing) { const url = `https://eitaa.com/share/url?url=${encodeURIComponent(existing.share_url)}&text=${encodeURIComponent(`فرم پرسلاین: ${existing.title}`)}`; window.open(url, '_blank', 'noopener'); } };
    const sendSummaryToEitaa = () => { if (existing && confirm(`جمع‌بندی نتایج «${existing.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/persline/${existing.share_token}/send-eitaa-summary`, {}, { preserveScroll: true }); };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { forceFormData: true as const };
        if (isEdit && existing) {
            // PHP only populates $_POST for real POST bodies, so a multipart PUT
            // arrives with an empty payload. Send the update as POST and let
            // Laravel's method spoofing treat it as PUT.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/persline/${existing.share_token}`, options);
        } else {
            form.post('/admin/persline', options);
        }
    };
    const hasErrors = Object.keys(form.errors).length > 0;
    const importedName = file?.name;

    return <form onSubmit={submit} encType="multipart/form-data" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/persline" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به فرم‌ها</Link><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره فرم' : 'ساخت فرم'}</Button></div>
        {hasErrors && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-200">لطفاً خطاهای فرم و سؤال‌ها را بررسی کنید.</div>}
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8"><div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><ClipboardPen className="size-4" /> استودیو پرسلاین</div><h1 className="mt-3 text-2xl font-black md:text-3xl">{isEdit ? 'ویرایش فرم' : 'ساخت فرم پرسلاین'}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">قالب را انتخاب کنید، سؤال‌ها را شخصی‌سازی کنید و لینک خصوصی را در تبلیغات یا کانال ایتا منتشر کنید. پاسخ‌ها به‌صورت خودکار در CRM ثبت می‌شوند.</p></div></section>

        {isEdit && existing && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5"><div><div className="flex items-center gap-2 text-xs font-black text-brand-800"><TypeIcon className="size-4" /> {typeMeta?.short_label ?? '—'} · {existing.responses_count} پاسخ ({existing.completed_responses_count} کامل)</div><code className="mt-1 block break-all text-sm font-bold text-brand-950" dir="ltr">{existing.share_url}</code><div className="mt-2 flex flex-wrap gap-1.5">{existing.eitaa_scheduled_at && !existing.eitaa_published_at && <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.68rem] font-black text-amber-800"><Clock className="size-3.5" /> انتشار خودکار در {existing.eitaa_scheduled_at}</span>}{existing.eitaa_published_at && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[0.68rem] font-black text-emerald-700"><Send className="size-3.5" /> در ایتا منتشر شد ({existing.eitaa_published_at})</span>}{existing.eitaa_summary_sent_at && <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[0.68rem] font-black text-indigo-800"><BarChart3 className="size-3.5" /> جمع‌بندی نتایج ارسال شد ({existing.eitaa_summary_sent_at})</span>}</div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'کپی شد' : 'کپی لینک'}</button><button type="button" onClick={publishToEitaa} disabled={existing.status !== 'published'} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" /> انتشار در کانال ایتا</button><button type="button" onClick={shareOnEitaa} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-teal-800 ring-1 ring-teal-200 hover:bg-teal-50"><Share2 className="size-4" /> اشتراک‌گذاری در ایتا</button>{existing.status === 'closed' && !existing.eitaa_summary_sent_at && <button type="button" onClick={sendSummaryToEitaa} disabled={existing.responses_count === 0} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"><BarChart3 className="size-4" /> ارسال جمع‌بندی نتایج</button>}<Link href={`/admin/persline/${existing.share_token}/responses`} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-50"><BarChart3 className="size-4" /> نتایج پاسخ‌ها</Link><a href={existing.share_url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">پیش‌نمایش فرم</a></div></section>}

        {!isEdit && <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 flex items-center gap-2 text-sm font-black text-navy"><Sparkles className="size-4 text-brand-600" /> قالب را انتخاب کنید</div><div className="grid gap-4 md:grid-cols-3">{Object.entries(types).map(([key, type]) => { const Icon = typeIcons[key] ?? Sparkles; const active = form.data.persline_type === key; return <button type="button" key={key} onClick={() => loadTemplate(key)} className={`rounded-2xl border-2 p-5 text-right transition-colors ${active ? 'border-brand-600 bg-brand-50' : 'border-navy/10 bg-white hover:border-brand-300 hover:bg-brand-50/40'}`}><span className={`flex size-10 items-center justify-center rounded-xl ${active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'}`}><Icon className="size-5" /></span><h2 className="mt-3 text-sm font-black text-navy">{type.short_label}</h2><p className="mt-1 text-xs leading-6 text-navy/50">{type.description}</p><span className={`mt-3 inline-flex items-center gap-1 text-xs font-black ${active ? 'text-brand-700' : 'text-navy/40'}`}>{active ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}{active ? 'انتخاب شد' : 'بارگذاری قالب'}</span></button>; })}</div><p className="mt-4 rounded-xl bg-soft-gray/70 p-3 text-xs leading-6 text-navy/50">با انتخاب قالب، عنوان، متن‌ها، تنظیمات و سؤال‌های پیشنهادی بارگذاری می‌شوند؛ بعداً هر کدام را می‌توانید تغییر دهید. برای شروع خالی، فرم را بدون انتخاب قالب پر کنید (نوع در بخش اطلاعات قابل انتخاب است).</p></section>}

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 flex items-center gap-2 text-sm font-black text-navy"><Info className="size-4 text-brand-600" /> اطلاعات و متن‌های فرم</div><div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">نوع قالب</label><select value={form.data.persline_type} onChange={(e) => { const key = e.target.value; if (key && !isEdit) loadTemplate(key); else form.setData('persline_type', key); }} disabled={isEdit} className={`${input} disabled:cursor-not-allowed disabled:opacity-50`}><option value="">بدون قالب (شروع خالی)</option>{Object.entries(types).map(([key, type]) => <option key={key} value={key}>{type.short_label}</option>)}</select>{form.errors.persline_type && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.persline_type}</p>}{isEdit && <p className="mt-1.5 text-[0.68rem] text-navy/45">نوع قالب بعد از ساخت قابل تغییر نیست.</p>}</div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">عنوان فرم <span className="text-red-500">*</span></label><input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={input} placeholder="مثلاً: آینده فرزندتان برای شما چقدر روشن است؟" />{form.errors.title && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.title}</p>}</div>
            <div><label className="mb-1.5 block text-xs font-black text-navy/70">وضعیت</label><select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} className={input}><option value="draft">پیش‌نویس (لینک غیرفعال)</option><option value="published">فعال</option><option value="closed">بسته‌شده</option></select>{form.errors.status && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.status}</p>}</div>
            <div><label className="mb-1.5 block text-xs font-black text-navy/70">تعداد سؤال قبل از ثبت‌نام</label><input type="number" min={0} max={1000} value={form.data.settings.registration_after} onChange={(e) => setSetting('registration_after', Number(e.target.value))} className={input} /><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/45">صفر یعنی ثبت‌نام در ابتدا؛ مثلاً ۳ یعنی سه سؤال اول آزاد و ادامه بعد از ورود.</p>{form.errors['settings.registration_after'] && <p className="mt-1 text-xs font-bold text-red-600">{form.errors['settings.registration_after']}</p>}</div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">مقدمه (نمایش زیر عنوان)</label><textarea rows={3} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className={input} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">پیام خوش‌آمدگویی</label><textarea rows={3} value={form.data.welcome_message} onChange={(e) => form.setData('welcome_message', e.target.value)} className={input} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">پیام پایان فرم</label><textarea rows={3} value={form.data.completion_message} onChange={(e) => form.setData('completion_message', e.target.value)} className={input} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">انتشار خودکار در کانال ایتا</label><input type="datetime-local" value={form.data.eitaa_scheduled_at} onChange={(e) => form.setData('eitaa_scheduled_at', e.target.value)} className={input} /><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/45">در تاریخ مشخص‌شده، لینک فرم به‌صورت خودکار در کانال ایتا منتشر می‌شود. برای حذف زمان‌بندی، مقدار را خالی کنید. (نیازمند فعال بودن cron هاست است)</p>{form.errors.eitaa_scheduled_at && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.eitaa_scheduled_at}</p>}</div>
        </div></section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-black text-navy"><ClipboardPen className="size-4 text-brand-600" /> سؤال‌ها و ترتیب نمایش</div><span className="rounded-lg bg-soft-gray px-2.5 py-1 text-[0.68rem] font-black text-navy/45">{form.data.questions.length} سؤال</span></div><div className="flex flex-col gap-4">{form.data.questions.map((question, index) => <div key={index} className="rounded-2xl border border-navy/10 bg-soft-gray/35 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-black text-brand-800">سؤال {index + 1}</span><div className="flex items-center gap-0.5"><button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0} className="rounded-lg px-2 py-1 text-xs font-black text-navy/45 hover:bg-white disabled:opacity-30" aria-label="انتقال به بالا">↑</button><button type="button" onClick={() => moveQuestion(index, 1)} disabled={index === form.data.questions.length - 1} className="rounded-lg px-2 py-1 text-xs font-black text-navy/45 hover:bg-white disabled:opacity-30" aria-label="انتقال به پایین">↓</button></div></div><button type="button" onClick={() => removeQuestion(index)} disabled={form.data.questions.length <= 1} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="size-3.5" /> حذف</button></div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-black text-navy/70">نوع سؤال</label><select value={question.type} onChange={(e) => updateQuestion(index, { type: e.target.value })} className={input}>{Object.entries(questionTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div><label className="mb-1.5 block text-xs font-black text-navy/70">الزامی</label><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 text-sm font-bold text-navy/70"><input type="checkbox" checked={question.is_required} onChange={(e) => updateQuestion(index, { is_required: e.target.checked })} className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" /> پاسخ الزامی است</label></div>
                <div><label className="mb-1.5 block text-xs font-black text-navy/70">جمع‌بندی</label><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 text-sm font-bold text-navy/70"><input type="checkbox" checked={question.include_in_summary} onChange={(e) => updateQuestion(index, { include_in_summary: e.target.checked })} className="size-4 rounded border-navy/20 text-indigo-600 focus:ring-indigo-500" /> نمایش در جمع‌بندی ایتا</label></div>
                <div><label className="mb-1.5 block text-xs font-black text-navy/70">اتصال به سرنخ CRM</label><select value={question.settings.lead_key ? String(question.settings.lead_key) : ''} onChange={(e) => updateQuestion(index, { settings: { ...question.settings, lead_key: e.target.value || null } })} className={input}><option value="">بدون اتصال</option><option value="name">نام</option><option value="phone">شماره تماس</option><option value="email">ایمیل</option><option value="child_age">سن فرزند</option><option value="grade">پایه تحصیلی</option><option value="need">نیاز / دغدغه</option><option value="child_name">نام فرزند</option></select><p className="mt-1.5 text-[0.68rem] text-navy/45">با انتخاب، پاسخ این سؤال هنگام تکمیل فرم به همان فیلد سرنخ در CRM منتقل می‌شود.</p></div>
                <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">متن سؤال <span className="text-red-500">*</span></label><input value={question.title} onChange={(e) => updateQuestion(index, { title: e.target.value })} className={input} placeholder="سؤال را واضح و کوتاه بنویسید" />{form.errors[`questions.${index}.title`] && <p className="mt-1 text-xs font-bold text-red-600">{form.errors[`questions.${index}.title`]}</p>}</div>
                <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">راهنمای سؤال</label><input value={question.description ?? ''} onChange={(e) => updateQuestion(index, { description: e.target.value || null })} className={input} placeholder="اختیاری" /></div>
                {['single', 'multiple'].includes(question.type) && <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-black text-navy/70">گزینه‌ها ({questionTypes[question.type]})</label><textarea rows={4} value={question.options.join('\n')} onChange={(e) => updateQuestion(index, { options: e.target.value.split(/\r?\n/).map((o) => o.trim()).filter(Boolean) })} className={`${input} resize-y`} placeholder={'هر گزینه در یک خط\nگزینه اول\nگزینه دوم'} /><p className="mt-1.5 text-[0.68rem] text-navy/45">هر گزینه را در یک خط بنویسید.</p></div>}
            </div>
        </div>)}</div><button type="button" onClick={addQuestion} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 px-4 py-3 text-sm font-black text-brand-700 hover:bg-brand-50"><Plus className="size-4" /> افزودن سؤال</button></section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 flex items-center gap-2 text-sm font-black text-navy"><FileUp className="size-4 text-indigo-600" /> بارگذاری سؤال‌ها از فایل</div><p className="mb-4 text-xs leading-6 text-navy/50">می‌توانید سؤال‌ها را از فایل JSON، CSV یا متن ساده وارد کنید تا جایگزین فهرست فعلی شود. در متن ساده، سؤال‌های شماره‌دار (۱. …) با گزینه‌های زیرشان (خط با - یا •) به‌صورت خودکار «تک گزینه‌ای» می‌شوند.</p><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 px-4 py-3 text-sm font-black text-brand-700 hover:bg-brand-50"><FileUp className="size-4" /> انتخاب فایل <input type="file" accept=".json,.csv,.txt,text/plain,application/json,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" /></label>{importedName ? <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{importedName} <button type="button" onClick={() => setFile(null)} className="text-emerald-900/60 hover:text-red-600">حذف</button></span> : <span className="text-xs font-bold text-navy/40">هیچ فایلی انتخاب نشده</span>}</div><p className="mt-3 text-[0.68rem] leading-5 text-navy/45">فایل هنگام ذخیره‌ی فرم پردازش می‌شود و سؤال‌های فعلی را جایگزین می‌کند. اگر ساختار فایل نامعتبر باشد، فرم ذخیره نمی‌شود و خطا نمایش داده می‌شود. (حداکثر ۴ مگابایت)</p>{form.errors.file && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.file}</p>}</section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 flex items-center gap-2 text-sm font-black text-navy"><BarChart3 className="size-4 text-indigo-600" /> قالب جمع‌بندی کانال ایتا</div><p className="mb-5 text-xs leading-6 text-navy/50">بعد از بستن فرم، نتایج به‌صورت کارت گرافیکی و پیام متنی در کانال منتشر می‌شود. متن‌های دلخواه قبل و بعد از نتایج بنویسید (متغیر {`{title}`} با عنوان فرم جایگزین می‌شود). با تیک «نمایش در جمع‌بندی» بالای هر سؤال، مشخص کنید کدام سؤال‌ها در جمع‌بندی بیایند.</p><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs font-black text-navy/70">متن قبل از نتایج</label><textarea rows={3} value={form.data.settings.summary_intro} onChange={(e) => setSetting('summary_intro', e.target.value)} className={input} placeholder="مثلاً: از همه شرکت‌کنندگان سپاسگزاریم." /></div><div><label className="mb-1.5 block text-xs font-black text-navy/70">متن بعد از نتایج</label><textarea rows={3} value={form.data.settings.summary_outro} onChange={(e) => setSetting('summary_outro', e.target.value)} className={input} placeholder="مثلاً: برای مشاوره رایگان با ما تماس بگیرید." /></div></div></section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 text-sm font-black text-navy">تنظیمات تجربه پاسخ‌گویی</div><div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-black text-navy/70">مسیر بعد از تکمیل (اختیاری)</label><input dir="ltr" value={form.data.settings.completion_redirect} onChange={(e) => setSetting('completion_redirect', e.target.value)} className={input} placeholder="/courses یا خالی" /></div>
            <Toggle label="نمایش نوار پیشرفت" value={form.data.settings.show_progress} onChange={(v) => setSetting('show_progress', v)} />
            <Toggle label="ترتیب تصادفی سؤال‌ها" value={form.data.settings.randomize_questions} onChange={(v) => setSetting('randomize_questions', v)} />
            <Toggle label="اجازه پاسخ مجدد برای هر کاربر" value={form.data.settings.allow_multiple_responses} onChange={(v) => setSetting('allow_multiple_responses', v)} />
            <Toggle label="اجازه برگشت به سؤال‌های قبل" value={form.data.settings.allow_back_navigation} onChange={(v) => setSetting('allow_back_navigation', v)} />
        </div></section>

        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره نهایی فرم</Button></div>
    </form>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
    return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-soft-gray/35 px-4 py-3 text-sm font-bold text-navy/70"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" />{label}</label>;
}

PerslineForm.layout = (page: ReactNode) => <AdminLayout title="ساخت و ویرایش فرم پرسلاین">{page}</AdminLayout>;
