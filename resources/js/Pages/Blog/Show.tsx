import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock3, Eye, List, Newspaper, PlayCircle, Share2, Sparkles, UserRound } from 'lucide-react';
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
    article_image?: string | null;
    video_url?: string | null;
    reading_time?: number | null;
    views_count?: number | null;
    published_at?: string | null;
    author?: { name?: string } | null;
}

interface CommentData {
    id: number;
    body: string;
    name: string;
}

export default function BlogShow() {
    const { post, related, auth, comments = [] } = usePage<PageProps & { post: PostData; related: PostData[]; comments?: CommentData[] }>().props;
    const commentForm = useForm({ body: '' });
    const articleRef = useRef<HTMLElement>(null);

    const share = () => {
        if (navigator.share) {
            navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => alert('لینک مقاله کپی شد.'));
        }
    };

    const contentBlocks = (post.body ?? '').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean).map((text) => {
        if (/^#{1,3}\s+/.test(text)) return { type: 'heading' as const, text: text.replace(/^#{1,3}\s+/, '') };
        if (/^[-*]\s+/.test(text)) return { type: 'tip' as const, text: text.replace(/^[-*]\s+/, '') };
        return { type: 'paragraph' as const, text };
    });
    const headings = contentBlocks.filter((block) => block.type === 'heading');
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
                        <figure className="group relative mb-10 overflow-hidden rounded-[2rem] bg-deep-gradient shadow-lift">
                            <img src={post.cover_image} alt={post.title} className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="eager" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent p-5 pt-16 text-white">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur"><BookOpen className="size-3.5" /> مجله مسیر رشد</span>
                            </div>
                        </figure>
                    )}

                    <div className="mb-10 grid gap-5 sm:grid-cols-3">
                        <div className="rounded-2xl bg-brand-50 p-4"><Clock3 className="size-5 text-brand-600" /><div className="mt-2 text-xs font-bold text-navy/45">زمان مطالعه</div><div className="mt-1 font-black text-navy">{formatNumber(post.reading_time || 3)} دقیقه</div></div>
                        <div className="rounded-2xl bg-amber-50 p-4"><Eye className="size-5 text-amber-600" /><div className="mt-2 text-xs font-bold text-navy/45">بازدید مقاله</div><div className="mt-1 font-black text-navy">{formatNumber(post.views_count || 0)} نفر</div></div>
                        <div className="rounded-2xl bg-emerald-50 p-4"><Sparkles className="size-5 text-emerald-600" /><div className="mt-2 text-xs font-bold text-navy/45">یک قدم برای رشد</div><div className="mt-1 font-black text-navy">خواندنی و کاربردی</div></div>
                    </div>

                    {headings.length > 0 && (
                        <nav className="mb-10 rounded-2xl border border-brand-100 bg-brand-50/60 p-5" aria-label="فهرست مطالب">
                            <div className="flex items-center gap-2 text-sm font-black text-navy"><List className="size-4 text-brand-600" /> در این مقاله می‌خوانید</div>
                            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                                {headings.map((heading, index) => <li key={`${heading.text}-${index}`}><a href={`#article-heading-${index}`} className="text-sm font-bold text-brand-700 hover:text-brand-900">{index + 1}. {heading.text}</a></li>)}
                            </ol>
                        </nav>
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

                    <article ref={articleRef} className="article-reading flex flex-col gap-6">
                        {post.article_image && (
                            <figure className="liquid-card overflow-hidden"><img src={post.article_image} alt={post.title} className="w-full object-cover" loading="lazy" /></figure>
                        )}
                        {contentBlocks.length > 0 ? contentBlocks.map((block, i) => block.type === 'heading' ? (
                            <h2 key={i} id={`article-heading-${headings.findIndex((heading) => heading === block)}`} className="scroll-mt-28 pt-5 text-xl font-black leading-9 text-navy md:text-2xl">{block.text}</h2>
                        ) : block.type === 'tip' ? (
                            <div key={i} className="flex gap-3 rounded-2xl border-r-4 border-brand-500 bg-brand-50 p-5 text-sm font-bold leading-8 text-navy/75"><CheckCircle2 className="mt-1 size-5 shrink-0 text-brand-600" />{block.text}</div>
                        ) : (
                            <p key={i} className="text-base leading-9 text-navy/75">{block.text}</p>
                        )) : <p className="text-base leading-9 text-navy/75">{post.excerpt}</p>}
                    </article>

                    <div className="mt-10 rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                        <div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-400/20"><Sparkles className="size-5 text-brand-200" /></span><div><div className="text-xs font-black text-brand-200">حرف آخر</div><p className="mt-2 text-sm leading-8 text-white/75">هر تغییر بزرگی با یک قدم کوچک شروع می‌شود. اگر این مقاله برایتان مفید بود، آن را با یک نفر که به این مسیر نیاز دارد به اشتراک بگذارید.</p></div></div>
                    </div>

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
