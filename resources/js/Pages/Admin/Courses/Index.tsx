import { Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { formatPrice, toFa } from '@/lib/format';
import type { PageProps } from '@/types';

interface CourseRow {
    id: number;
    title: string;
    slug: string;
    level: string;
    price: number;
    discount_price: number | null;
    is_published: boolean;
    is_featured: boolean;
    is_in_person: boolean;
    students_count: number;
    instructor?: { user?: { name?: string } } | null;
    category?: { name?: string } | null;
}

const levelLabels: Record<string, string> = { beginner: 'مقدماتی', intermediate: 'متوسط', advanced: 'پیشرفته' };

export default function CoursesIndex() {
    const { courses, filters } = usePage<
        PageProps & {
            courses: {
                data: CourseRow[];
                links: Array<{ url: string | null; label: string; active: boolean }>;
                total: number;
            };
            filters: { search?: string; status?: string };
        }
    >().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = () => {
        router.get('/admin/courses', { search, status }, { preserveState: true, replace: true });
    };

    const destroy = (course: CourseRow) => {
        if (confirm(`آیا از حذف دوره «${course.title}» مطمئن هستید؟`)) {
            router.delete(`/admin/courses/${course.id}`);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" aria-hidden />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="جستجوی دوره..."
                            className="w-56 rounded-xl border border-navy/10 bg-white py-2.5 pl-3 pr-9 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get('/admin/courses', { search, status: e.target.value }, { preserveState: true, replace: true });
                        }}
                        className="rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none"
                    >
                        <option value="">همه وضعیت‌ها</option>
                        <option value="published">منتشرشده</option>
                        <option value="draft">پیش‌نویس</option>
                    </select>
                </div>
                <Link
                    href="/admin/courses/create"
                    className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600"
                >
                    <Plus className="size-4" aria-hidden /> دوره جدید
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-right">
                        <thead>
                            <tr className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/50">
                                <th className="px-5 py-3.5">دوره</th>
                                <th className="px-5 py-3.5">دسته‌بندی</th>
                                <th className="px-5 py-3.5">مدرس</th>
                                <th className="px-5 py-3.5">سطح</th>
                                <th className="px-5 py-3.5">قیمت</th>
                                <th className="px-5 py-3.5">دانش‌آموزان</th>
                                <th className="px-5 py-3.5">وضعیت</th>
                                <th className="px-5 py-3.5">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.data.map((course) => (
                                <tr key={course.id} className="border-b border-navy/5 text-sm transition-colors last:border-0 hover:bg-soft-gray/50">
                                    <td className="px-5 py-4">
                                        <div className="font-black text-navy">{course.title}</div>
                                        <div className="text-xs text-navy/40" dir="ltr">{course.slug}</div>
                                    </td>
                                    <td className="px-5 py-4 text-navy/60">{course.category?.name ?? '—'}</td>
                                    <td className="px-5 py-4 text-navy/60">{course.instructor?.user?.name ?? '—'}</td>
                                    <td className="px-5 py-4">
                                        <Badge tone="navy">{levelLabels[course.level]}</Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-black text-brand-700">{formatPrice(course.discount_price ?? course.price)}</div>
                                        {course.discount_price && (
                                            <div className="text-xs text-navy/35 line-through">{formatPrice(course.price)}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-navy/60">{toFa(course.students_count)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            {course.is_published ? <Badge tone="green">منتشرشده</Badge> : <Badge tone="gray">پیش‌نویس</Badge>}
                                            {course.is_featured && <Badge tone="gold">ویژه</Badge>}
                                            {course.is_in_person && <Badge tone="navy">حضوری</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={`/admin/courses/${course.id}/edit`}
                                                className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 transition-colors hover:bg-brand-100 hover:text-brand-700"
                                                aria-label="ویرایش"
                                            >
                                                <Pencil className="size-3.5" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => destroy(course)}
                                                className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 transition-colors hover:bg-red-50 hover:text-red-600"
                                                aria-label="حذف"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {courses.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-navy/45">
                                        دوره‌ای یافت نشد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {courses.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                        {courses.links.map((link, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                    link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

CoursesIndex.layout = (page: ReactNode) => <AdminLayout title="مدیریت دوره‌ها">{page}</AdminLayout>;
