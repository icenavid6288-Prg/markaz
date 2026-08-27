import { Link, useForm } from '@inertiajs/react';
import { Send, Star } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export interface ExistingReviewData {
    rating: number;
    title?: string | null;
    body?: string | null;
    is_approved: boolean;
}

interface ReviewComposerProps {
    action: string;
    canReview: boolean;
    isAuthenticated: boolean;
    existingReview?: ExistingReviewData | null;
    subjectLabel: string;
}

export function ReviewComposer({ action, canReview, isAuthenticated, existingReview, subjectLabel }: ReviewComposerProps) {
    const form = useForm({
        rating: existingReview?.rating ?? 0,
        title: existingReview?.title ?? '',
        body: existingReview?.body ?? '',
    });
    const [hoveredRating, setHoveredRating] = useState(0);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(action, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    if (!isAuthenticated) {
        return <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-center text-sm font-bold text-navy/65">
            برای ثبت نظر درباره {subjectLabel} ابتدا <Link href="/login" className="font-black text-brand-700 hover:text-brand-900">وارد حساب کاربری</Link> شوید.
        </div>;
    }

    if (!canReview) {
        return <div className="rounded-2xl border border-navy/10 bg-soft-gray p-5 text-sm font-bold leading-7 text-navy/55">
            ثبت نظر فقط برای افرادی فعال است که {subjectLabel} را تهیه کرده یا در آن ثبت‌نام کرده‌اند.
        </div>;
    }

    const selectedRating = hoveredRating || form.data.rating;

    return <form onSubmit={submit} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h3 className="text-base font-black text-navy">{existingReview ? 'ویرایش نظر شما' : 'تجربه‌تان را با دیگران به اشتراک بگذارید'}</h3>
                <p className="mt-1 text-xs font-bold text-navy/45">نظر شما پس از بررسی تیم محتوا نمایش داده می‌شود.</p>
            </div>
            {existingReview && !existingReview.is_approved && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[0.68rem] font-black text-amber-700">در انتظار بررسی</span>}
        </div>

        <div className="mt-5">
            <span className="text-xs font-black text-navy/65">امتیاز شما</span>
            <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHoveredRating(0)}>
                {Array.from({ length: 5 }).map((_, index) => {
                    const rating = index + 1;
                    return <button key={rating} type="button" aria-label={`${rating} از ۵`} onMouseEnter={() => setHoveredRating(rating)} onClick={() => form.setData('rating', rating)} className="rounded-lg p-1 transition-transform hover:scale-110">
                        <Star className={`size-6 ${rating <= selectedRating ? 'fill-gold text-gold' : 'text-navy/20'}`} />
                    </button>;
                })}
                <span className="mr-2 text-xs font-bold text-navy/45">{selectedRating ? `${selectedRating} از ۵` : 'انتخاب کنید'}</span>
            </div>
            {form.errors.rating && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.rating}</p>}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
                <span className="mb-1.5 block text-xs font-black text-navy/65">عنوان نظر <span className="font-normal text-navy/35">(اختیاری)</span></span>
                <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} maxLength={120} className="w-full rounded-xl border border-navy/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-400" placeholder="مثلاً تجربه‌ای کاربردی و مفید" />
                {form.errors.title && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.title}</p>}
            </label>
            <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-black text-navy/65">متن نظر</span>
                <textarea value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} rows={4} maxLength={2000} className="w-full resize-y rounded-xl border border-navy/10 bg-white px-3.5 py-3 text-sm leading-7 outline-none transition focus:border-brand-400" placeholder="چه چیزی در این محتوا برای شما مفید بود؟" />
                {form.errors.body && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.body}</p>}
            </label>
        </div>

        <button type="submit" disabled={form.processing || !form.data.rating || form.data.body.trim().length < 5} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-deep-green px-5 py-3 text-xs font-black text-white shadow-soft transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="size-4" /> {form.processing ? 'در حال ارسال...' : existingReview ? 'به‌روزرسانی نظر' : 'ارسال نظر'}
        </button>
    </form>;
}
