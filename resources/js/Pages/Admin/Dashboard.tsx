import { Link, usePage } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowLeft,
    BookOpen,
    GraduationCap,
    PhoneCall,
    ShoppingBag,
    Settings,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import ServicesHealthWidget from '@/Components/ServicesHealthWidget';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumber, toFa } from '@/lib/format';
import type { PageProps } from '@/types';

interface DashboardProps {
    stats: {
        users: number;
        students: number;
        instructors: number;
        coaches: number;
        courses: number;
        products: number;
        leads: number;
        sessions: number;
        revenue: number;
        orders: number;
        activeUsers: number;
        newLeads: number;
    };
    revenueSeries: Array<{ date: string; value: number }>;
    registrationsSeries: Array<{ date: string; value: number }>;
    leadFunnel: Array<{ status: string; count: number }>;
}

const leadLabels: Record<string, string> = {
    new: 'جدید',
    contacted: 'تماس گرفته‌شده',
    interested: 'علاقه‌مند',
    consultation: 'مشاوره',
    registered: 'ثبت‌نام‌کرده',
    customer: 'مشتری',
};

export default function Dashboard() {
    const { stats, revenueSeries, registrationsSeries, leadFunnel } = usePage<PageProps & DashboardProps>().props;

    const cards = [
        { label: 'کاربران', value: stats.users, icon: Users, tone: 'text-brand-600 bg-brand-100' },
        { label: 'دانش‌آموزان', value: stats.students, icon: GraduationCap, tone: 'text-emerald-600 bg-emerald-100' },
        { label: 'دوره‌ها', value: stats.courses, icon: BookOpen, tone: 'text-blue-600 bg-blue-100' },
        { label: 'محصولات', value: stats.products, icon: ShoppingBag, tone: 'text-purple-600 bg-purple-100' },
        { label: 'لیدهای جدید (۷ روز)', value: stats.newLeads, icon: PhoneCall, tone: 'text-gold bg-[#f7eed2]' },
        { label: 'درآمد کل', value: stats.revenue, icon: Wallet, tone: 'text-brand-600 bg-brand-100' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-6">
                    <div><span className="inline-flex items-center gap-2 text-xs font-bold text-brand-200"><TrendingUp className="size-4" /> مرکز فرماندهی رشد</span><h2 className="mt-3 text-2xl font-black md:text-3xl">امروز، مسیر مجموعه را روشن‌تر مدیریت کنید.</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">شاخص‌های زنده، محتوای قابل ویرایش و عملیات اصلی در یک نمای منسجم.</p></div>
                    <div className="flex flex-wrap gap-2"><Link href="/admin/users" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-deep-green hover:bg-brand-100"><Users className="size-4" /> کاربران <ArrowLeft className="size-3.5" /></Link><Link href="/admin/courses/create" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20"><BookOpen className="size-4" /> دوره جدید</Link><Link href="/admin/settings" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white hover:bg-white/20" aria-label="تنظیمات"><Settings className="size-4" /></Link></div>
                </div>
            </section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"
                    >
                        <span className="panel-stat-icon">
                            <card.icon className="size-6" aria-hidden />
                        </span>
                        <div>
                            <div className="text-2xl font-black text-navy">{formatNumber(card.value)}</div>
                            <div className="text-xs font-bold text-navy/45">{card.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <ServicesHealthWidget />

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp className="size-4 text-brand-600" />
                        <h2 className="text-sm font-black text-navy">درآمد ۳۰ روز اخیر (تومان)</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={revenueSeries}>
                            <defs>
                                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2c9a6c" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#2c9a6c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={50} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, fontFamily: 'Vazirmatn', direction: 'rtl' }}
                                formatter={(value) => [formatNumber(Number(value ?? 0)), 'درآمد']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#1d7b56" strokeWidth={2.5} fill="url(#revenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <div className="mb-4 flex items-center gap-2">
                        <Users className="size-4 text-brand-600" />
                        <h2 className="text-sm font-black text-navy">ثبت‌نام ۳۰ روز اخیر</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={registrationsSeries}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, fontFamily: 'Vazirmatn', direction: 'rtl' }}
                                formatter={(value) => [formatNumber(Number(value ?? 0)), 'ثبت‌نام']}
                            />
                            <Bar dataKey="value" fill="#83d1ab" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <h2 className="mb-4 text-sm font-black text-navy">قیف لید (CRM)</h2>
                    <div className="flex flex-col gap-3">
                        {leadFunnel.map((stage) => (
                            <div key={stage.status} className="flex items-center gap-3">
                                <span className="w-28 text-xs font-bold text-navy/60">
                                    {leadLabels[stage.status] ?? stage.status}
                                </span>
                                <div className="h-3 flex-1 overflow-hidden rounded-full bg-soft-gray">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-400 transition-all"
                                        style={{
                                            width: `${Math.max(stage.count > 0 ? 8 : 0, (stage.count / Math.max(1, leadFunnel[0].count)) * 100)}%`,
                                        }}
                                    />
                                </div>
                                <span className="w-8 text-left text-xs font-black text-navy">{toFa(stage.count)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <h2 className="mb-4 text-sm font-black text-navy">وضعیت کلی</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            ['مدرسین', stats.instructors],
                            ['کوچ‌ها', stats.coaches],
                            ['سفارش‌های موفق', stats.orders],
                            ['جلسات کوچینگ', stats.sessions],
                            ['کاربران فعال', stats.activeUsers],
                            ['کل لیدها', stats.leads],
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-2xl bg-soft-gray p-4">
                                <div className="text-xl font-black text-navy">{formatNumber(value as number)}</div>
                                <div className="mt-1 text-xs font-bold text-navy/45">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = (page: ReactNode) => <AdminLayout title="داشبورد">{page}</AdminLayout>;
