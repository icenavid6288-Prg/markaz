import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { PageHeader } from '@/Components/ui/PageHeader';

interface Section {
    type: string;
    title: string;
    body: string;
    image: string;
}

export default function CmsPageShow({ page }: { page: { title: string; slug: string; template: string; sections: Section[] } }) {
    return (
        <div>
            <Head title={page.title} />
            <PageHeader eyebrow="صفحه" title={page.title} />
            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="container-site mx-auto flex max-w-3xl flex-col gap-8">
                    {page.sections.length === 0 && <p className="text-sm font-bold text-navy/50">محتوایی برای این صفحه ثبت نشده است.</p>}
                    {page.sections.map((section, index) => (
                        <article key={`${section.title}-${index}`} className="liquid-card p-6">
                            {section.image && <img src={section.image} alt={section.title || page.title} className="mb-5 aspect-video w-full rounded-2xl object-cover" />}
                            {section.title && <h2 className="text-xl font-black text-navy">{section.title}</h2>}
                            {section.body && <p className="mt-3 whitespace-pre-line text-sm leading-8 text-navy/70">{section.body}</p>}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

CmsPageShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
