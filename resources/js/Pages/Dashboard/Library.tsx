import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Download, Headphones, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { PodcastPlayer, type PodcastEpisodeData } from '@/Components/PodcastPlayer';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import type { PageProps } from '@/types';

interface PodcastItem {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    episodes: PodcastEpisodeData[];
}

interface DownloadItem {
    id: number;
    title: string;
    slug: string;
    type: 'book' | 'digital';
    description?: string | null;
    image?: string | null;
    has_preview: boolean;
    preview_url?: string | null;
    has_file: boolean;
    download_url?: string | null;
}

export default function DashboardLibrary() {
    const { podcasts, downloads } = usePage<PageProps & { podcasts: PodcastItem[]; downloads: DownloadItem[] }>().props;
    const isEmpty = podcasts.length === 0 && downloads.length === 0;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-6xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <span className="dashboard-eyebrow"><span /> محتوای من</span>
                    <h2 className="mt-2 text-2xl font-black text-navy">کتابخانه من</h2>
                    <p className="mt-2 text-sm leading-7 text-navy/50">پادکست‌ها و فایل‌هایی که خریداری کرده‌اید، همیشه از اینجا در دسترس هستند.</p>
                </div>
                <Link href="/shop" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-xs font-black text-brand-700 transition-colors hover:bg-brand-50"><ShoppingBag className="size-4" /> رفتن به فروشگاه <ArrowLeft className="size-4" /></Link>
            </header>

            {podcasts.length > 0 && <section>
                <div className="mb-4 flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Headphones className="size-5" /></span><div><h3 className="text-lg font-black text-navy">پادکست‌های من</h3><p className="text-xs font-bold text-navy/40">گوش‌دادن به قسمت‌های خریداری‌شده</p></div></div>
                <div className="grid gap-5">
                    {podcasts.map((podcast) => <article key={podcast.id} className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-soft md:p-6">
                        <div className="mb-5 flex flex-wrap items-start gap-4">
                            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-deep-gradient text-white shadow-soft">{podcast.image ? <img src={podcast.image} alt={podcast.title} className="size-full object-cover" /> : <Headphones className="size-9" />}</div>
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-black text-navy">{podcast.title}</h4><span className="rounded-lg bg-brand-100 px-2 py-1 text-[0.62rem] font-black text-brand-700">خریداری‌شده</span></div>{podcast.description && <p className="mt-2 line-clamp-2 text-sm leading-7 text-navy/50">{podcast.description}</p>}<Link href={`/shop/${podcast.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:text-brand-900">مشاهده صفحه محصول <ArrowLeft className="size-3.5" /></Link></div>
                        </div>
                        {podcast.episodes.length > 0 ? <PodcastPlayer episodes={podcast.episodes} /> : <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">قسمت‌های این پادکست هنوز آماده نشده‌اند.</p>}
                    </article>)}
                </div>
            </section>}

            {downloads.length > 0 && <section>
                <div className="mb-4 flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><BookOpen className="size-5" /></span><div><h3 className="text-lg font-black text-navy">فایل‌های خریداری‌شده</h3><p className="text-xs font-bold text-navy/40">کتاب‌ها و فایل‌های دیجیتال شما</p></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {downloads.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-deep-green text-white">{item.image ? <img src={item.image} alt={item.title} className="size-full object-cover" /> : <BookOpen className="size-7" />}</div><div className="min-w-0 flex-1"><h4 className="truncate text-sm font-black text-navy">{item.title}</h4><p className="mt-1 text-xs font-bold text-navy/40">{item.type === 'book' ? 'کتاب' : 'فایل دیجیتال'}</p><div className="mt-2 flex flex-wrap gap-2">{item.has_preview && item.preview_url ? <a href={item.preview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[0.68rem] font-black text-brand-700 hover:bg-brand-100">مطالعه آنلاین</a> : null}{item.has_file && item.download_url ? <a href={item.download_url} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[0.68rem] font-black text-white hover:bg-brand-700"><Download className="size-3.5" /> دانلود نسخه خریداری‌شده</a> : null}</div>{!item.has_preview && !item.has_file && <span className="mt-2 inline-block text-[0.68rem] font-bold text-amber-700">فایل هنوز آماده نشده است</span>}</div></article>)}
                </div>
            </section>}

            {isEmpty && <section className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-5 py-16 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><Headphones className="size-7" /></span><h3 className="mt-4 text-base font-black text-navy">کتابخانه شما هنوز خالی است</h3><p className="mt-2 text-sm font-bold text-navy/45">بعد از خرید پادکست، کتاب یا فایل دیجیتال، محتوا از همین صفحه در دسترس شما قرار می‌گیرد.</p><Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-deep-green px-5 py-3 text-xs font-black text-white hover:bg-brand-800">مشاهده فروشگاه <ArrowLeft className="size-4" /></Link></section>}
        </div>
    </UserDashboardLayout>;
}

DashboardLibrary.layout = (page: ReactNode) => page;
