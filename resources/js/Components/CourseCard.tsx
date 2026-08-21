import { Clock, PlayCircle, Star, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/Components/ui/Badge';
import { formatDuration, formatNumber, formatPrice } from '@/lib/format';

export interface CourseCardData {
    id: number;
    title: string;
    subtitle?: string | null;
    slug: string;
    thumbnail?: string | null;
    level: string;
    price: number;
    discount_price?: number | null;
    duration_minutes: number;
    students_count: number;
    rating_avg: number;
    progress_percent?: number;
    instructor?: { user?: { name?: string } } | null;
}

const levelLabels: Record<string, string> = {
    beginner: 'مقدماتی',
    intermediate: 'متوسط',
    advanced: 'پیشرفته',
};

export function CourseCard({ course }: { course: CourseCardData }) {
    const finalPrice = course.discount_price ?? course.price;
    const hasDiscount = course.discount_price !== null && course.discount_price !== undefined;

    return (
        <Link
            href={`/courses/${course.slug}`}
            prefetch="hover"
            className="liquid-card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
        >
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="liquid-blob blob-b" aria-hidden />
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-100 to-emerald-50">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-brand-400">
                        <PlayCircle className="size-14 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute right-3 top-3 flex gap-2">
                    <Badge tone="navy">{levelLabels[course.level] ?? course.level}</Badge>
                    {hasDiscount && <Badge tone="gold">تخفیف</Badge>}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="line-clamp-2 text-base font-black leading-7 text-navy transition-colors group-hover:text-brand-700">
                    {course.title}
                </h3>
                {course.subtitle && (
                    <p className="line-clamp-2 text-sm leading-6 text-navy/55">{course.subtitle}</p>
                )}

                <div className="mt-auto flex items-center gap-4 text-xs font-medium text-navy/50">
                    {course.duration_minutes > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> {formatDuration(course.duration_minutes)}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {formatNumber(course.students_count)} دانش‌آموز
                    </span>
                    {course.rating_avg > 0 && (
                        <span className="flex items-center gap-1 text-gold">
                            <Star className="size-3.5 fill-gold" /> {formatNumber(course.rating_avg)}
                        </span>
                    )}
                </div>

                <div className="flex items-end justify-between border-t border-navy/5 pt-4">
                    <div className="flex flex-col">
                        {hasDiscount && (
                            <span className="text-xs text-navy/40 line-through">
                                {formatPrice(course.price)}
                            </span>
                        )}
                        <span className="text-lg font-black text-brand-700">
                            {formatPrice(finalPrice)}
                        </span>
                    </div>
                    <span className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-glow transition-all duration-200 group-hover:bg-brand-700">
                        مشاهده دوره
                    </span>
                </div>
            </div>
        </Link>
    );
}
