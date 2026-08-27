import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Compass, GraduationCap, HeartHandshake, Leaf, Moon, Parentheses, Rocket, Sparkles, UserRound, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatPrice } from '@/lib/format';
import type { PageProps } from '@/types';

interface OnboardingProps {
    initial: {
        audience?: string;
        child_age?: number | null;
        grade?: string;
        primary_goal?: string;
        current_need?: string;
        interests?: string[];
    };
}

const AUDIENCES = [
    { value: 'student', label: 'نوجوان / دانش‌آموز', icon: GraduationCap, hint: 'می‌خواهم مسیر خودم را کشف کنم' },
    { value: 'parent', label: 'والد', icon: Users, hint: 'برای رشد فرزندم اقدام می‌کنم' },
    { value: 'instructor', label: 'مدرس / معلم', icon: HeartHandshake, hint: 'به دنبال توانمندسازی و آموزش هستم' },
    { value: 'other', label: 'سایر', icon: UserRound, hint: 'به دنبال رشد حرفه‌ای هستم' },
];

const GRADES = ['پایه هفتم', 'پایه هشتم', 'پایه نهم', 'پایه دهم', 'پایه یازدهم', 'پایه دوازدهم', 'دانشجو', 'فارغ‌التحصیل'];

const GOALS = [
    'شناخت استعداد و علاقه‌مندی',
    'طراحی مسیر تحصیلی و شغلی',
    'مهارت‌های آینده و کارآفرینی',
    'کوچینگ تحصیلی و موفقیت در مدرسه',
    'رشد فردی و اعتماد به نفس',
    'آموزش مدرسین و معلمان',
    'مشاوره والدین برای همراهی نوجوان',
    'توانمندسازی حرفه‌ای',
];

const NEEDS = [
    'نمی‌دانم از کجا شروع کنم',
    'نیاز به برنامه مشخص دارم',
    'مشکل تمرکز و انگیزه دارم',
    'به دنبال مشاوره تخصصی هستم',
    'فقط دنبال دوره و محتوای خوبم',
    'می‌خواهم با یک کوچ همراه شوم',
];

const INTERESTS = [
    'استعدادشناسی', 'کارآفرینی', 'مهارت‌های مطالعه', 'برنامه‌ریزی', 'اعتماد به نفس',
    'هوش هیجانی', 'مهارت ارتباطی', 'برنامه‌نویسی', 'زبان انگلیسی', 'مدرسه و کنکور',
    'رهبری', 'خلاقیت و ایده‌پردازی',
];

export default function OnboardingIndex() {
    const { initial } = usePage<PageProps & OnboardingProps>().props;
    const [step, setStep] = useState(0);
    const { data, setData, post, processing, errors } = useForm({
        audience: (initial.audience as string) || '',
        child_age: initial.child_age ? String(initial.child_age) : '',
        grade: (initial.grade as string) || '',
        primary_goal: (initial.primary_goal as string) || '',
        current_need: (initial.current_need as string) || '',
        interests: (initial.interests as string[]) || [],
    });

    const steps = useMemo(() => {
        const base = [
            { key: 'audience', title: 'شما در این مسیر چه نقشی دارید؟', hint: 'پاسخ شما تجربه پنل را برایتان اختصاصی می‌کند' },
            { key: 'age', title: 'سن فرزند / خودتان چقدر است؟', hint: 'برای پیشنهادهای دقیق‌تر' },
            { key: 'grade', title: 'مقطع تحصیلی کدام است؟', hint: 'مسیر رشد بر اساس پایه شما تنظیم می‌شود' },
            { key: 'goal', title: 'هدف اصلی شما چیست؟', hint: 'مهم‌ترین نیازتان را انتخاب کنید' },
            { key: 'need', title: 'الان بیشتر به چه کمکی نیاز دارید؟', hint: 'به ما کمک می‌کند بهترین قدم بعدی را پیشنهاد دهیم' },
            { key: 'interests', title: 'به کدام حوزه‌ها علاقه دارید؟', hint: 'تا سه مورد انتخاب کنید' },
        ];
        return data.audience === 'parent' ? base : base.filter((s) => s.key !== 'age' && s.key !== 'grade');
    }, [data.audience]);

    const canNext = useMemo(() => {
        const current = steps[step]?.key;
        if (current === 'audience') return data.audience !== '';
        if (current === 'age') return data.child_age !== '';
        if (current === 'grade') return data.grade !== '';
        if (current === 'goal') return data.primary_goal !== '';
        if (current === 'need') return data.current_need !== '';
        if (current === 'interests') return data.interests.length > 0;
        return true;
    }, [step, steps, data]);

    const submit = () => {
        post(route('dashboard.onboarding.store'), {
            preserveScroll: true,
        });
    };

    const toggleInterest = (item: string) => {
        setData('interests', data.interests.includes(item)
            ? data.interests.filter((i) => i !== item)
            : data.interests.length >= 3 ? data.interests : [...data.interests, item]);
    };

    const pick = (key: 'audience' | 'child_age' | 'grade' | 'primary_goal' | 'current_need', value: string) => {
        setData(key, value);
        if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const renderQuestion = () => {
        const key = steps[step]?.key;
        if (key === 'audience') {
            return (
                <div className="grid gap-3 sm:grid-cols-2">
                    {AUDIENCES.map((a) => (
                        <button key={a.value} type="button" onClick={() => pick('audience', a.value)}
                            className={`group flex items-start gap-3 rounded-2xl border p-4 text-right transition-all ${data.audience === a.value ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-200/50' : 'border-white/80 bg-white/80 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft'}`}>
                            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${data.audience === a.value ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}><a.icon className="size-5" /></span>
                            <span><strong className="block text-sm font-black text-navy">{a.label}</strong><small className="mt-1 block text-xs font-bold leading-5 text-navy/45">{a.hint}</small></span>
                        </button>
                    ))}
                </div>
            );
        }
        if (key === 'age') {
            return (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {Array.from({ length: 14 }, (_, i) => i + 8).map((age) => (
                        <button key={age} type="button" onClick={() => pick('child_age', String(age))}
                            className={`rounded-2xl border px-2 py-4 text-center transition-all ${data.child_age === String(age) ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy hover:border-brand-300'}`}>
                            <strong className="block text-lg font-black">{age}</strong><small className="text-[0.6rem] font-bold opacity-70">سال</small>
                        </button>
                    ))}
                </div>
            );
        }
        if (key === 'grade') {
            return (
                <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                        <button key={g} type="button" onClick={() => pick('grade', g)}
                            className={`rounded-full border px-4 py-2.5 text-xs font-black transition-all ${data.grade === g ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/70 hover:border-brand-300'}`}>{g}</button>
                    ))}
                </div>
            );
        }
        if (key === 'goal') {
            return (
                <div className="grid gap-2.5 sm:grid-cols-2">
                    {GOALS.map((g) => (
                        <button key={g} type="button" onClick={() => pick('primary_goal', g)}
                            className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-right text-sm font-black transition-all ${data.primary_goal === g ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/75 hover:border-brand-300 hover:text-brand-700'}`}>
                            {g}{data.primary_goal === g && <Check className="size-4" />}
                        </button>
                    ))}
                </div>
            );
        }
        if (key === 'need') {
            return (
                <div className="flex flex-col gap-2.5">
                    {NEEDS.map((n) => (
                        <button key={n} type="button" onClick={() => pick('current_need', n)}
                            className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-right text-sm font-black transition-all ${data.current_need === n ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/75 hover:border-brand-300 hover:text-brand-700'}`}>
                            {n}{data.current_need === n && <Check className="size-4" />}
                        </button>
                    ))}
                </div>
            );
        }
        return (
            <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                    const active = data.interests.includes(i);
                    return (
                        <button key={i} type="button" onClick={() => toggleInterest(i)}
                            className={`rounded-full border px-4 py-2.5 text-xs font-black transition-all ${active ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/70 hover:border-brand-300'}`}>{i}</button>
                    );
                })}
            </div>
        );
    };

    return (
        <UserDashboardLayout>
            <Head title="ساخت مسیر رشد" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <header className="text-center">
                    <span className="dashboard-eyebrow mx-auto w-fit"><Sparkles className="size-3.5" /> شناخت مسیر</span>
                    <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">مسیر رشد شما از شناخت شروع می‌شود</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-navy/50">چند سؤال کوتاه؛ تا دوره‌ها، خدمات و پیشنهادها را دقیقاً برای شما بچینیم. پاسخ‌ها فقط برای شخصی‌سازی استفاده می‌شود.</p>
                </header>

                <div className="flex items-center gap-1.5" aria-hidden>
                    {steps.map((s, i) => (
                        <span key={s.key} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-navy/10'}`} />
                    ))}
                </div>

                <section className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-black text-brand-700"><Compass className="size-4" /> مرحله {step + 1} از {steps.length}</span>
                        <span className="text-xs font-bold text-navy/40">{steps[step].hint}</span>
                    </div>
                    <h3 className="mb-6 text-xl font-black leading-9 text-navy">{steps[step].title}</h3>
                    {renderQuestion()}
                    {errors.primary_goal && <p className="mt-3 text-xs font-bold text-red-600">{errors.primary_goal}</p>}
                    <div className="mt-8 flex items-center justify-between gap-3">
                        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                            className="inline-flex items-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-xs font-black text-navy/60 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40">
                            <ArrowRight className="size-4" /> قبلی
                        </button>
                        {step < steps.length - 1 ? (
                            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow transition-colors hover:bg-brand-600 disabled:opacity-40">
                                مرحله بعد <ArrowLeft className="size-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={submit} disabled={processing || !canNext}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-3 text-sm font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 disabled:opacity-50">
                                <Rocket className="size-4" /> {processing ? 'در حال ساخت مسیر...' : 'ساخت مسیر اختصاصی من'}
                            </button>
                        )}
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                    {[
                        { icon: Compass, title: 'شناخت', text: 'نقش، هدف و نیاز شما ثبت می‌شود' },
                        { icon: Sparkles, title: 'شخصی‌سازی', text: 'پیشنهادها بر اساس پاسخ شما چیده می‌شود' },
                        { icon: Leaf, title: 'رشد', text: 'داشبورد مسیر شما از همین‌جا شروع می‌شود' },
                    ].map((f) => (
                        <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-4">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><f.icon className="size-4.5" /></span>
                            <div><strong className="block text-xs font-black text-navy">{f.title}</strong><small className="mt-1 block text-[0.68rem] font-bold leading-5 text-navy/45">{f.text}</small></div>
                        </div>
                    ))}
                </section>
            </div>
        </UserDashboardLayout>
    );
}
