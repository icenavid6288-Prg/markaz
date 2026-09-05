import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Compass, GraduationCap, Newspaper, Search as SearchIcon, ShoppingBag } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from '@/Components/ui/PageHeader';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

type SearchResult = {
    id: number;
    title: string;
    description?: string | null;
    url: string;
    image?: string | null;
};

type SearchResults = {
    courses: SearchResult[];
    products: SearchResult[];
    posts: SearchResult[];
    services: SearchResult[];
};

const groups: Array<{ key: keyof SearchResults; label: string; icon: typeof GraduationCap; empty: string }> = [
    { key: 'courses', label: 'دوره‌ها', icon: GraduationCap, empty: 'دوره‌ای پیدا نشد.' },
    { key: 'products', label: 'محصولات آموزشی', icon: ShoppingBag, empty: 'محصولی پیدا نشد.' },
    { key: 'posts', label: 'مقالات', icon: Newspaper, empty: 'مقاله‌ای پیدا نشد.' },
    { key: 'services', label: 'خدمات', icon: Compass, empty: 'خدمتی پیدا نشد.' },
];

export default function SearchIndex() {
    const { query, results } = usePage<PageProps & { query: string; results: SearchResults }>().props;
    const [value, setValue] = useState(query ?? '');

    useEffect(() => {
        setValue(query ?? '');
    }, [query]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const next = value.trim();
        router.get('/search', next ? { q: next } : {}, { preserveState: true, replace: true });
    };

    const total = groups.reduce((count, group) => count + results[group.key].length, 0);

    return (
        <div>
            <PageHeader
                eyebrow="جستجوی سراسری"
                title={query ? `نتایج جستجو برای «${query}»` : 'چه چیزی را پیدا می‌کنید؟'}
                subtitle="دوره‌ها، محصولات آموزشی، مقالات و خدمات را از یکجا پیدا کنید."
            />

            <main className="relative overflow-hidden bg-white py-10 md:py-14">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <form onSubmit={submit} className="search-page-form liquid-card relative mx-auto flex max-w-3xl items-center gap-3 p-3">
                        <SearchIcon className="mr-2 size-5 shrink-0 text-brand-600" aria-hidden />
                        <input
                            type="search"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="مثلاً: کوچینگ، مهارت‌های آینده یا کتاب..."
                            aria-label="جستجو در سایت"
                            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-bold text-navy outline-none placeholder:text-navy/35"
                        />
                        <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-deep-green px-4 py-2 text-xs font-black text-white transition-colors hover:bg-brand-700">
                            <SearchIcon className="size-4" aria-hidden />
                            جستجو
                        </button>
                    </form>

                    {query ? (
                        <div className="mt-8 flex items-center justify-between gap-4 text-xs font-bold text-navy/50">
                            <span>{total} نتیجه در چهار بخش</span>
                            <Link href="/search" className="text-brand-700 hover:text-brand-800">پاک کردن جستجو</Link>
                        </div>
                    ) : (
                        <div className="mx-auto mt-14 max-w-xl text-center">
                            <SearchIcon className="mx-auto size-10 text-brand-500" aria-hidden />
                            <h2 className="mt-4 text-xl font-black text-navy">جستجو را شروع کنید</h2>
                            <p className="mt-2 text-sm leading-7 text-navy/55">نام یک موضوع، دوره، محصول، مقاله یا خدمت را وارد کنید.</p>
                        </div>
                    )}

                    {query && total === 0 && (
                        <div className="liquid-card mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 p-10 text-center">
                            <BookOpen className="size-8 text-brand-500" aria-hidden />
                            <p className="text-sm font-bold text-navy/65">نتیجه‌ای برای این جستجو پیدا نشد.</p>
                            <p className="text-xs text-navy/45">عبارت کوتاه‌تر یا موضوع دیگری را امتحان کنید.</p>
                        </div>
                    )}

                    {query && total > 0 && (
                        <div className="mt-8 grid gap-8 lg:grid-cols-2">
                            {groups.map((group) => {
                                const items = results[group.key];
                                const Icon = group.icon;
                                return (
                                    <section key={group.key} className="search-results-group">
                                        <div className="mb-3 flex items-center justify-between gap-3 border-b border-navy/10 pb-3">
                                            <div className="flex items-center gap-2 text-sm font-black text-navy">
                                                <Icon className="size-5 text-brand-600" aria-hidden />
                                                <h2>{group.label}</h2>
                                            </div>
                                            <span className="text-xs font-bold text-navy/40">{items.length} نتیجه</span>
                                        </div>
                                        {items.length > 0 ? (
                                            <div className="grid gap-3">
                                                {items.map((item) => (
                                                    <Link key={`${group.key}-${item.id}`} href={item.url} className="search-result-item group">
                                                        <span className="search-result-thumb">
                                                            {item.image ? <img src={item.image} alt="" loading="lazy" /> : <Icon className="size-5" aria-hidden />}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <strong className="block truncate text-sm font-black text-navy transition-colors group-hover:text-brand-700">{item.title}</strong>
                                                            {item.description && <span className="mt-1 block line-clamp-2 text-xs leading-6 text-navy/50">{item.description}</span>}
                                                        </span>
                                                        <ArrowLeft className="size-4 shrink-0 text-brand-600 transition-transform group-hover:-translate-x-1" aria-hidden />
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="py-4 text-xs font-bold text-navy/40">{group.empty}</p>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

SearchIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
