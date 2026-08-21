import { Sparkles } from 'lucide-react';

interface SeoGuideProps {
    onGenerate: () => void;
    titleValue: string;
    descriptionValue: string;
    titleLabel?: string;
    descriptionLabel?: string;
}

/**
 * Reusable on-page SEO guide + fields for admin content forms. It explains
 * what Google reads, shows live length feedback, and can auto-fill the meta
 * fields from the content the admin has already written.
 */
export function SeoGuide({ onGenerate, titleValue, descriptionValue, titleLabel = 'عنوان متا', descriptionLabel = 'توضیحات متا' }: SeoGuideProps) {
    const titleOk = titleValue.length >= 10 && titleValue.length <= 70;
    const descOk = descriptionValue.length >= 40 && descriptionValue.length <= 170;

    return (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-black text-navy">سئو (SEO)</h2>
                    <p className="mt-1 text-xs leading-6 text-navy/50">
                        این بخش مشخص می‌کند که صفحه‌تان در نتایج گوگل چطور دیده شود. اگر چیزی ننویسید، به‌صورت خودکار از عنوان و توضیحات شما ساخته می‌شود.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onGenerate}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-black text-brand-700 transition-colors hover:bg-brand-100"
                >
                    <Sparkles className="size-4" /> ساخت خودکار متا
                </button>
            </div>

            <div className="mt-5 grid gap-4">
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-bold text-navy/70">{titleLabel}</label>
                        <span className={`text-[0.65rem] font-bold ${titleOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {titleValue.length} کاراکتر — ایده‌آل ۱۰ تا ۷۰
                        </span>
                    </div>
                    <input value={titleValue} readOnly className="w-full rounded-xl border border-navy/10 bg-soft-gray/60 px-4 py-3 text-sm text-navy" dir="rtl" placeholder="عنوان متا به‌صورت خودکار ساخته می‌شود..." />
                    <p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">در نتایج گوگل فقط حدود ۶۰ کاراکتر نمایش داده می‌شود؛ کلمه کلیدی اصلی را در ابتدای عنوان بگذارید.</p>
                </div>
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-bold text-navy/70">{descriptionLabel}</label>
                        <span className={`text-[0.65rem] font-bold ${descOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {descriptionValue.length} کاراکتر — ایده‌آل ۴۰ تا ۱۷۰
                        </span>
                    </div>
                    <textarea value={descriptionValue} readOnly rows={3} className="w-full resize-y rounded-xl border border-navy/10 bg-soft-gray/60 px-4 py-3 text-sm leading-7 text-navy" placeholder="توضیحات متا به‌صورت خودکار ساخته می‌شود..." />
                    <p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">توضیحی جذاب و حاوی کلمه کلیدی بنویسید؛ کاربر باید دلیل کلیک را متوجه شود.</p>
                </div>
            </div>

            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-xs leading-6 text-navy/60">
                <strong className="text-brand-700">راهنمای سئو:</strong> عنوان و توضیح کوتاه و دقیق بنویسید، کلمه کلیدی اصلی (مثلاً «دوره برنامه‌نویسی نوجوانان») را یک‌بار در متن بیاورید، و تصویر دوره حتماً داشته باشد — تصویر در نتایج گوگل نمایش داده می‌شود. محتوای تکراری ننویسید؛ هر دوره باید توصیف منحصربه‌فردی داشته باشد.
            </div>
        </section>
    );
}
