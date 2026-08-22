import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Sparkles } from 'lucide-react';
import { type FormEvent } from 'react';
import type { PageProps } from '@/types';

type AnswerValue = string | number | string[];
interface Question { id: number; type: string; title: string; description?: string | null; options: string[]; required: boolean; }
interface SurveyData {
    title: string;
    description?: string | null;
    welcome_message?: string | null;
    completion_message: string;
    show_progress: boolean;
    allow_back_navigation?: boolean;
    completion_redirect: string;
    poster_url?: string | null;
    display_mode?: 'all' | 'paged';
}

export default function SurveyShow() {
    const {
        survey, questions, answers: initialAnswers, registered, registrationRequired, registrationAfter, completed, totalQuestions, currentIndex = 0, visibleTotal = questions.length, errors,
    } = usePage<PageProps & {
        survey: SurveyData;
        questions: Question[];
        answers: Record<string, AnswerValue>;
        registered: boolean;
        registrationRequired: boolean;
        registrationAfter: number;
        completed: boolean;
        totalQuestions: number;
        currentIndex?: number;
        visibleTotal?: number;
        errors?: Record<string, string>;
    }>().props;

    const paged = survey.display_mode === 'paged' && !completed;
    const initial: Record<string, AnswerValue> = {};
    for (const q of questions) {
        initial[String(q.id)] = initialAnswers[String(q.id)] ?? '';
    }

    const form = useForm<{ answers: Record<string, AnswerValue>; question_id: number | null }>({
        answers: initial,
        question_id: questions[0]?.id ?? null,
    });

    const current = questions[0];
    const currentValue = current ? form.data.answers[String(current.id)] ?? '' : '';
    const currentEmpty = currentValue === '' || currentValue === null || (Array.isArray(currentValue) && currentValue.length === 0);
    const canGoNext = !current || !current.required || !currentEmpty;
    const answeredCount = Object.values(form.data.answers).filter((v) => v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)).length;
    const progressBase = paged ? Math.max(1, visibleTotal) : Math.max(1, questions.length);
    const progress = paged
        ? Math.min(100, Math.round(((currentIndex + (currentEmpty ? 0 : 1)) / progressBase) * 100))
        : Math.min(100, Math.round((answeredCount / progressBase) * 100));
    const input = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    const isLast = !paged || currentIndex >= visibleTotal - 1;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (paged && !canGoNext) return;
        form.transform((data) => ({ ...data, question_id: current?.id ?? null }));
        form.post(window.location.pathname.replace(/\/$/, '') + '/answer', { preserveScroll: true });
    };

    const goBack = () => {
        if (!survey.allow_back_navigation || currentIndex <= 0) return;
        window.location.href = `${window.location.pathname.replace(/\/$/, '')}?q=${currentIndex - 1}`;
    };

    return <div dir="rtl" className="min-h-screen bg-soft-gray px-4 py-8 md:px-6"><Head title={survey.title} /><main className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-navy/5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><ClipboardList className="size-5" /></span><div><div className="text-[0.65rem] font-black text-brand-700">{paged ? 'یک سؤال در هر صفحه' : 'نظرسنجی خصوصی'}</div><h1 className="text-sm font-black text-navy">{survey.title}</h1></div></div><a href="/" className="inline-flex items-center gap-1 text-xs font-bold text-navy/45 hover:text-brand-700">ورود به سایت <ArrowLeft className="size-3.5" /></a></header>

        {survey.poster_url && <section className="overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-navy/5"><img src={survey.poster_url} alt={survey.title} className="max-h-[28rem] w-full object-cover" /></section>}

        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-9"><div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-brand-400/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><Sparkles className="size-4" /> دیدگاه شما برای ما مهم است</div><h2 className="mt-3 text-2xl font-black leading-relaxed md:text-3xl">{survey.title}</h2>{survey.description && <p className="mt-3 text-sm leading-8 text-white/65">{survey.description}</p>}{survey.welcome_message && <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-7 text-white/80">{survey.welcome_message}</p>}</div></section>

        {completed ? <section className="rounded-[2rem] bg-white p-8 text-center shadow-soft ring-1 ring-navy/5 md:p-12"><CheckCircle2 className="mx-auto size-16 text-emerald-500" /><h2 className="mt-5 text-2xl font-black text-navy">نظرسنجی تکمیل شد</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-8 text-navy/55">{survey.completion_message}</p>{survey.completion_redirect && <a href={survey.completion_redirect} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-700">ادامه در سایت <ArrowLeft className="size-4" /></a>}</section>
        : questions.length > 0 ? <form onSubmit={submit} className="flex flex-col gap-5">
            {survey.show_progress && <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                <div className="flex items-center justify-between text-xs font-black text-navy/50"><span>{paged ? `سؤال ${currentIndex + 1} از ${visibleTotal}` : registrationRequired ? 'مرحله اول از دو مرحله' : 'پیشرفت پاسخ‌گویی'}</span><span>{paged ? `${currentIndex + 1} / ${visibleTotal}` : `${answeredCount} از ${questions.length} پاسخ‌شده`}</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>
            </section>}

            {questions.map((question, index) => {
                const value = form.data.answers[String(question.id)] ?? '';
                const setAnswer = (v: AnswerValue) => form.setData('answers', { ...form.data.answers, [String(question.id)]: v });
                const fieldError = errors?.[`answers.${question.id}`];
                const number = paged ? currentIndex + 1 : index + 1;

                return <section key={question.id} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5 md:p-6">
                    <div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-700">{number}</span><div className="flex-1">
                        <h3 className="text-sm font-black leading-7 text-navy md:text-base">{question.title} {question.required && <span className="text-red-500">*</span>}</h3>
                        {question.description && <p className="mt-1 text-xs leading-6 text-navy/45">{question.description}</p>}
                        <div className="mt-4">{renderAnswer(question, value, setAnswer, input)}</div>
                        {fieldError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{fieldError}</p>}
                    </div></div>
                </section>;
            })}

            <div className="flex flex-col gap-3 sm:flex-row">
                {paged && survey.allow_back_navigation && currentIndex > 0 && (
                    <button type="button" onClick={goBack} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-navy ring-1 ring-navy/10">
                        <ArrowRight className="size-4" /> سؤال قبلی
                    </button>
                )}
                <button type="submit" disabled={form.processing || (paged && !canGoNext)} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-4 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
                    {form.processing ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <CheckCircle2 className="size-5" />}
                    {form.processing ? 'در حال ذخیره...' : paged ? (isLast ? (registrationRequired && !registered ? 'ادامه و ثبت‌نام' : 'ثبت و پایان') : 'سؤال بعدی') : 'ثبت و پایان نظرسنجی'}
                </button>
            </div>
            {paged && !canGoNext && <p className="text-center text-xs font-bold text-amber-700">برای رفتن به سؤال بعد، این سؤال را پاسخ دهید.</p>}
        </form> : <section className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-navy/50 shadow-soft ring-1 ring-navy/5">سؤالی برای نمایش وجود ندارد.</section>}

        <footer className="text-center text-[0.68rem] font-bold text-navy/35">این نظرسنجی از طریق یک لینک خصوصی ارسال شده است.</footer>
    </main></div>;
}

function renderAnswer(question: Question, value: AnswerValue, onChange: (value: AnswerValue) => void, input: string) {
    const options = question.type === 'yes_no' ? ['بله', 'خیر'] : question.options;
    if (['single', 'yes_no'].includes(question.type)) {
        return <div className="flex flex-col gap-2">{options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 px-4 py-3 text-sm font-bold text-navy/70 hover:border-brand-300 hover:bg-brand-50"><input type="radio" name={`question-${question.id}`} checked={String(value ?? '') === option} onChange={() => onChange(option)} className="size-4 border-navy/20 text-brand-600 focus:ring-brand-500" />{option}</label>)}</div>;
    }
    if (question.type === 'multiple') {
        return <div className="flex flex-col gap-2">{options.map((option) => { const selected = Array.isArray(value) && value.includes(option); return <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 px-4 py-3 text-sm font-bold text-navy/70 hover:border-brand-300 hover:bg-brand-50"><input type="checkbox" checked={selected} onChange={(e) => onChange(e.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value.filter((item) => item !== option) : []))} className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" />{option}</label>; })}</div>;
    }
    if (question.type === 'textarea') return <textarea rows={5} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={`${input} resize-y`} />;
    if (question.type === 'number') return <input type="number" min="0" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={input} />;
    if (question.type === 'rating') {
        return <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => onChange(rating)} className={`flex size-11 items-center justify-center rounded-xl border text-sm font-black ${Number(value) === rating ? 'border-brand-600 bg-brand-600 text-white' : 'border-navy/10 bg-white text-navy/60 hover:border-brand-300'}`}>{rating}</button>)}</div>;
    }
    return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={input} />;
}
