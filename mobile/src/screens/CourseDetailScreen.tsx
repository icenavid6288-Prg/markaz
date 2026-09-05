import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, Loading, PrimaryButton, PriceTag, ProgressBar, Screen } from '../components';
import { api, ApiError, openSitePage, resolveAssetUrl } from '../api/client';
import type { CoursePayload } from '../api/types';
import { colors, faNum, radius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;

export function CourseDetailScreen({ route, navigation }: Props) {
    const { slug } = route.params;
    const { token } = useAuth();
    const [course, setCourse] = useState<CoursePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
    const [imageUri, setImageUri] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const result = await api<CoursePayload>(`/api/v1/courses/${slug}`);
            setCourse(result);
            setError(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در دریافت دوره');
        }
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        let mounted = true;
        resolveAssetUrl(course?.thumbnail).then((uri) => {
            if (mounted) setImageUri(uri);
        });
        return () => {
            mounted = false;
        };
    }, [course?.thumbnail]);

    const toggleModule = (id: number) =>
        setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));

    if (!course) {
        return error ? (
            <Screen>
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>دوره یافت نشد</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </Screen>
        ) : (
            <Loading label="در حال دریافت دوره…" />
        );
    }

    const goEnroll = async () => {
        if (!token) {
            Alert.alert('ورود لازم است', 'برای ثبت‌نام ابتدا وارد حساب خود شوید.');
            return;
        }
        if (enrolled) {
            navigation.navigate('Learning', { slug: course.slug });
            return;
        }
        try {
            const result = await api<{ enrolled?: boolean; checkout_url?: string | null; player_url?: string | null }>(
                `/api/v1/courses/${course.slug}/checkout`,
                { method: 'POST' }
            );
            const target = result.checkout_url || result.player_url || `/courses/${course.slug}`;
            await openSitePage(target.replace(/^https?:\/\/[^/]+/, ''));
        } catch (e) {
            Alert.alert('خطا', e instanceof ApiError ? e.message : 'ثبت‌نام انجام نشد.');
        }
    };

    const enrolled = Boolean(course.enrollment);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.hero} resizeMode="cover" />
                ) : (
                    <View style={[styles.hero, styles.heroFallback]}>
                        <Text style={styles.heroFallbackText}>{course.title}</Text>
                    </View>
                )}

                <View style={styles.body}>
                    <View style={styles.chipsRow}>
                        {course.category ? <Chip label={course.category} /> : null}
                        {course.level ? <Chip label={course.level} tone="gold" /> : null}
                    </View>

                    <Text style={styles.title}>{course.title}</Text>
                    {course.subtitle ? <Text style={styles.subtitle}>{course.subtitle}</Text> : null}

                    <View style={styles.metaRow}>
                        <MetaItem icon="👨‍🏫" label={course.instructor?.user?.name || 'مدرس مرکز رشد'} />
                        <MetaItem icon="⏱" label={`${faNum(course.duration_minutes)} دقیقه`} />
                        <MetaItem icon="🎓" label={`${faNum(course.students_count)} دانشجو`} />
                    </View>

                    <View style={styles.priceBox}>
                        <View>
                            <Text style={styles.priceLabel}>{enrolled ? 'وضعیت ثبتنام' : 'شهریه دوره'}</Text>
                            <PriceTag priceValue={course.price} discount={course.discount_price} size="lg" />
                        </View>
                        {enrolled ? (
                            <View style={styles.progressBox}>
                                <Text style={styles.progressText}>پیشرفت: {faNum(course.enrollment?.progress_percent)}٪</Text>
                                <ProgressBar percent={course.enrollment?.progress_percent ?? 0} />
                            </View>
                        ) : null}
                    </View>

                    <PrimaryButton
                        title={enrolled ? 'ادامه یادگیری در سایت' : 'ثبتنام در دوره'}
                        onPress={goEnroll}
                    />

                    {course.description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>درباره دوره</Text>
                            <Text style={styles.sectionBody}>{course.description}</Text>
                        </View>
                    ) : null}

                    {course.curriculum?.length ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>سرفصلهای دوره</Text>
                            {course.curriculum.map((module, index) => {
                                const open = openModules[module.id] ?? index === 0;
                                return (
                                    <View key={module.id} style={styles.module}>
                                        <Pressable style={styles.moduleHeader} onPress={() => toggleModule(module.id)}>
                                            <Text style={styles.moduleTitle}>{module.title}</Text>
                                            <Text style={styles.moduleToggle}>{open ? '−' : '+'}</Text>
                                        </Pressable>
                                        {open ? (
                                            <View style={styles.lessonList}>
                                                {module.lessons.map((lesson) => (
                                                    <Pressable key={lesson.id} style={styles.lessonRow} onPress={() => lesson.is_free || enrolled ? navigation.navigate('Learning', { slug: course.slug, lessonId: lesson.id }) : Alert.alert('این درس قفل است', 'برای مشاهده این درس در دوره ثبت‌نام کنید.')}>
                                                        <Text style={styles.lessonIcon}>
                                                            {lesson.type === 'video' ? '🎬' : lesson.type === 'quiz' ? '📝' : '📄'}
                                                        </Text>
                                                        <Text style={styles.lessonTitle} numberOfLines={2}>
                                                            {lesson.title}
                                                            {lesson.is_free ? ' (رایگان)' : ''}
                                                        </Text>
                                                        {lesson.duration_minutes ? (
                                                            <Text style={styles.lessonDuration}>{faNum(lesson.duration_minutes)} دقیقه</Text>
                                                        ) : null}
                                                    </Pressable>
                                                ))}
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </Screen>
    );
}

function MetaItem({ icon, label }: { icon: string; label: string }) {
    return (
        <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>{icon}</Text>
            <Text style={styles.metaLabel} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: spacing.xxl },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
    errorTitle: { ...typography.title, color: colors.text },
    errorText: { ...typography.small, color: colors.muted, textAlign: 'center' },
    hero: { width: '100%', height: 210, backgroundColor: colors.primary },
    heroFallback: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    heroFallbackText: { color: colors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    body: { padding: spacing.lg, gap: spacing.md },
    chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    title: { ...typography.hero, color: colors.text },
    subtitle: { ...typography.body, color: colors.muted, lineHeight: 24 },
    metaRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaIcon: { fontSize: 15 },
    metaLabel: { ...typography.small, color: colors.muted, maxWidth: 160 },
    priceBox: {
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.sm,
    },
    priceLabel: { ...typography.small, color: colors.primaryDark, fontWeight: '600' },
    progressBox: { gap: 6 },
    progressText: { ...typography.small, color: colors.text },
    section: { marginTop: spacing.md, gap: spacing.sm },
    sectionTitle: { ...typography.title, color: colors.text, fontSize: 17 },
    sectionBody: { ...typography.body, color: colors.text, lineHeight: 26 },
    module: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    moduleTitle: { ...typography.heading, color: colors.text, flex: 1 },
    moduleToggle: { fontSize: 20, color: colors.primary, fontWeight: '800', paddingHorizontal: spacing.sm },
    lessonList: { borderTopWidth: 1, borderTopColor: colors.border },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    lessonIcon: { fontSize: 15 },
    lessonTitle: { ...typography.body, color: colors.text, flex: 1 },
    lessonDuration: { ...typography.tiny, color: colors.muted },
});
