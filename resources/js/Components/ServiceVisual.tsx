import {
    ArrowUpLeft,
    BriefcaseBusiness,
    Compass,
    GraduationCap,
    Lightbulb,
    Route,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ServiceVisualVariant =
    | 'coaching'
    | 'talent'
    | 'academic'
    | 'trainer'
    | 'business'
    | 'default';

interface ServiceVisualProps {
    variant?: ServiceVisualVariant;
    label?: string;
    compact?: boolean;
}

interface VisualConfig {
    Icon: LucideIcon;
    label: string;
    index: string;
}

const visuals: Record<ServiceVisualVariant, VisualConfig> = {
    coaching: { Icon: Compass, label: 'همراهی', index: '۰۱' },
    talent: { Icon: Sparkles, label: 'کشف', index: '۰۲' },
    academic: { Icon: GraduationCap, label: 'یادگیری', index: '۰۳' },
    trainer: { Icon: Users, label: 'توانمندسازی', index: '۰۴' },
    business: { Icon: BriefcaseBusiness, label: 'رشد حرفه‌ای', index: '۰۵' },
    default: { Icon: Lightbulb, label: 'رشد', index: '—' },
};

export function getServiceVisualIcon(variant: ServiceVisualVariant): LucideIcon {
    return visuals[variant].Icon;
}

export function getServiceVisualVariant(slug: string, icon?: string | null): ServiceVisualVariant {
    const value = `${slug} ${icon ?? ''}`.toLowerCase();

    if (value.includes('talent') || value.includes('استعداد')) return 'talent';
    if (value.includes('academic') || value.includes('تحصیلی')) return 'academic';
    if (value.includes('trainer') || value.includes('مدرس')) return 'trainer';
    if (value.includes('business') || value.includes('کسب')) return 'business';
    if (value.includes('coach') || value.includes('کوچ')) return 'coaching';

    return 'default';
}

export function ServiceVisual({ variant = 'default', label, compact = false }: ServiceVisualProps) {
    const config = visuals[variant];
    const Icon = config.Icon;

    return (
        <div
            className={`service-art ${compact ? 'service-art-compact' : ''}`}
            data-variant={variant}
            aria-hidden="true"
        >
            <div className="service-art-wash" />
            <div className="service-art-rule" />
            <span className="service-art-index">{config.index}</span>
            <span className="service-art-kicker">{config.label}</span>
            <div className="service-art-path">
                <span className="service-art-path-line" />
                <span className="service-art-path-node service-art-path-node-one" />
                <span className="service-art-path-node service-art-path-node-two" />
            </div>
            <div className="service-art-core">
                <div className="service-art-icon">
                    <Icon strokeWidth={1.4} />
                </div>
                <span className="service-art-core-shadow" />
            </div>
            <div className="service-art-stamp">
                <span>{label ?? config.label}</span>
                <ArrowUpLeft className="size-4" />
            </div>
            <span className="service-art-corner">DR. BEIDI / {config.index}</span>
        </div>
    );
}

export function GrowthOrbit() {
    return (
        <div className="growth-art" aria-hidden="true">
            <div className="growth-art-panel">
                <div className="growth-art-grid" />
                <div className="growth-art-sun" />
                <div className="growth-art-route growth-art-route-one" />
                <div className="growth-art-route growth-art-route-two" />
                <span className="growth-art-node growth-art-node-one" />
                <span className="growth-art-node growth-art-node-two" />
                <span className="growth-art-node growth-art-node-three" />
                <div className="growth-art-monogram">ر</div>
                <div className="growth-art-caption">
                    <span>مسیر رشد</span>
                    <small>از شناخت تا استقلال</small>
                </div>
                <div className="growth-art-index">۰۱ — ۰۷</div>
                <div className="growth-art-side-label">GROWTH / PATH</div>
                <div className="growth-art-route-label">
                    <Route className="size-4" /> هر مسیر، یک داستان تازه
                </div>
            </div>
            <div className="growth-art-note">
                <TrendingUp className="size-5" />
                <span>آینده را از همین‌جا طراحی کنید</span>
            </div>
        </div>
    );
}
