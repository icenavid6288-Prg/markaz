import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import ImageCropField from '@/Components/ImageCropField';
import { SeoGuide } from '@/Components/SeoGuide';
import type { PageProps } from '@/types';

interface CourseFormData {
    id: number;
    title: string;
    subtitle: string | null;
    slug: string;
    description: string | null;
    level: string;
    price: number;
    discount_price: number | null;
    duration_minutes: number;
    thumbnail: string | null;
    trailer_url: string | null;
    instructor_id: number | null;
    category_id: number | null;
    certificate_enabled: boolean;
    is_published: boolean;
    is_featured: boolean;
    seo: { title: string | null; description: string | null; keywords: string | null } | null;
    is_in_person?: boolean;
    location?: string | null;
    schedule?: Array<{ day: string; time: string; label: string }> | null;
    max_students?: number | null;
    in_person_description?: string | null;
}

interface CourseFormState {
    title: string;
    subtitle: string;
    slug: string;
    description: string;
    level: string;
    price: number;
    discount_price: number | string;
    duration_minutes: number;
    thumbnail: string;
    thumbnail_file: File | null;
    trailer_url: string;
    instructor_id: number | string;
    category_id: number | string;
    certificate_enabled: boolean;
    is_published: boolean;
    is_featured: boolean;
    is_in_person: boolean;
    location: string;
    schedule: Array<{ day: string; time: string; label: string }>;
    max_students: number | string;
    in_person_description: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
}

interface Option {
    id: number;
    name: string;
    user?: { name?: string };
}

export default function CourseForm() {
    const { course, categories, instructors } = usePage<
        PageProps & {
            course: CourseFormData | null;
            categories: Option[];
            instructors: Option[];
        }
    >().props;

    const isEdit = course !== null;

    const form = useForm<CourseFormState>({
        title: course?.title ?? '',
        subtitle: course?.subtitle ?? '',
        slug: course?.slug ?? '',
        description: course?.description ?? '',
        level: course?.level ?? 'beginner',
        price: course?.price ?? 0,
        discount_price: course?.discount_price ?? '',
        duration_minutes: course?.duration_minutes ?? 0,
        thumbnail: course?.thumbnail ?? '',
        thumbnail_file: null,
        trailer_url: course?.trailer_url ?? '',
        instructor_id: course?.instructor_id ?? '',
        category_id: course?.category_id ?? '',
        certificate_enabled: course?.certificate_enabled ?? true,
        is_published: course?.is_published ?? false,
        is_featured: course?.is_featured ?? false,
        is_in_person: course?.is_in_person ?? false,
        location: course?.location ?? '',
        schedule: (course?.schedule as Array<{ day: string; time: string; label: string }> | undefined) ?? [],
        max_students: course?.max_students ?? '',
        in_person_description: course?.in_person_description ?? '',
        seo_title: course?.seo?.title ?? '',
        seo_description: course?.seo?.description ?? '',
        seo_keywords: course?.seo?.keywords ?? '',
    });

    const generateSeo = () => {
        const title = form.data.subtitle
            ? `${form.data.title} | ${form.data.subtitle}`
            : form.data.title;
        const description = (form.data.description || '').replace(/\s+/g, ' ').trim();
        form.setData((data) => ({
            ...data,
            seo_title: title.slice(0, 70),
            seo_description: description.slice(0, 170) || title.slice(0, 160),
            seo_keywords: ['دوره آموزشی', form.data.level === 'beginner' ? 'دوره مقدماتی' : form.data.level === 'intermediate' ? 'دوره متوسط' : 'دوره پیشرفته', form.data.title].filter(Boolean).join('، ').slice(0, 200),
        }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            // POST + _method keeps image uploads compatible with PHP's multipart parser.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/courses/${course.id}`, { forceFormData: true });
        } else {
            form.post('/admin/courses', { forceFormData: true });
        }
    };

    const inputCls =
        'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700">
                    <ArrowRight className="size-4" /> بازگشت به لیست
                </Link>
                <Button type="submit" loading={form.processing}>
                    <Save className="size-4" aria-hidden />
                    {isEdit ? 'ذخیره تغییرات' : 'ایجاد دوره'}
                </Button>
            </div>

            {form.errors && Object.keys(form.errors).length > 0 && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                    لطفاً خطاهای فرم را بررسی کنید.
                </div>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <h2 className="mb-5 text-sm font-black text-navy">اطلاعات اصلی</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">عنوان دوره *</label>
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={inputCls} />
                        {form.errors.title && <p className="mt-1 text-xs text-red-600">{form.errors.title}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">زیرعنوان</label>
                        <input value={form.data.subtitle} onChange={(e) => form.setData('subtitle', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">اسلاگ (خالی = خودکار)</label>
                        <input value={form.data.slug} dir="ltr" onChange={(e) => form.setData('slug', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">سطح دوره</label>
                        <select value={form.data.level} onChange={(e) => form.setData('level', e.target.value)} className={inputCls}>
                            <option value="beginner">مقدماتی</option>
                            <option value="intermediate">متوسط</option>
                            <option value="advanced">پیشرفته</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">توضیحات</label>
                        <textarea
                            rows={5}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">دسته‌بندی</label>
                        <select value={String(form.data.category_id)} onChange={(e) => form.setData('category_id', e.target.value)} className={inputCls}>
                            <option value="">بدون دسته</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">مدرس</label>
                        <select value={String(form.data.instructor_id)} onChange={(e) => form.setData('instructor_id', e.target.value)} className={inputCls}>
                            <option value="">بدون مدرس</option>
                            {instructors.map((i) => (
                                <option key={i.id} value={i.id}>{i.user?.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <h2 className="mb-5 text-sm font-black text-navy">قیمت و رسانه</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">قیمت (تومان) *</label>
                        <input
                            type="number"
                            value={form.data.price}
                            onChange={(e) => form.setData('price', Number(e.target.value))}
                            className={inputCls}
                        />
                        {form.errors.price && <p className="mt-1 text-xs text-red-600">{form.errors.price}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">قیمت با تخفیف</label>
                        <input
                            type="number"
                            value={form.data.discount_price}
                            onChange={(e) => form.setData('discount_price', e.target.value === '' ? '' : Number(e.target.value))}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">مدت (دقیقه)</label>
                        <input
                            type="number"
                            value={form.data.duration_minutes}
                            onChange={(e) => form.setData('duration_minutes', Number(e.target.value))}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">آدرس تصویر (URL)</label>
                        <input value={form.data.thumbnail} dir="ltr" onChange={(e) => form.setData('thumbnail', e.target.value)} className={inputCls} placeholder="https://..." />
                        <p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">اگر تصویر را آپلود کنید، تصویر آپلودشده جایگزین این آدرس می‌شود.</p>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">بارگذاری تصویر دوره</label>
                        {course?.thumbnail && !form.data.thumbnail_file && (
                            <div className="mb-3 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3"><img src={course.thumbnail} alt="تصویر فعلی دوره" className="size-16 rounded-lg object-cover" /><span className="text-xs font-bold text-navy/55">تصویر فعلی دوره؛ با انتخاب تصویر جدید جایگزین می‌شود.</span></div>
                        )}
                        <ImageCropField
                            label="تصویر دوره"
                            value={form.data.thumbnail_file}
                            error={form.errors.thumbnail_file}
                            help="تصویر را انتخاب و برش دهید؛ PNG، JPG یا WEBP تا ۸ مگابایت."
                            onChange={(file) => form.setData('thumbnail_file', file)}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-navy/70">لینک تریلر (URL)</label>
                        <input value={form.data.trailer_url} dir="ltr" onChange={(e) => form.setData('trailer_url', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </section>

            <SeoGuide
                titleValue={form.data.seo_title}
                descriptionValue={form.data.seo_description}
                onGenerate={generateSeo}
            />

            <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <h2 className="mb-5 text-sm font-black text-navy">تنظیمات</h2>
                <div className="flex flex-wrap gap-6">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-navy/70">
                        <input
                            type="checkbox"
                            checked={form.data.is_published}
                            onChange={(e) => form.setData('is_published', e.target.checked)}
                            className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500"
                        />
                        منتشرشده
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-navy/70">
                        <input
                            type="checkbox"
                            checked={form.data.is_featured}
                            onChange={(e) => form.setData('is_featured', e.target.checked)}
                            className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500"
                        />
                        دوره ویژه
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-navy/70">
                        <input
                            type="checkbox"
                            checked={form.data.certificate_enabled}
                            onChange={(e) => form.setData('certificate_enabled', e.target.checked)}
                            className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500"
                        />
                        صدور گواهینامه
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-navy/70">
                        <input
                            type="checkbox"
                            checked={form.data.is_in_person}
                            onChange={(e) => form.setData('is_in_person', e.target.checked)}
                            className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500"
                        />
                        دوره حضوری
                    </label>
                </div>
            </section>

            {form.data.is_in_person && (
                <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <h2 className="mb-5 text-sm font-black text-navy">تنظیمات دوره حضوری</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-bold text-navy/70">آدرس محل برگزاری</label>
                            <input value={form.data.location} onChange={(e) => form.setData('location', e.target.value)} className={inputCls} placeholder="مثلاً: سالن ۳۰۱، ساختمان مرکز رشد" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-navy/70">حداکثر ظرفیت</label>
                            <input type="number" value={form.data.max_students} onChange={(e) => form.setData('max_students', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} placeholder="اختیاری" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-bold text-navy/70">توضیحات حضوری</label>
                            <textarea rows={3} value={form.data.in_person_description} onChange={(e) => form.setData('in_person_description', e.target.value)} className={inputCls} placeholder="اطلاعات تکمیلی درباره نحوه برگزاری کلاس حضوری..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-bold text-navy/70">زمان‌بندی کلاس‌ها</label>
                            <div className="flex flex-col gap-3">
                                {form.data.schedule.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input value={item.day} onChange={(e) => {
                                            const newSchedule = [...form.data.schedule];
                                            newSchedule[index] = { ...newSchedule[index], day: e.target.value };
                                            form.setData('schedule', newSchedule);
                                        }} className={inputCls} placeholder="مثلاً: شنبه" style={{ width: '120px' }} />
                                        <input value={item.time} onChange={(e) => {
                                            const newSchedule = [...form.data.schedule];
                                            newSchedule[index] = { ...newSchedule[index], time: e.target.value };
                                            form.setData('schedule', newSchedule);
                                        }} className={inputCls} placeholder="مثلاً: ۱۴:۰۰ - ۱۶:۰۰" style={{ width: '180px' }} />
                                        <input value={item.label} onChange={(e) => {
                                            const newSchedule = [...form.data.schedule];
                                            newSchedule[index] = { ...newSchedule[index], label: e.target.value };
                                            form.setData('schedule', newSchedule);
                                        }} className={inputCls} placeholder="عنوان (اختیاری)" style={{ width: '150px' }} />
                                        <button type="button" onClick={() => {
                                            form.setData('schedule', form.data.schedule.filter((_, i) => i !== index));
                                        }} className="text-xs font-bold text-red-600 hover:underline">حذف</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    form.setData('schedule', [...form.data.schedule, { day: '', time: '', label: '' }]);
                                }} className="self-start rounded-xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-2 text-xs font-black text-brand-700 hover:bg-brand-50">+ اضافه کردن جلسه</button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </form>
    );
}

CourseForm.layout = (page: ReactNode) => <AdminLayout title="فرم دوره">{page}</AdminLayout>;
