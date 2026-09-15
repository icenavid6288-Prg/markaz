import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, ApiError, openSitePage } from '../api/client';
import { Field, Loading, PrimaryButton, Screen } from '../components';
import type { LearningData } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Learning'>;

const LESSON_ICONS: Record<string, string> = {
    video: '🎬',
    audio: '🎧',
    podcast: '🎙',
    quiz: '📝',
    assignment: '📎',
};

function lessonIcon(type: string): string {
    return LESSON_ICONS[type] || '📄';
}

export function LearningScreen({ route }: Props) {
    const { slug, lessonId } = route.params;
    const [data, setData] = useState<LearningData | null>(null);
    const [selectedId, setSelectedId] = useState<number | undefined>(lessonId);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const path = selectedId
                ? `/api/v1/learning/${slug}/${selectedId}`
                : `/api/v1/learning/${slug}`;
            const result = await api<LearningData>(path);
            setData(result);
            setSelectedId(result.current_lesson.id);
            setError(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در دریافت محتوای دوره');
        } finally {
            setLoading(false);
        }
    }, [slug, selectedId]);

    useEffect(() => {
        load();
    }, [load]);

    const currentIndex = useMemo(
        () => data?.lessons.findIndex((item) => item.id === data.current_lesson.id) ?? -1,
        [data]
    );
    const nextLesson = data && currentIndex >= 0 ? data.lessons[currentIndex + 1] : undefined;

    const selectLesson = (id: number, locked?: boolean) => {
        if (locked) {
            Alert.alert('این درس قفل است', 'برای مشاهده این درس ابتدا در دوره ثبت‌نام کنید.');
            return;
        }
        if (id !== selectedId) setNote('');
        setSelectedId(id);
    };

    const completeLesson = async () => {
        if (!data) return;
        setCompleting(true);
        try {
            // The API stores progress as a percentage plus an optional status.
            await api(`/api/v1/learning/${slug}/lessons/${data.current_lesson.id}/progress`, {
                method: 'POST',
                body: { progress_percent: 100, status: 'completed' },
            });

            if (nextLesson && !nextLesson.locked) {
                setNote('');
                setSelectedId(nextLesson.id);
            } else {
                await load();
            }

            Alert.alert('ذخیره شد', 'پیشرفت شما با موفقیت ذخیره شد.');
        } catch (e) {
            Alert.alert('خطا', e instanceof ApiError ? e.message : 'ذخیره پیشرفت انجام نشد.');
        } finally {
            setCompleting(false);
        }
    };

    const saveNote = async () => {
        if (!note.trim() || !data) return;
        setSavingNote(true);
        try {
            await api(`/api/v1/learning/${slug}/lessons/${data.current_lesson.id}/notes`, {
                method: 'POST',
                body: { content: note.trim() },
            });
            setNote('');
            Alert.alert('یادداشت ذخیره شد', 'یادداشت شما به حساب کاربری‌تان اضافه شد.');
        } catch (e) {
            Alert.alert('خطا', e instanceof ApiError ? e.message : 'ذخیره یادداشت انجام نشد.');
        } finally {
            setSavingNote(false);
        }
    };

    if (loading) return <Loading label="در حال آماده‌سازی درس…" />;

    if (!data || error) {
        return (
            <Screen>
                <View style={styles.center}>
                    <Text style={styles.title}>محتوا در دسترس نیست</Text>
                    <Text style={styles.muted}>{error}</Text>
                    <PrimaryButton title="تلاش دوباره" onPress={load} />
                </View>
            </Screen>
        );
    }

    const lesson = data.current_lesson;
    // A direct media link (Aparat/YouTube/MP4) plays in the phone browser without
    // needing a web session; the site player is only a fallback.
    const playableUrl = lesson.video_url || lesson.player_url;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.courseTitle}>{data.course.title}</Text>
                <Text style={styles.eyebrow}>
                    {data.preview ? 'پیش‌نمایش رایگان' : 'مسیر یادگیری شما'}
                </Text>

                <View style={styles.lessonCard}>
                    <Text style={styles.lessonType}>
                        {lessonIcon(lesson.type)} {lesson.type === 'video' ? 'ویدئو' : lesson.type === 'quiz' ? 'آزمون' : 'درس'}
                    </Text>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    {lesson.content ? <Text style={styles.content}>{lesson.content}</Text> : null}

                    {playableUrl ? (
                        <PrimaryButton
                            title="پخش ویدئو"
                            variant="secondary"
                            onPress={() =>
                                openSitePage(playableUrl).catch((e) =>
                                    Alert.alert('خطا', e instanceof ApiError ? e.message : 'خطا در باز کردن ویدئو')
                                )
                            }
                        />
                    ) : null}

                    {data.preview ? (
                        <Text style={styles.previewNote}>
                            این درس پیش‌نمایش رایگان است. برای ثبت پیشرفت و ادامه‌ی مسیر یادگیری، در دوره ثبت‌نام کنید.
                        </Text>
                    ) : (
                        <PrimaryButton
                            title="تکمیل و ذخیره پیشرفت"
                            onPress={completeLesson}
                            loading={completing}
                        />
                    )}
                </View>

                <Text style={styles.sectionTitle}>فهرست درس‌ها</Text>
                {data.lessons.map((item, index) => (
                    <Pressable
                        key={item.id}
                        onPress={() => selectLesson(item.id, item.locked)}
                        style={[styles.lessonRow, item.id === lesson.id && styles.lessonSelected]}
                    >
                        <Text style={styles.number}>{item.locked ? '🔒' : `${index + 1}`}</Text>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowIcon}>{lessonIcon(item.type)}</Text>
                    </Pressable>
                ))}

                <Text style={styles.sectionTitle}>یادداشت شخصی</Text>
                <Field
                    label="یادداشت این درس"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    placeholder="نکته مهمی که می‌خواهید ذخیره کنید…"
                />
                <PrimaryButton
                    title="ذخیره یادداشت"
                    variant="secondary"
                    onPress={saveNote}
                    disabled={!note.trim()}
                    loading={savingNote}
                />
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    center: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    courseTitle: { ...typography.title, color: colors.text },
    eyebrow: { ...typography.small, color: colors.primary },
    title: { ...typography.title, color: colors.text },
    muted: { ...typography.body, color: colors.muted },
    lessonCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
    },
    lessonType: { color: colors.primary, fontWeight: '700' },
    lessonTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    content: { color: colors.text, lineHeight: 27, fontSize: 15 },
    previewNote: { ...typography.small, color: colors.muted, lineHeight: 22 },
    sectionTitle: { ...typography.heading, color: colors.text, marginTop: spacing.md },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    lessonSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    number: { width: 26, textAlign: 'center', color: colors.primary, fontWeight: '700' },
    rowTitle: { flex: 1, color: colors.text, fontSize: 14 },
    rowIcon: { fontSize: 14 },
});
