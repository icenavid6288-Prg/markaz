import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock3, Newspaper, PlayCircle, Share2, UserRound } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { ReadingProgress } from '@/Components/ReadingProgress';
import SectionMedia, { resolveVideoUrl } from '@/Components/SectionMedia';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatDate, formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface PostData {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    cover_image?: string | null;
    video_url?: string | null;
    reading_time?: number | null;
    views_count?: number | null;
    published_at?: string | null;
    author?: { name?: string } | null;
}

export default function BlogShow() {
    const { post, related } = usePage<PageProps & { post: PostData; related: PostData[] }>().props;
    const articleRef = useRef<HTMLElement>(null);

    const share = () => {
        if (navigator.share) {
            navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => alert('لینک مقاله کپی شد.'));
        }
    };

    const paragraphs = (post.body ?? '').split(/\n{2,}/).filter(Boolean);
    const articleVideo = resolveVideoUrl(post.video_url ?? '');

    return (
        <div>
            <ReadingProgress targetRef={articleRef} />
            <PageHeader
                eyebrow="بلاگ و دانش‌نامه"
                title={post.title}
                subtitle={post.excerpt}
                actions={
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                        {post.author?.name && (
                            <span className="flex items-center gap-1.5">
                                <UserRound className="size-4 text-brand-300" aria-hidden /> {post.author.name}
                            </span>
                        )}
                        {post.published_at && (
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="size-4 text-brand-300" aria-hidden /> {formatDate(post.published_at)}
                            </span>
                        )}
                        {post.reading_time ? (
                            <span className="flex items-center gap-1.5">
                                <Clock3 className="size-4 text-brand-300" aria-hidden /> {formatNumber(post.reading_time)} دقیقه مطالعه
                            </span>
                        ) : null}
                        <button type="button" onClick={share} className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <Share2 className="size-4 text-brand-300" aria-hidden /> اشتراک‌گذاری
                        </button>
                    </div>
                }
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative mx-auto max-w-3xl">
                    {post.cover_image && (
                        <div className="liquid-card mb-10 overflow-hidden">
                            <img src={post.cover_image} alt={post.title} className="aspect-video w-full object-cover" loading="lazy" />
                        </div>
                    )}

                    {articleVideo && (
                        <section className="mb-10">
                            <div className="section-eyebrow">
                                <span className="section-eyebrow-mark" />
                                <PlayCircle className="size-4 text-brand-600" aria-hidden />
                                <span>ویدیوی این مقاله</span>
                            </div>
                            <SectionMedia
                                video={post.video_url}
                                poster={post.cover_image}
                                title={`ویدیوی مقاله: ${post.title}`}
                                className="mt-4"
                            />
                        </section>
                    )}

                    <article ref={articleRef} className="flex flex-col gap-6">
                        {paragraphs.length > 0 ? (
                            paragraphs.map((paragraph, i) => (
                                <p key={i} className="text-base leading-9 text-navy/75">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-base leading-9 text-navy/75">{post.excerpt}</p>
                        )}
                    </article>

                    <section className="mt-12 border-t border-navy/10 pt-8">
                        <h2 className="text-lg font-black text-navy">نظرات</h2>
                        {auth.user ? (
                            <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); commentForm.post(`/blog/${post.slug}/comments`, { preserveScroll: true, onSuccess: () => commentForm.reset('body') }); }}>
                                <textarea rows={3} value={commentForm.data.body} onChange={(event) => commentForm.setData('body', event.target.value)} className="w-full rounded-2xl border border-navy/10 px-4 py-3 text-sm text-navy outline-none focus:border-brand-500" placeholder="نظر خود را بنویسید..." />
                                {commentForm.errors.body && <p className="text-xs font-bold text-red-600">{commentForm.errors.body}</p>}
                                <button type="submit" disabled={commentForm.processing} className="self-start rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">ارسال نظر</button>
                            </form>
                        ) : (
                            <p className="mt-3 text-sm font-bold text-navy/50">برای ثبت نظر ابتدا وارد شوید.</p>
                        )}
                        <div className="mt-6 flex flex-col gap-4">
                            {comments.length === 0 && <p className="text-sm font-bold text-navy/40">هنوز نظر تأییدشده‌ای ثبت نشده است.</p>}
                            {comments.map((comment) => (
                                <article key={comment.id} className="rounded-2xl bg-soft-gray p-4">
                                    <div className="text-xs font-black text-navy">{comment.name}</div>
                                    <p className="mt-2 text-sm leading-7 text-navy/70">{comment.body}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <div className="mt-12 flex items-center justify-between gap-4 border-t border-navy/10 pt-6">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                            <ArrowLeft className="size-4" aria-hidden /> بازگشت به بلاگ
                        </Link>
                        {post.views_count ? (
                            <span className="flex items-center gap-1.5 text-xs text-navy/40">
                                <Newspaper className="size-3.5" aria-hidden /> {formatNumber(post.views_count)} بازدید
                            </span>
                        ) : null}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-teal ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>مطالب مرتبط</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">ادامه مطالعه</h2>
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <Link key={item.id} href={`/blog/${item.slug}`} className="liquid-card group flex flex-col gap-3 p-5">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <div className="flex items-center gap-3 text-xs text-navy/45">
                                        {item.author?.name && <span className="font-bold">{item.author.name}</span>}
                                        {item.published_at && <span>{formatDate(item.published_at)}</span>}
                                    </div>
                                    <h3 className="line-clamp-2 text-base font-black leading-7 text-navy transition-colors group-hover:text-brand-700">
                                        {item.title}
                                    </h3>
                                    <span className="service-more mt-auto text-xs font-bold text-brand-700">
                                        خواندن مقاله <ArrowLeft className="inline size-3.5" aria-hidden />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

BlogShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
