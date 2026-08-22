import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Compass, GraduationCap, HeartHandshake, Leaf, Rocket, Sparkles, UserRound, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
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
    const { initial } = usePage().props;
    const [step, setStep] = useState(0);
    const { data, setData, post, processing, errors } = useForm({
        audience: initial.audience || '',
        child_age: initial.child_age ? String(initial.child_age) : '',
        grade: initial.grade || '',
        primary_goal: initial.primary_goal || '',
        current_need: initial.current_need || '',
        interests: initial.interests || [],
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
        if (current === 'audience')
            return data.audience !== '';
        if (current === 'age')
            return data.child_age !== '';
        if (current === 'grade')
            return data.grade !== '';
        if (current === 'goal')
            return data.primary_goal !== '';
        if (current === 'need')
            return data.current_need !== '';
        if (current === 'interests')
            return data.interests.length > 0;
        return true;
    }, [step, steps, data]);
    const submit = () => {
        post(route('dashboard.onboarding.store'), {
            preserveScroll: true,
        });
    };
    const toggleInterest = (item) => {
        setData('interests', data.interests.includes(item)
            ? data.interests.filter((i) => i !== item)
            : data.interests.length >= 3 ? data.interests : [...data.interests, item]);
    };
    const pick = (key, value) => {
        setData(key, value);
        if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };
    const renderQuestion = () => {
        const key = steps[step]?.key;
        if (key === 'audience') {
            return (_jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: AUDIENCES.map((a) => (_jsxs("button", { type: "button", onClick: () => pick('audience', a.value), className: `group flex items-start gap-3 rounded-2xl border p-4 text-right transition-all ${data.audience === a.value ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-200/50' : 'border-white/80 bg-white/80 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft'}`, children: [_jsx("span", { className: `flex size-10 shrink-0 items-center justify-center rounded-xl ${data.audience === a.value ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`, children: _jsx(a.icon, { className: "size-5" }) }), _jsxs("span", { children: [_jsx("strong", { className: "block text-sm font-black text-navy", children: a.label }), _jsx("small", { className: "mt-1 block text-xs font-bold leading-5 text-navy/45", children: a.hint })] })] }, a.value))) }));
        }
        if (key === 'age') {
            return (_jsx("div", { className: "grid grid-cols-4 gap-2 sm:grid-cols-7", children: Array.from({ length: 14 }, (_, i) => i + 8).map((age) => (_jsxs("button", { type: "button", onClick: () => pick('child_age', String(age)), className: `rounded-2xl border px-2 py-4 text-center transition-all ${data.child_age === String(age) ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy hover:border-brand-300'}`, children: [_jsx("strong", { className: "block text-lg font-black", children: age }), _jsx("small", { className: "text-[0.6rem] font-bold opacity-70", children: "\u0633\u0627\u0644" })] }, age))) }));
        }
        if (key === 'grade') {
            return (_jsx("div", { className: "flex flex-wrap gap-2", children: GRADES.map((g) => (_jsx("button", { type: "button", onClick: () => pick('grade', g), className: `rounded-full border px-4 py-2.5 text-xs font-black transition-all ${data.grade === g ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/70 hover:border-brand-300'}`, children: g }, g))) }));
        }
        if (key === 'goal') {
            return (_jsx("div", { className: "grid gap-2.5 sm:grid-cols-2", children: GOALS.map((g) => (_jsxs("button", { type: "button", onClick: () => pick('primary_goal', g), className: `flex items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-right text-sm font-black transition-all ${data.primary_goal === g ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/75 hover:border-brand-300 hover:text-brand-700'}`, children: [g, data.primary_goal === g && _jsx(Check, { className: "size-4" })] }, g))) }));
        }
        if (key === 'need') {
            return (_jsx("div", { className: "flex flex-col gap-2.5", children: NEEDS.map((n) => (_jsxs("button", { type: "button", onClick: () => pick('current_need', n), className: `flex items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-right text-sm font-black transition-all ${data.current_need === n ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/75 hover:border-brand-300 hover:text-brand-700'}`, children: [n, data.current_need === n && _jsx(Check, { className: "size-4" })] }, n))) }));
        }
        return (_jsx("div", { className: "flex flex-wrap gap-2", children: INTERESTS.map((i) => {
                const active = data.interests.includes(i);
                return (_jsx("button", { type: "button", onClick: () => toggleInterest(i), className: `rounded-full border px-4 py-2.5 text-xs font-black transition-all ${active ? 'border-brand-500 bg-brand-500 text-white shadow-glow' : 'border-white/80 bg-white/80 text-navy/70 hover:border-brand-300'}`, children: i }, i));
            }) }));
    };
    return (_jsxs(UserDashboardLayout, { children: [_jsx(Head, { title: "\u0633\u0627\u062E\u062A \u0645\u0633\u06CC\u0631 \u0631\u0634\u062F" }), _jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-6", children: [_jsxs("header", { className: "text-center", children: [_jsxs("span", { className: "dashboard-eyebrow mx-auto w-fit", children: [_jsx(Sparkles, { className: "size-3.5" }), " \u0634\u0646\u0627\u062E\u062A \u0645\u0633\u06CC\u0631"] }), _jsx("h2", { className: "mt-3 text-2xl font-black text-navy md:text-3xl", children: "\u0645\u0633\u06CC\u0631 \u0631\u0634\u062F \u0634\u0645\u0627 \u0627\u0632 \u0634\u0646\u0627\u062E\u062A \u0634\u0631\u0648\u0639 \u0645\u06CC\u200C\u0634\u0648\u062F" }), _jsx("p", { className: "mx-auto mt-3 max-w-xl text-sm leading-7 text-navy/50", children: "\u0686\u0646\u062F \u0633\u0624\u0627\u0644 \u06A9\u0648\u062A\u0627\u0647\u061B \u062A\u0627 \u062F\u0648\u0631\u0647\u200C\u0647\u0627\u060C \u062E\u062F\u0645\u0627\u062A \u0648 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u0647\u0627 \u0631\u0627 \u062F\u0642\u06CC\u0642\u0627\u064B \u0628\u0631\u0627\u06CC \u0634\u0645\u0627 \u0628\u0686\u06CC\u0646\u06CC\u0645. \u067E\u0627\u0633\u062E\u200C\u0647\u0627 \u0641\u0642\u0637 \u0628\u0631\u0627\u06CC \u0634\u062E\u0635\u06CC\u200C\u0633\u0627\u0632\u06CC \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F." })] }), _jsx("div", { className: "flex items-center gap-1.5", "aria-hidden": true, children: steps.map((s, i) => (_jsx("span", { className: `h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-navy/10'}` }, s.key))) }), _jsxs("section", { className: "rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-8", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center gap-2 text-xs font-black text-brand-700", children: [_jsx(Compass, { className: "size-4" }), " \u0645\u0631\u062D\u0644\u0647 ", step + 1, " \u0627\u0632 ", steps.length] }), _jsx("span", { className: "text-xs font-bold text-navy/40", children: steps[step].hint })] }), _jsx("h3", { className: "mb-6 text-xl font-black leading-9 text-navy", children: steps[step].title }), renderQuestion(), errors.primary_goal && _jsx("p", { className: "mt-3 text-xs font-bold text-red-600", children: errors.primary_goal }), _jsxs("div", { className: "mt-8 flex items-center justify-between gap-3", children: [_jsxs("button", { type: "button", onClick: () => setStep((s) => Math.max(0, s - 1)), disabled: step === 0, className: "inline-flex items-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-xs font-black text-navy/60 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40", children: [_jsx(ArrowRight, { className: "size-4" }), " \u0642\u0628\u0644\u06CC"] }), step < steps.length - 1 ? (_jsxs("button", { type: "button", onClick: () => setStep((s) => s + 1), disabled: !canNext, className: "inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow transition-colors hover:bg-brand-600 disabled:opacity-40", children: ["\u0645\u0631\u062D\u0644\u0647 \u0628\u0639\u062F ", _jsx(ArrowLeft, { className: "size-4" })] })) : (_jsxs("button", { type: "button", onClick: submit, disabled: processing || !canNext, className: "inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-3 text-sm font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 disabled:opacity-50", children: [_jsx(Rocket, { className: "size-4" }), " ", processing ? 'در حال ساخت مسیر...' : 'ساخت مسیر اختصاصی من'] }))] })] }), _jsx("section", { className: "grid gap-3 sm:grid-cols-3", children: [
                            { icon: Compass, title: 'شناخت', text: 'نقش، هدف و نیاز شما ثبت می‌شود' },
                            { icon: Sparkles, title: 'شخصی‌سازی', text: 'پیشنهادها بر اساس پاسخ شما چیده می‌شود' },
                            { icon: Leaf, title: 'رشد', text: 'داشبورد مسیر شما از همین‌جا شروع می‌شود' },
                        ].map((f) => (_jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-4", children: [_jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600", children: _jsx(f.icon, { className: "size-4.5" }) }), _jsxs("div", { children: [_jsx("strong", { className: "block text-xs font-black text-navy", children: f.title }), _jsx("small", { className: "mt-1 block text-[0.68rem] font-bold leading-5 text-navy/45", children: f.text })] })] }, f.title))) })] })] }));
}
