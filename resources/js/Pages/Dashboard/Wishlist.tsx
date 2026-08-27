import { Link } from '@inertiajs/react';
import { BookOpen, Heart, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';

interface WishlistItem {
    id: number;
    type: 'course' | 'product';
    title: string;
    url: string;
    image?: string | null;
}

export default function Wishlist({ items }: { items: WishlistItem[] }) {
    return (
        <UserDashboardLayout>
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <header>
                    <div className="dashboard-eyebrow"><span /> علاقه‌مندی‌ها</div>
                    <h1 className="mt-2 text-2xl font-black text-navy">دوره‌ها و محصولاتی که ذخیره کرده‌اید</h1>
                </header>
                {items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-brand-200 bg-white/70 p-12 text-center">
                        <Heart className="mx-auto size-10 text-brand-500" />
                        <p className="mt-4 text-sm font-bold text-navy/50">هنوز موردی به علاقه‌مندی‌ها اضافه نشده است.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {items.map((item) => (
                            <Link key={item.id} href={item.url} className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-soft">
                                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-700">
                                    {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : item.type === 'course' ? <BookOpen className="size-6" /> : <ShoppingBag className="size-6" />}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[0.65rem] font-black text-brand-700">{item.type === 'course' ? 'دوره' : 'محصول'}</div>
                                    <h2 className="truncate text-sm font-black text-navy">{item.title}</h2>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </UserDashboardLayout>
    );
}

Wishlist.layout = (page: ReactNode) => page;
