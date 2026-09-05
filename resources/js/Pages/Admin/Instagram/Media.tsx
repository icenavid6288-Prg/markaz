import { router, useForm, usePage } from '@inertiajs/react';
import { CalendarClock, ExternalLink, Film, Images, Image as ImageIcon, LayoutGrid, RefreshCw, Send, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InstagramGuide from '@/Components/Admin/InstagramGuide';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Media = {
    id: number; external_id: string; post_type: string; caption?: string | null;
    permalink?: string | null; media_url?: string | null; published_at?: string | null;
    scheduled_at?: string | null; status: string; error?: string | null;
};
type Paginator = { data: Media[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };

const postTypes = [
    { key: 'IMAGE', label: 'تصویر تکی', icon: ImageIcon, hint: 'یک عکس با کپشن — رایج‌ترین نوع پست.' },
    { key: 'VIDEO', label: 'ویدیو / ریلز', icon: Film, hint: 'فایل MP4 یا MOV؛ پردازش ویدیو در Meta ممکن است چند دقیقه طول بکشد.' },
    { key: 'CAROUSEL', label: 'کاروسل', icon: LayoutGrid, hint: 'تا ۱۰ عکس یا ویدیو؛ کاربر بین اسلایدها می‌چرخد.' },
] as const;

const statusStyles: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700',
    scheduled: 'bg-sky-50 text-sky-700',
    failed: 'bg-red-50 text-red-600',
};
const statusLabels: Record<string, string> = { published: 'منتشرشده', scheduled: 'زمان‌بندی‌شده', failed: 'ناموفق' };

export default function InstagramMedia() {
    const { media, configured } = usePage<PageProps & { media: Paginator; configured: boolean }>().props;
    const [postType, setPostType] = useState<'IMAGE' | 'VIDEO' | 'CAROUSEL'>('IMAGE');
    const [schedule, setSchedule] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const form = useForm({
        post_type: 'IMAGE' as string, media_files: [] as File[],
        image_url: '', video_url: '', caption: '', scheduled_at: '',
    });
    const captionLength = form.data.caption.length;
    const previews = useMemo(() => form.data.media_files.map((file) => ({ name: file.name, url: URL.createObjectURL(file), isVideo: file.type.startsWith('video/') })), [form.data.media_files]);
    const minSchedule = useMemo(() => new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16), []);

    const changeType = (key: 'IMAGE' | 'VIDEO' | 'CAROUSEL') => { setPostType(key); form.setData('post_type', key); };
    const pickFiles = (files: FileList | null) => {
        const picked = files ? Array.from(files) : [];
        const max = postType === 'CAROUSEL' ? 10 : 1;
        form.setData((data) => ({ ...data, media_files: picked.slice(0, max) }));
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/instagram/media/publish', { forceFormData: true, preserveScroll: true, onSuccess: () => { form.reset(); setSchedule(false); if (fileRef.current) fileRef.current.value = ''; } });
    };
    const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/instagram" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700">بازگشت به Inbox</a>
            <h1 className="mt-3 text-2xl font-black text-navy">انتشار محتوای اینستاگرام</h1>
            <p className="mt-2 text-sm text-navy/50">پست تصویری، ویدیو یا کاروسل بسازید، همین حالا منتشر کنید یا زمان انتشار آینده را تعیین کنید.</p>
        </div>

        <InstagramGuide
            steps={[
                { title: 'نوع پست را انتخاب کنید', text: 'تصویر تکی، ویدیو یا کاروسل. برای کاروسل حداقل دو فایل لازم است (تا ۱۰ فایل).' },
                { title: 'رسانه را بارگذاری کنید', text: 'فایل را از دستگاه انتخاب کنید یا اگر فایل از قبل روی هاست عمومی است، آدرس مستقیم آن (https) را وارد کنید.' },
                { title: 'کپشن بنویسید', text: 'متن پست تا ۲۲۰۰ کاراکتر. هشتگ‌ها را در انتهای متن بگذارید تا در جستجوی اینستاگرام دیده شوید.' },
                { title: 'انتشار یا زمان‌بندی', text: '«انتشار در اینستاگرام» پست را همان لحظه می‌فرستد؛ با فعال‌کردن «زمان‌بندی»، پست سر وقت مقرر به‌صورت خودکار منتشر می‌شود.' },
                { title: 'نتیجه را در تاریخچه ببینید', text: 'وضعیت هر پست، لینک پست منتشرشده و متن خطای پست‌های ناموفق (با امکان تلاش دوباره) همین‌جا قابل بررسی است.' },
            ]}
            hints={[
                'تصویر حداکثر ۸ مگابایت (JPG/PNG/WebP) و ویدیو حداکثر ۶۰ مگابایت (MP4/MOV) — این محدودیت Graph API متاست.',
                'فایل‌های بارگذاری‌شده از دامنه عمومی سایت به متا معرفی می‌شوند؛ در محیط لوکال بدون دامنه عمومی، انتشار واقعی ممکن نیست.',
                'ویدیوهای طولانی گاهی در Meta در صف پردازش می‌مانند؛ اگر انتشار ویدیو خطا داد، چند دقیقه بعد دکمه «تلاش دوباره» را بزنید.',
            ]}
        />

        {!configured && <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><TriangleAlert className="mt-0.5 size-5 shrink-0" /><div><strong className="text-sm font-black">اتصال اینستاگرام کامل نیست.</strong><p className="mt-1 text-xs leading-6 text-amber-900/70">می‌توانید پست را آماده یا زمان‌بندی کنید، اما انتشار واقعی فقط بعد از تکمیل اتصال متا انجام می‌شود. <a href="/admin/settings/instagram" className="font-black underline">تنظیم اتصال</a></p></div></section>}

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <div className="grid gap-3 sm:grid-cols-3">
                {postTypes.map((type) => {
                    const active = postType === type.key;
                    const Icon = type.icon;
                    return <button key={type.key} type="button" onClick={() => changeType(type.key)} className={`rounded-2xl border p-4 text-right transition ${active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-navy/10 bg-white hover:border-brand-300'}`}>
                        <div className="flex items-center gap-2 text-sm font-black text-navy"><Icon className={`size-5 ${active ? 'text-brand-600' : 'text-navy/40'}`} /> {type.label}</div>
                        <p className="mt-1.5 text-[0.68rem] leading-5 text-navy/50">{type.hint}</p>
                    </button>;
                })}
            </div>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
                <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-xs font-black text-navy/70">
                        <span>{postType === 'CAROUSEL' ? 'فایل‌ها (حداقل ۲ و حداکثر ۱۰)' : 'فایل'}</span>
                        {form.data.media_files.length > 0 && <span className="text-brand-700">{form.data.media_files.length} فایل انتخاب شد</span>}
                    </span>
                    <input ref={fileRef} type="file" accept={postType === 'VIDEO' ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp'} multiple={postType === 'CAROUSEL'} onChange={(event) => pickFiles(event.target.files)} className="w-full cursor-pointer rounded-xl border border-dashed border-navy/20 bg-soft-gray/40 px-4 py-3 text-sm text-navy/60 file:ml-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-xs file:font-black file:text-white" />
                    {form.errors['media_files.0'] && <span className="mt-1 block text-xs font-bold text-red-600">{form.errors['media_files.0']}</span>}
                </label>

                {previews.length > 0 && <div className="flex flex-wrap gap-3">{previews.map((preview) => <div key={preview.name} className="relative overflow-hidden rounded-xl border border-navy/10">{preview.isVideo ? <video src={preview.url} className="size-28 object-cover" muted /> : <img src={preview.url} alt={preview.name} className="size-28 object-cover" />}</div>)}</div>}

                {postType !== 'CAROUSEL' && <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-navy/70">یا آدرس عمومی رسانه</span>
                    <input type="url" dir="ltr" value={postType === 'VIDEO' ? form.data.video_url : form.data.image_url} onChange={(event) => form.setData(postType === 'VIDEO' ? 'video_url' : 'image_url', event.target.value)} className={inputClass} placeholder="https://example.com/..." />
                    <span className="mt-1 block text-[0.68rem] text-navy/40">اگر فایل بارگذاری کنید، این فیلد نادیده گرفته می‌شود. آدرس باید برای سرورهای متا قابل دریافت باشد.</span>
                </label>}

                <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-xs font-black text-navy/70"><span>کپشن پست</span><span className={captionLength > 2200 ? 'text-red-600' : 'text-navy/40'} dir="ltr">{captionLength}/2200</span></span>
                    <textarea rows={5} value={form.data.caption} onChange={(event) => form.setData('caption', event.target.value)} className={inputClass} placeholder="متن پست... #دوره #مشاوره" />
                    <span className="mt-1 block text-[0.68rem] text-navy/40">نکته: هشتگ‌ها را آخر کپشن بگذارید؛ ۳ تا ۵ هشتگ مرتبط معمولاً بهترین نتیجه را می‌دهد.</span>
                </label>

                <div className="rounded-xl border border-navy/10 bg-soft-gray/40 p-4">
                    <label className="flex items-center gap-2 text-xs font-black text-navy/70"><input type="checkbox" checked={schedule} onChange={(event) => setSchedule(event.target.checked)} className="rounded border-navy/20 text-brand-600" /><CalendarClock className="size-4 text-brand-600" /> انتشار در زمان مشخص (زمان‌بندی)</label>
                    {schedule && <div className="mt-3">
                        <input type="datetime-local" required min={minSchedule} value={form.data.scheduled_at} onChange={(event) => form.setData('scheduled_at', event.target.value)} className={inputClass} />
                        <span className="mt-1 block text-[0.68rem] text-navy/40">پست‌های زمان‌بندی‌شده هر ۵ دقیقه توسط زمان‌بر برنامه بررسی و منتشر می‌شوند؛ برای دقت بیشتر، زمان را حداقل ۵ دقیقه بعد انتخاب کنید.</span>
                    </div>}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" loading={form.processing}>{schedule ? <><CalendarClock className="size-4" /> ثبت زمان‌بندی</> : <><Send className="size-4" /> انتشار در اینستاگرام</>}</Button>
                    {form.errors.caption && <span className="text-xs font-bold text-red-600">{form.errors.caption}</span>}
                </div>
            </form>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-black text-navy"><Images className="size-5 text-brand-600" /> تاریخچه انتشار</div>
                <span className="text-xs font-bold text-navy/40">{media.total} مورد</span>
            </div>
            <div className="divide-y divide-navy/5">
                {media.data.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 p-5">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-soft-gray">
                        {item.media_url ? <img src={item.media_url} alt="" className="size-full object-cover" /> : item.post_type === 'VIDEO' ? <Film className="size-5 text-navy/30" /> : <ImageIcon className="size-5 text-navy/30" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-black text-navy">{item.caption ? item.caption.slice(0, 60) : 'بدون کپشن'}</strong>
                            <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/50">{postTypes.find((type) => type.key === item.post_type)?.label ?? item.post_type}</span>
                            <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${statusStyles[item.status] ?? 'bg-soft-gray text-navy/50'}`}>{statusLabels[item.status] ?? item.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-navy/45">{item.status === 'scheduled' ? `انتشار: ${item.scheduled_at ?? '—'}` : `منتشرشده: ${item.published_at ?? '—'} · ${item.external_id}`}</p>
                        {item.error && <p className="mt-1.5 text-xs font-bold text-red-600">{item.error}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {item.status === 'published' && item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer" title="مشاهده در اینستاگرام" className="flex size-9 items-center justify-center rounded-lg bg-soft-gray text-brand-700 hover:bg-brand-50"><ExternalLink className="size-4" /></a>}
                        {item.status === 'failed' && <button type="button" onClick={() => router.post(`/admin/instagram/media/${item.id}/retry`, {}, { preserveScroll: true })} title="تلاش دوباره" className="flex size-9 items-center justify-center rounded-lg bg-soft-gray text-brand-700 hover:bg-brand-50"><RefreshCw className="size-4" /></button>}
                        <button type="button" onClick={() => confirm('این مورد از تاریخچه حذف شود؟') && router.delete(`/admin/instagram/media/${item.id}`, { preserveScroll: true })} title="حذف" className="flex size-9 items-center justify-center rounded-lg bg-soft-gray text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></button>
                    </div>
                </div>)}
                {media.data.length === 0 && <p className="p-12 text-center text-xs font-bold text-navy/45">هنوز محتوایی منتشر یا زمان‌بندی نشده است؛ اولین پست را از فرم بالا بسازید.</p>}
            </div>
        </section>
    </div>;
}

InstagramMedia.layout = (page: ReactNode) => <AdminLayout title="رسانه‌های Instagram">{page}</AdminLayout>;
