import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, faNum, price, radius, spacing, typography } from '../theme';
import { resolveAssetUrl } from '../api/client';
import type { CoursePayload, ProductPayload } from '../api/types';

// ---------------------------------------------------------------------------

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return (
        <SafeAreaView edges={['top']} style={[styles.screen, style]}>
            {children}
        </SafeAreaView>
    );
}

export function Loading({ label }: { label?: string }) {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
        </View>
    );
}

export function EmptyState({
    icon = '📭',
    title,
    subtitle,
}: {
    icon?: string;
    title: string;
    subtitle?: string;
}) {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{icon}</Text>
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

export function SectionHeader({ title, onMore }: { title: string; onMore?: () => void }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onMore ? (
                <Pressable onPress={onMore} hitSlop={8}>
                    <Text style={styles.sectionMore}>مشاهده همه</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export function Chip({ label, tone = 'soft' }: { label: string; tone?: 'soft' | 'gold' | 'dark' }) {
    const bg =
        tone === 'gold' ? colors.accent : tone === 'dark' ? colors.primaryDark : colors.primarySoft;
    const fg = tone === 'gold' ? colors.text : tone === 'dark' ? colors.white : colors.primaryDark;
    return (
        <View style={[styles.chip, { backgroundColor: bg }]}>
            <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
        </View>
    );
}

export function PriceTag({
    priceValue,
    discount,
    size = 'md',
}: {
    priceValue: number | null | undefined;
    discount?: number | null;
    size?: 'sm' | 'md' | 'lg';
}) {
    const hasDiscount = discount != null && discount > 0 && discount < (priceValue ?? 0);
    const effective = hasDiscount ? discount : priceValue;
    const fontSize = size === 'lg' ? 20 : size === 'md' ? 15 : 13;
    return (
        <View style={styles.priceRow}>
            {effective !== null && effective !== undefined && effective > 0 ? (
                <>
                    <Text style={[styles.price, { fontSize }]}>{faNum(effective)}</Text>
                    <Text style={[styles.priceUnit, { fontSize: fontSize - 4 }]}>تومان</Text>
                </>
            ) : (
                <Text style={[styles.price, { fontSize, color: colors.primary }]}>رایگان</Text>
            )}
            {hasDiscount ? (
                <Text style={styles.priceOld}>{faNum(priceValue)}</Text>
            ) : null}
        </View>
    );
}

export function ProgressBar({ percent }: { percent: number }) {
    const clamped = Math.max(0, Math.min(100, percent || 0));
    return (
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${clamped}%` }]} />
        </View>
    );
}

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
    const initial = (name || '؟').trim().charAt(0);
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{initial}</Text>
        </View>
    );
}

// ---------------------------------------------------------------------------

export function CourseCard({ course, onPress }: { course: CoursePayload; onPress: () => void }) {
    return (
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
            <CourseThumbnail thumbnail={course.thumbnail} title={course.title} />
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {course.title}
                </Text>
                {course.instructor?.user?.name ? (
                    <Text style={styles.cardMuted} numberOfLines={1}>
                        مدرس: {course.instructor.user.name}
                    </Text>
                ) : null}
                <View style={styles.cardMetaRow}>
                    <PriceTag priceValue={course.price} discount={course.discount_price} size="sm" />
                    <Text style={styles.cardMuted}>{faNum(course.students_count)} دانشجو</Text>
                </View>
            </View>
        </Pressable>
    );
}

export function ProductCard({ product, onPress }: { product: ProductPayload; onPress: () => void }) {
    return (
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
            <CourseThumbnail thumbnail={product.image} title={product.title} />
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {product.title}
                </Text>
                {product.author ? (
                    <Text style={styles.cardMuted} numberOfLines={1}>
                        {product.author}
                    </Text>
                ) : null}
                <View style={styles.cardMetaRow}>
                    <PriceTag priceValue={product.price} discount={product.discount_price} size="sm" />
                </View>
            </View>
        </Pressable>
    );
}

function CourseThumbnail({ thumbnail, title }: { thumbnail?: string | null; title: string }) {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        resolveAssetUrl(thumbnail).then((resolved) => {
            if (mounted) setUri(resolved);
        });
        return () => {
            mounted = false;
        };
    }, [thumbnail]);

    return (
        <View style={styles.thumbWrap}>
            {uri ? <Image source={{ uri }} style={styles.thumb} resizeMode="cover" /> : null}
            <View style={styles.thumbFallback}>
                <Text style={styles.thumbFallbackText} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------

export function PrimaryButton({
    title,
    onPress,
    disabled,
    loading,
    variant = 'primary',
}: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}) {
    const bg =
        variant === 'secondary' ? colors.primarySoft : variant === 'danger' ? colors.danger : colors.primary;
    const fg = variant === 'secondary' ? colors.primaryDark : colors.white;
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: bg },
                (disabled || loading) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <Text style={[styles.buttonLabel, { color: fg }]}>{title}</Text>
            )}
        </Pressable>
    );
}

export function Field({
    label,
    error,
    ...props
}: TextInputProps & { label: string; error?: string | null }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                placeholderTextColor={colors.muted}
                style={[styles.input, error ? styles.inputError : null]}
                {...props}
            />
            {error ? <Text style={styles.fieldError}>{error}</Text> : null}
        </View>
    );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },

    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

    loadingLabel: { color: colors.muted, fontSize: 13 },

    empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { ...typography.heading, color: colors.text },
    emptySubtitle: { ...typography.small, color: colors.muted, textAlign: 'center' },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.title, color: colors.text },
    sectionMore: { ...typography.small, color: colors.primary, fontWeight: '600' },

    chip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    chipLabel: { fontSize: 12, fontWeight: '600' },

    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
    price: { color: colors.text, fontWeight: '800' },
    priceUnit: { color: colors.muted },
    priceOld: {
        color: colors.muted,
        textDecorationLine: 'line-through',
        fontSize: 12,
        marginStart: 6,
    },

    progressTrack: {
        height: 8,
        borderRadius: radius.full,
        backgroundColor: colors.border,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },

    avatar: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: colors.white, fontWeight: '800' },

    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    cardPressed: { opacity: 0.85 },
    cardBody: { padding: spacing.md, gap: 6 },
    cardTitle: { ...typography.heading, color: colors.text },
    cardMuted: { ...typography.small, color: colors.muted },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },

    thumbWrap: { height: 130, backgroundColor: colors.primarySoft },
    thumb: { width: '100%', height: '100%' },
    thumbFallback: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: colors.primary,
    },
    thumbFallbackText: { color: colors.white, fontWeight: '700', textAlign: 'center' },

    button: {
        borderRadius: radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    buttonLabel: { fontSize: 15, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
    buttonPressed: { opacity: 0.9 },

    field: { gap: 6, marginBottom: spacing.md },
    fieldLabel: { ...typography.small, color: colors.text, fontWeight: '600' },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
        textAlign: 'right',
    },
    inputError: { borderColor: colors.danger },
    fieldError: { ...typography.tiny, color: colors.danger },
});
