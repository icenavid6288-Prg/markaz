import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Award, Bookmark, CheckCircle2, ChevronLeft, CirclePlay, ClipboardList, Clock3, FileText, ListChecks, LockKeyhole, Paperclip, Play, RotateCcw, Send, Sparkles, StickyNote, XCircle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDuration, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface QuizQuestion { id: number; type: string; question: string; options: string[]; score: number; }
interface Quiz { id: number; title: string; description: string | null; passing_score: number; time_limit_minutes: number | null; questions_count: number; attempts_count: number; in_progress: boolean; in_progress_attempt_id?: number | null; last_attempt?: { id: number; score: number; passed: boolean; submitted_at: string } | null; questions?: QuizQuestion[]; }
interface Assignment { id: number; title: string; description: string | null; max_score: number; due_days: number | null; submission?: { id: number; content: string | null; attachment: string | null; attachment_url: string | null; status: string; score: number | null; feedback: string | null; submitted_at: string } | null; }
interface Lesson { id: number; title: string; type: string; duration_minutes?: number | null; is_free: boolean; locked?: boolean; progress_percent: number; status?: string | null; video_url?: string | null; video_type?: string | null; content?: string | null; attachments?: Array<{ title?: string; url?: string }> | null; quiz?: Quiz | null; assignment?: Assignment | null }
interface Module { id: number; title: string; lessons: Lesson[] }
interface PlayerProps { course: { id: number; title: string; slug: string; thumbnail?: string | null }; enrollment: { preview?: boolean; progress_percent: number; certificate?: { number: string; url: string } | null }; lessons: Module[]; currentLesson: Lesson; note?: string | null; bookmarked?: boolean }

export default function Player() {
    const { course, enrollment, lessons, currentLesson, note = '', bookmarked = false } = usePage<PageProps & PlayerProps>().props;
    const [activeId, setActiveId] = useState(currentLesson.id);
    const [saving, setSaving] = useState(false);
    const [noteText, setNoteText] = useState(note ?? '');
    const allLessons = useMemo(() => lessons.flatMap((module) => module.lessons), [lessons]);
    // The active lesson is re-derived from the props each render so quiz
    // attempts, results and lock states stay fresh after each server round trip.
    const active = allLessons.find((lesson) => lesson.id === activeId) ?? allLessons.find((lesson) => lesson.id === currentLesson.id) ?? currentLesson;
    const nextLesson = allLessons[allLessons.findIndex((lesson) => lesson.id === active.id) + 1];

    const selectLesson = (lesson: Lesson) => {
        if (lesson.locked) return;
        setActiveId(lesson.id);
        router.get(`/dashboard/courses/${course.slug}/learn/${lesson.id}`, {}, { preserveScroll: true, preserveState: false });
    };

    const complete = () => {
        setSaving(true);
        router.post(`/dashboard/courses/${course.slug}/lessons/${active.id}/progress`, { progress_percent: 100, status: 'completed' }, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-xs font-black text-brand-700"><ArrowRight className="size-4" /> بازگشت به دوره‌های من</Link><h1 className="mt-3 text-2xl font-black text-navy">{course.title}</h1></div><div className="rounded-2xl bg-brand-50 px-4 py-3 text-xs font-black text-brand-700">پیشرفت دوره: {formatNumber(enrollment.progress_percent)}٪</div></header>
            {enrollment.progress_percent === 100 && <section className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 shadow-soft ${enrollment.certificate ? 'border-gold/40 bg-gradient-to-l from-gold/15 via-white/90 to-brand-50' : 'border-emerald-100 bg-emerald-50/70'}`}><div className="flex items-center gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-white shadow-glow"><Award className="size-6" /></span><div><h2 className="text-sm font-black text-navy">تبریک! دوره را با موفقیت کامل کردید</h2><p className="mt-1 text-xs font-bold text-navy/55">{enrollment.certificate ? `گواهینامه پایان دوره شما با شماره ${enrollment.certificate.number} صادر شد.` : 'همه درس‌های این دوره را به پایان رساندید.'}</p></div></div>{enrollment.certificate && <Link href={enrollment.certificate.url} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700"><Award className="size-4" /> مشاهده گواهینامه</Link>}</section>}
            <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
                <aside className="order-2 rounded-3xl border border-white/80 bg-white/85 p-3 shadow-soft lg:order-1"><div className="px-3 py-3"><div className="flex items-center gap-2 text-xs font-black text-brand-700"><Sparkles className="size-4" /> نقشه یادگیری</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-soft-gray"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${enrollment.progress_percent}%` }} /></div></div><div className="max-h-[38rem] space-y-4 overflow-y-auto p-1">{lessons.map((module) => <div key={module.id}><h2 className="px-3 text-xs font-black text-navy/50">{module.title}</h2><div className="mt-2 space-y-1">{module.lessons.map((lesson) => <button key={lesson.id} type="button" disabled={lesson.locked} onClick={() => selectLesson(lesson)} title={lesson.locked ? 'برای دسترسی، درس قبلی (ویدیو/پادکست) را کامل تماشا کنید یا آزمون را با موفقیت پاس کنید' : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right transition-colors ${active.id === lesson.id ? 'bg-brand-50 text-brand-800' : lesson.locked ? 'cursor-not-allowed text-navy/30' : 'text-navy/65 hover:bg-soft-gray'}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${lesson.locked ? 'bg-soft-gray text-navy/30' : 'bg-white text-brand-600'}`}>{lesson.locked ? <LockKeyhole className="size-3.5" /> : lesson.status === 'completed' ? <CheckCircle2 className="size-4" /> : lesson.quiz ? <ListChecks className="size-3.5" /> : lesson.assignment ? <ClipboardList className="size-3.5" /> : <Play className="size-3.5" />}</span><span className="min-w-0 flex-1 text-xs font-bold leading-5">{lesson.title}</span>{lesson.duration_minutes ? <span className="shrink-0 text-[0.6rem] text-navy/35">{formatDuration(lesson.duration_minutes)}</span> : null}</button>)}</div></div>)}</div></aside>
                <main className="order-1 min-w-0 space-y-5 lg:order-2">
                    <section className="overflow-hidden rounded-3xl bg-deep-gradient shadow-lift"><div className="flex aspect-video items-center justify-center bg-black/20">{active.quiz ? <div className="flex flex-col items-center gap-3 text-center text-white/70"><ListChecks className="size-14 text-brand-300" /><span className="text-sm font-bold">درس آزمون</span></div> : active.assignment ? <div className="flex flex-col items-center gap-3 text-center text-white/70"><ClipboardList className="size-14 text-brand-300" /><span className="text-sm font-bold">درس تکلیف</span></div> : active.video_url ? <video key={active.video_url} className="size-full object-contain" controls controlsList="nodownload" poster={course.thumbnail ?? undefined}><source src={active.video_url} /></video> : <div className="flex flex-col items-center gap-3 text-center text-white/70"><CirclePlay className="size-14 text-brand-300" /><span className="text-sm font-bold">این درس محتوای متنی دارد</span></div>}</div><div className="flex flex-wrap items-center justify-between gap-4 p-5 text-white"><div><div className="flex items-center gap-2 text-xs font-bold text-brand-200"><FileText className="size-4" /> درس جاری</div><h2 className="mt-2 text-xl font-black">{active.title}</h2></div><div className="flex items-center gap-2 text-xs font-bold text-white/55"><Clock3 className="size-4" /> {formatDuration(active.duration_minutes ?? 0)}</div></div></section>
                    {active.quiz && <QuizSection key={active.quiz.id} courseSlug={course.slug} lesson={active} />}
                    {active.assignment && <AssignmentSection key={active.assignment.id} courseSlug={course.slug} lesson={active} />}
                    <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-black text-brand-700"><StickyNote className="size-4" /> یادداشت و نشانک</div>
                            <button type="button" onClick={() => router.post(`/dashboard/courses/${course.slug}/lessons/${active.id}/bookmark`, {}, { preserveScroll: true })} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${bookmarked ? 'bg-gold/15 text-gold' : 'bg-brand-50 text-brand-700'}`}><Bookmark className="size-3.5" /> {bookmarked ? 'نشانک شده' : 'نشانک کردن'}</button>
                        </div>
                        <textarea rows={3} value={noteText} onChange={(event) => setNoteText(event.target.value)} className="mt-4 w-full rounded-2xl border border-navy/10 px-4 py-3 text-sm text-navy outline-none focus:border-brand-500" placeholder="نکته‌ای از این درس بنویسید..." />
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => router.post(`/dashboard/courses/${course.slug}/lessons/${active.id}/notes`, { content: noteText }, { preserveScroll: true })} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">ذخیره یادداشت</button>
                            {note && <button type="button" onClick={() => router.delete(`/dashboard/courses/${course.slug}/lessons/${active.id}/notes`, { preserveScroll: true })} className="rounded-xl border border-navy/10 px-4 py-2 text-xs font-black text-navy/50">حذف</button>}
                        </div>
                    </section>
                    {!active.quiz && !active.assignment && active.content && <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-soft md:p-7"><div className="flex items-center gap-2 text-xs font-black text-brand-700"><FileText className="size-4" /> جزوه درس</div><p className="mt-5 whitespace-pre-line text-sm leading-8 text-navy/70">{active.content}</p></section>}
                    {!active.quiz && !active.assignment && active.attachments && active.attachments.length > 0 && <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-soft"><h2 className="text-sm font-black text-navy">فایل‌های پیوست</h2><div className="mt-3 flex flex-wrap gap-2">{active.attachments.map((file, index) => file.url ? <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700"><Send className="size-3.5" /> {file.title ?? 'دریافت فایل'}</a> : null)}</div></section>}
                    {!active.quiz && <div className="flex flex-wrap items-center justify-between gap-3">{enrollment.preview ? <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white">ثبت‌نام برای ادامه دوره</Link> : !active.assignment ? <button type="button" onClick={complete} disabled={saving || active.status === 'completed'} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="size-4" /> {active.status === 'completed' ? 'درس تکمیل شده' : saving ? 'در حال ذخیره...' : 'علامت‌گذاری به‌عنوان تکمیل‌شده'}</button> : <span className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-navy/15 px-5 py-3 text-xs font-bold text-navy/50"><ClipboardList className="size-4" /> تکمیل این درس با ارسال تکلیف انجام می‌شود</span>}{nextLesson ? (nextLesson.locked ? <span className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-navy/15 px-5 py-3 text-xs font-bold text-navy/40"><LockKeyhole className="size-4" /> ابتدا این درس را کامل تماشا کنید</span> : <button type="button" onClick={() => selectLesson(nextLesson)} className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 px-5 py-3 text-sm font-black text-brand-700 hover:bg-brand-50">درس بعدی <ChevronLeft className="size-4" /></button>) : <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-4" /> پایان سرفصل‌های دوره</span>}</div>}
                </main>
            </div>
        </div>
    </UserDashboardLayout>;
}

function QuizSection({ courseSlug, lesson }: { courseSlug: string; lesson: Lesson }) {
    const quiz = lesson.quiz!;
    const [answers, setAnswers] = useState<Record<number, string[]>>({});
    const [submitting, setSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const questions = quiz.questions ?? [];

    const start = () => router.post(`/dashboard/courses/${courseSlug}/lessons/${lesson.id}/quiz/start`, {}, { preserveScroll: true });
    const toggleAnswer = (questionId: number, optionIndex: string) => {
        const question = questions.find((q) => q.id === questionId);
        const current = answers[questionId] ?? [];
        const next = question?.type === 'multiple'
            ? (current.includes(optionIndex) ? current.filter((v) => v !== optionIndex) : [...current, optionIndex])
            : [optionIndex];
        setAnswers({ ...answers, [questionId]: next });
    };
    const submit = () => {
        if (!quiz.in_progress_attempt_id) return;
        setSubmitting(true);
        router.post(`/dashboard/courses/${courseSlug}/lessons/${lesson.id}/quiz/attempts/${quiz.in_progress_attempt_id}`, { answers }, { preserveScroll: true, onFinish: () => setSubmitting(false) });
    };

    // Result screen — a submitted attempt exists.
    if (quiz.last_attempt && !quiz.in_progress) {
        const passed = quiz.last_attempt.passed;
        return <section className={`rounded-3xl border p-6 shadow-soft md:p-8 ${passed ? 'border-emerald-100 bg-emerald-50/70' : 'border-amber-100 bg-amber-50/70'}`}>
            <div className="flex flex-col items-center gap-4 text-center">
                <span className={`flex size-16 items-center justify-center rounded-3xl shadow-lift ${passed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{passed ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}</span>
                <div><h2 className="text-xl font-black text-navy">{passed ? 'تبریک! آزمون را با موفقیت پاس کردید' : 'این بار قبول نشدید؛ دوباره تلاش کنید'}</h2><p className="mt-1 text-sm font-bold text-navy/55">نمره شما: <span className="text-navy">{quiz.last_attempt.score} از ۱۰۰</span> · نمره قبولی {quiz.passing_score}٪ · ثبت‌شده در {quiz.last_attempt.submitted_at}</p>{passed && <p className="mt-2 text-xs font-bold text-emerald-700">درس «{lesson.title}» تکمیل شد و درس‌های بعدی باز شدند.</p>}</div>
                <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700"><RotateCcw className="size-4" /> تلاش مجدد</button>
            </div>
        </section>;
    }

    // Taking screen — an attempt is open. One question per page: the student
    // must answer the current question before the next one is shown.
    if (quiz.in_progress) {
        const question = questions[currentIndex];
        const answeredCount = Object.keys(answers).length;
        const isLast = currentIndex === questions.length - 1;
        const canAdvance = question !== undefined && (answers[question.id] ?? []).length > 0;

        const next = () => {
            if (!canAdvance) return;
            if (isLast) {
                submit();
            } else {
                setCurrentIndex(currentIndex + 1);
            }
        };

        return <section className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-soft md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-navy">{quiz.title}</h2><p className="mt-1 text-xs font-bold text-navy/50">{questions.length} سؤال · نمره قبولی {quiz.passing_score}٪{quiz.time_limit_minutes ? ` · مهلت ${quiz.time_limit_minutes} دقیقه` : ''}</p></div><span className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700">سؤال {currentIndex + 1} از {questions.length}</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft-gray"><span className="block h-full rounded-full bg-brand-600 transition-all" style={{ width: `${((answeredCount) / Math.max(1, questions.length)) * 100}%` }} /></div>
            {question && <div className="mt-6 rounded-2xl border border-navy/10 bg-soft-gray/35 p-5">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-black leading-7 text-navy">سؤال {currentIndex + 1} — {question.question}</p><span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[0.65rem] font-black text-navy/45 ring-1 ring-navy/10">{question.score} امتیاز</span></div>
                <div className="mt-4 flex flex-col gap-2">{(question.options ?? []).map((option, optionIndex) => option.trim() === '' ? null : <button key={optionIndex} type="button" onClick={() => toggleAnswer(question.id, String(optionIndex))} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition-colors ${(answers[question.id] ?? []).includes(String(optionIndex)) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-navy/10 bg-white text-navy/65 hover:border-brand-300'}`}><span className={`flex size-5 shrink-0 items-center justify-center rounded-md border text-[0.65rem] font-black ${(answers[question.id] ?? []).includes(String(optionIndex)) ? 'border-brand-600 bg-brand-600 text-white' : 'border-navy/20 text-transparent'}`}>{question.type === 'multiple' ? '☑' : '✓'}</span>{option}</button>)}</div>
            </div>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-xs font-black text-navy/55 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40">سؤال قبلی</button>
                <p className="text-xs font-bold text-navy/45">{answeredCount} از {questions.length} سؤال پاسخ داده شده است</p>
                <button type="button" onClick={next} disabled={submitting || !canAdvance} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" /> {submitting ? 'در حال ثبت...' : isLast ? 'ثبت پاسخ‌ها' : 'سؤال بعدی'}</button>
            </div>
        </section>;
    }

    // Intro screen — no attempt yet.
    return <section className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-soft md:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-deep-gradient text-white shadow-lift"><ListChecks className="size-9" /></span>
            <div><h2 className="text-xl font-black text-navy">{quiz.title}</h2>{quiz.description && <p className="mx-auto mt-2 max-w-xl whitespace-pre-line text-sm leading-7 text-navy/60">{quiz.description}</p>}</div>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-black">{['سؤال‌ها: '+formatNumber(quiz.questions_count), 'نمره قبولی: '+formatNumber(quiz.passing_score)+'٪', quiz.time_limit_minutes ? `مهلت: ${quiz.time_limit_minutes} دقیقه` : 'بدون محدودیت زمان', quiz.attempts_count > 0 ? `تلاش‌های قبلی: ${formatNumber(quiz.attempts_count)}` : 'اولین تلاش'].map((stat) => <span key={stat} className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">{stat}</span>)}</div>
            <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700">شروع آزمون</button>
        </div>
    </section>;
}

function AssignmentSection({ courseSlug, lesson }: { courseSlug: string; lesson: Lesson }) {
    const assignment = lesson.assignment!;
    const [content, setContent] = useState(assignment.submission?.content ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const submission = assignment.submission ?? null;

    const submit = () => {
        if (submitting) return;
        setSubmitting(true);
        const data = new FormData();
        if (content.trim() !== '') data.append('content', content);
        if (file) data.append('attachment', file);
        router.post(`/dashboard/courses/${courseSlug}/lessons/${lesson.id}/assignment/submit`, data, { preserveScroll: true, onFinish: () => setSubmitting(false) });
    };

    // Graded — the score and feedback are final.
    if (submission?.status === 'graded') {
        return <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-soft md:p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <span className="flex size-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lift"><CheckCircle2 className="size-9" /></span>
                <div><h2 className="text-xl font-black text-navy">تکلیف تصحیح شد</h2><p className="mt-1 text-sm font-bold text-navy/55">نمره شما: <span className="text-navy">{submission.score} از {assignment.max_score}</span> · تصحیح‌شده در {submission.submitted_at}</p></div>
            </div>
            {submission.content && <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5"><div className="text-xs font-black text-navy/45">پاسخ شما</div><p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/70">{submission.content}</p></div>}
            {submission.attachment_url && <a href={submission.attachment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-brand-700 ring-1 ring-navy/10 hover:bg-brand-50"><Paperclip className="size-3.5" /> دریافت فایل ارسال‌شده</a>}
            {submission.feedback && <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-5"><div className="text-xs font-black text-brand-700">بازخورد مدرس</div><p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/70">{submission.feedback}</p></div>}
        </section>;
    }

    // Submitted, awaiting grading.
    if (submission) {
        return <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6 shadow-soft md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lift"><Clock3 className="size-7" /></span><div><h2 className="text-lg font-black text-navy">در انتظار تصحیح</h2><p className="mt-1 text-xs font-bold text-navy/55">تکلیف شما در {submission.submitted_at} ثبت شد و پس از تصحیح، نمره و بازخورد همین‌جا نمایش داده می‌شود.</p></div></div>
                {!editing && <button type="button" onClick={() => { setEditing(true); setContent(submission.content ?? ''); }} className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-black text-brand-700 hover:bg-brand-50"><RotateCcw className="size-3.5" /> ارسال نسخه جدید</button>}
            </div>
            {submission.content && <div className="mt-5 rounded-2xl border border-navy/10 bg-white p-5"><div className="text-xs font-black text-navy/45">پاسخ شما</div><p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/70">{submission.content}</p></div>}
            {submission.attachment_url && <a href={submission.attachment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-brand-700 ring-1 ring-navy/10 hover:bg-brand-50"><Paperclip className="size-3.5" /> دریافت فایل ارسال‌شده</a>}
            {editing && <SubmissionForm content={content} setContent={setContent} file={file} setFile={setFile} submitting={submitting} submit={submit} />}
        </section>;
    }

    // Intro — nothing submitted yet.
    return <section className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-soft md:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-deep-gradient text-white shadow-lift"><ClipboardList className="size-9" /></span>
            <div><h2 className="text-xl font-black text-navy">{assignment.title}</h2>{assignment.description && <p className="mx-auto mt-2 max-w-xl whitespace-pre-line text-sm leading-7 text-navy/60">{assignment.description}</p>}</div>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-black">{['حداکثر نمره: '+formatNumber(assignment.max_score), assignment.due_days ? `مهلت: ${assignment.due_days} روز از شروع دوره` : 'بدون مهلت مشخص'].map((stat) => <span key={stat} className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">{stat}</span>)}</div>
        </div>
        <SubmissionForm content={content} setContent={setContent} file={file} setFile={setFile} submitting={submitting} submit={submit} />
    </section>;
}

function SubmissionForm({ content, setContent, file, setFile, submitting, submit }: { content: string; setContent: (value: string) => void; file: File | null; setFile: (value: File | null) => void; submitting: boolean; submit: () => void }) {
    return <div className="mt-6 border-t border-navy/10 pt-6">
        <label className="mb-1.5 block text-xs font-black text-navy/70">پاسخ شما (متن)</label>
        <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="پاسخ خود را اینجا بنویسید..." className="w-full resize-y rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm leading-7 text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
        <label className="mt-4 mb-1.5 block text-xs font-black text-navy/70">پیوست (اختیاری — حداکثر ۱۰ مگابایت)</label>
        <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-2.5 text-xs font-black text-brand-700 transition-colors hover:bg-brand-50">
                <Paperclip className="size-3.5" /> {file ? file.name : 'انتخاب فایل'}
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && <button type="button" onClick={() => setFile(null)} className="text-xs font-bold text-red-600 hover:underline">حذف فایل</button>}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-navy/45">با ارسال تکلیف، این درس کامل می‌شود و درس‌های بعدی باز می‌شوند.</p>
            <button type="button" onClick={submit} disabled={submitting || (content.trim() === '' && !file)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" /> {submitting ? 'در حال ارسال...' : 'ارسال تکلیف'}</button>
        </div>
    </div>;
}

Player.layout = (page: ReactNode) => page;
