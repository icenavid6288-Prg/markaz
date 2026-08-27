import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUp,
    ChevronLeft,
    Clock3,
    Compass,
    GraduationCap,
    HeartHandshake,
    Home,
    Share2,
    Mail,
    MapPin,
    Menu as MenuIcon,
    Newspaper,
    Phone,
    Send,
    ShoppingBag,
    ShieldCheck,
    Sparkles,
    Users,
    UsersRound,
    UserRound,
    X,
    type LucideIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import CelebrateFlash from '@/Components/CelebrateFlash';
import FlashToast from '@/Components/FlashToast';
import ThemeToggle from '@/Components/ThemeToggle';
import SitePopup from '@/Components/SitePopup';
import ChatWidget from '@/Components/ChatWidget';
import MobileAppNav from '@/Components/MobileAppNav';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import { SeoHead } from '@/Components/SeoHead';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

const AuthModal = lazy(() => import('@/Components/AuthModal'));

function menuIconFor(url: string): LucideIcon {
    if (url === '/') return Home;
    if (url.startsWith('/courses')) return GraduationCap;
    if (url.startsWith('/coaching')) return HeartHandshake;
    if (url.startsWith('/services')) return Compass;
    if (url.startsWith('/shop')) return ShoppingBag;
    if (url.startsWith('/blog')) return Newspaper;
    if (url.startsWith('/about')) return Users;
    if (url.startsWith('/team')) return UsersRound;
    if (url.startsWith('/contact')) return Phone;
    return ChevronLeft;
}

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { site, menus, auth, seo, authModal: sharedAuthModal } = usePage<PageProps>().props;
    const [scrolled, setScrolled] = useState(false);
    const [atBottom, setAtBottom] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const y = window.scrollY;
                setScrolled(y > 140);
                const max = document.documentElement.scrollHeight - window.innerHeight;
                setAtBottom(max > 120 && max - y <= 36);
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen || authModal ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen, authModal]);

    useEffect(() => {
        if (sharedAuthModal) {
            setAuthModal(sharedAuthModal.mode ?? 'login');
        }
    }, [sharedAuthModal]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    };

    return (
        <>
            <SeoHead seo={seo} />
            <div className="mobile-app-shell flex min-h-screen flex-col bg-white" dir="rtl">
            <header className="site-header">
                <div className={`header-pill ${scrolled ? 'is-scrolled' : ''} ${atBottom ? 'is-at-end' : ''}`}>
                    <Link href="/" prefetch="hover" className="reference-logo flex items-center gap-2.5">
                        <BrandLogo className="reference-logo-mark" />
                        <span className="flex flex-col leading-tight">
                            <span className="text-sm font-black text-white md:text-base">مرکز رشد و کارآفرینی</span>
                            <span className="text-xs font-bold text-brand-300">دکتر بیدی</span>
                        </span>
                    </Link>

                    <nav className="reference-nav hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
                        {menus.header.map((item) => (
                            <Link
                                key={item.url + item.title}
                                href={item.url}
                                prefetch="hover"
                                className="rounded-xl px-3.5 py-2 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    <div className="reference-actions hidden items-center gap-3 lg:flex">
                        <Link href="/contact" prefetch="hover" className="reference-quick">
                            <MapPin className="size-3.5" /> دسترسی سریع
                        </Link>
                        <ThemeToggle compact />
                        {auth.user ? (
                            <Link
                                href="/dashboard"
                                prefetch="hover"
                                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-400"
                            >
                                پنل کاربری
                            </Link>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setAuthModal('login')}
                                    className="reference-login px-2 py-2 text-sm font-bold text-white/75 transition-colors hover:text-white"
                                >
                                    ورود
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAuthModal('register')}
                                    className="reference-header-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.97]"
                                >
                                    شروع مسیر رشد
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((v) => !v)}
                        className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 lg:hidden"
                        aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="size-5" /> : <MenuIcon className="size-5" />}
                    </button>
                </div>

                {/* ── Slide-out mobile panel ── */}
                <div
                    className={`drawer-backdrop ${mobileOpen ? 'is-open' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    aria-hidden={!mobileOpen}
                />
                <aside
                    className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`}
                    aria-hidden={!mobileOpen}
                    aria-label="منوی موبایل"
                >
                    <div className="drawer-head">
                        <div className="flex items-center gap-2.5">
                            <BrandLogo className="reference-logo-mark" />
                            <div className="leading-tight text-white">
                                <div className="text-sm font-black">مرکز رشد و کارآفرینی</div>
                                <div className="text-xs font-bold text-brand-300">دکتر بیدی</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle compact />
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="drawer-close"
                                aria-label="بستن منو"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </div>

                    <nav className="drawer-nav" aria-label="منوی اصلی">
                        {menus.header.map((item, i) => {
                            const Icon = menuIconFor(item.url);
                            return (
                                <div key={item.url + item.title} className="drawer-item" style={{ transitionDelay: `${90 + i * 60}ms` }}>
                                    <Link
                                        href={item.url}
                                        prefetch="hover"
                                        onClick={() => setMobileOpen(false)}
                                        className="drawer-link"
                                    >
                                        <span className="drawer-link-icon">
                                            <Icon className="size-4" aria-hidden />
                                        </span>
                                        <span>{item.title}</span>
                                        <span className="drawer-link-index">{formatNumber(i + 1)}</span>
                                        <ChevronLeft className="drawer-link-arrow size-4" aria-hidden />
                                    </Link>
                                </div>
                            );
                        })}
                    </nav>                        <div className="drawer-foot">
                        <div className="drawer-btns">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    prefetch="hover"
                                    onClick={() => setMobileOpen(false)}
                                    className="drawer-btn drawer-btn-solid"
                                >
                                    پنل کاربری
                                </Link>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setMobileOpen(false); setAuthModal('login'); }}
                                        className="drawer-btn drawer-btn-ghost"
                                    >
                                        ورود
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMobileOpen(false); setAuthModal('register'); }}
                                        className="drawer-btn drawer-btn-solid"
                                    >
                                        شروع مسیر رشد
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </aside>

                {atBottom && (
                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="scroll-top-float"
                        aria-label="بازگشت به بالای صفحه"
                        title="بالا رفتن"
                    >
                        <ArrowUp className="size-5" aria-hidden />
                        <span>بالا</span>
                    </button>
                )}
            </header>

            <main className="public-page-content flex-1">{children}</main>

            <footer className="site-footer bg-deep-gradient text-white">
                <div className="container-site">
                    <div className="footer-callout">
                        <div className="footer-callout-mark" aria-hidden>
                            <Sparkles className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="footer-eyebrow">یک قدم برای آینده روشن‌تر</span>
                            <h2>مسیر رشد فرزندتان را آگاهانه طراحی کنید.</h2>
                            <p>از کشف استعداد تا ساخت مهارت‌های آینده، کنار شما هستیم.</p>
                        </div>
                        <div className="footer-callout-actions">
                            <Link href="/contact" className="footer-primary-action">
                                {site.hero.cta_primary || 'دریافت مشاوره رایگان'}
                                <ArrowLeft className="size-4" aria-hidden />
                            </Link>
                            <Link href="/courses" className="footer-secondary-action">مشاهده دوره‌ها</Link>
                        </div>
                    </div>

                    <div className="footer-main-grid">
                        <div className="footer-brand-column">
                            <div className="flex items-center gap-2.5">
                                <BrandLogo className="footer-brand-mark" />
                                <div className="leading-tight">
                                    <div className="text-sm font-black">مرکز رشد و کارآفرینی</div>
                                    <div className="text-xs font-bold text-brand-300">دکتر بیدی</div>
                                </div>
                            </div>
                            <p className="footer-brand-description">{site.slogan || 'همراه خانواده‌ها برای ساختن مسیر رشد، یادگیری و آینده‌ای روشن‌تر.'}</p>
                            <div className="footer-socials">
                                {site.social.instagram && (
                                    <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="اینستاگرام">
                                        <Share2 className="size-4" aria-hidden />
                                        <span>اینستاگرام</span>
                                    </a>
                                )}
                                {site.social.eitaa && (
                                    <a href={site.social.eitaa} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="ایتا">
                                        <Send className="size-4" aria-hidden />
                                        <span>ایتا</span>
                                    </a>
                                )}
                            </div>
                            {site.enamad?.enabled && (
                                <div className="footer-enamad">
                                    <span className="footer-enamad-title">{site.enamad.title}</span>
                                    {site.enamad.image_url ? (
                                        site.enamad.link_url ? (
                                            <a href={site.enamad.link_url} target="_blank" rel="noopener noreferrer" className="footer-enamad-link">
                                                <img src={site.enamad.image_url} alt={site.enamad.title} loading="lazy" />
                                            </a>
                                        ) : (
                                            <img src={site.enamad.image_url} alt={site.enamad.title} loading="lazy" />
                                        )
                                    ) : (
                                        <span className="footer-enamad-placeholder">تصویر نشان در تنظیمات وارد نشده است</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="footer-link-column">
                            <h3 className="footer-column-title">دسترسی سریع</h3>
                            <ul className="footer-link-list">
                                {menus.footer.map((item, index) => (
                                    <li key={item.url + item.title}>
                                        <Link href={item.url} prefetch="hover" className="footer-nav-link">
                                            <span className="footer-nav-index">{formatNumber(index + 1)}</span>
                                            <span>{item.title}</span>
                                            <ChevronLeft className="footer-nav-arrow size-3.5" aria-hidden />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-link-column">
                            <h3 className="footer-column-title">همراهی در مسیر</h3>
                            <ul className="footer-link-list">
                                <li><Link href="/coaching" className="footer-nav-link"><span className="footer-nav-dot" /><span>کوچینگ تخصصی نوجوان</span><ChevronLeft className="footer-nav-arrow size-3.5" aria-hidden /></Link></li>
                                <li><Link href="/services" className="footer-nav-link"><span className="footer-nav-dot" /><span>خدمات رشد و استعداد</span><ChevronLeft className="footer-nav-arrow size-3.5" aria-hidden /></Link></li>
                                <li><Link href="/blog" className="footer-nav-link"><span className="footer-nav-dot" /><span>مجله مسیر رشد</span><ChevronLeft className="footer-nav-arrow size-3.5" aria-hidden /></Link></li>
                                <li><Link href="/contact" className="footer-nav-link"><span className="footer-nav-dot" /><span>گفتگو با کارشناسان</span><ChevronLeft className="footer-nav-arrow size-3.5" aria-hidden /></Link></li>
                            </ul>
                        </div>

                        <div className="footer-contact-column">
                            <h3 className="footer-column-title">با ما در تماس باشید</h3>
                            <ul className="footer-contact-list">
                                {site.contact.phone && <li><a href={`tel:${site.contact.phone}`} dir="ltr"><Phone className="size-4" aria-hidden /><span>{site.contact.phone}</span></a></li>}
                                {site.contact.email && <li><a href={`mailto:${site.contact.email}`} dir="ltr"><Mail className="size-4" aria-hidden /><span>{site.contact.email}</span></a></li>}
                                {site.contact.eitaa && <li>{site.social.eitaa ? <a href={site.social.eitaa} target="_blank" rel="noopener noreferrer" dir="ltr"><Send className="size-4" aria-hidden /><span>{site.contact.eitaa}</span></a> : <span dir="ltr"><Send className="size-4" aria-hidden /><span>{site.contact.eitaa}</span></span>}</li>}
                                {site.contact.address && <li><span><MapPin className="size-4" aria-hidden /><span>{site.contact.address}</span></span></li>}
                            </ul>
                            {site.contact.working_hours && <div className="footer-hours"><Clock3 className="size-4" aria-hidden /><span>{site.contact.working_hours}</span></div>}
                        </div>
                    </div>

                    <div className="footer-bottom-bar">
                        <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-300" aria-hidden /><span>اطلاعات شما نزد ما امن است</span></div>
                        <div className="footer-bottom-links"><Link href="/about">درباره ما</Link><Link href="/contact">تماس با ما</Link><Link href="/courses">دوره‌ها</Link></div>
                        <span dir="rtl">© {new Date().getFullYear()} {site.name} — تمامی حقوق محفوظ است.</span>
                    </div>
                </div>
            </footer>

            <MobileAppNav
                ariaLabel="ناوبری اصلی موبایل"
                items={[
                    { label: 'خانه', href: '/', icon: Home },
                    { label: 'دوره‌ها', href: '/courses', icon: GraduationCap },
                    { label: 'خدمات', href: '/services', icon: Compass },
                    { label: 'فروشگاه', href: '/shop', icon: ShoppingBag },
                    auth.user
                        ? { label: 'حساب', href: '/dashboard', icon: UserRound }
                        : { label: 'حساب', icon: UserRound, onClick: () => setAuthModal('login') },
                ]}
            />
            </div>

            <PwaInstallPrompt />
            <CelebrateFlash />
            <FlashToast />
            <SitePopup paused={Boolean(authModal || mobileOpen)} />
            <ChatWidget />

            {authModal && (
                <Suspense fallback={null}>
                    <AuthModal
                        initialMode={authModal}
                        sharedState={sharedAuthModal}
                        onClose={() => setAuthModal(null)}
                    />
                </Suspense>
            )}
        </>
    );
}
