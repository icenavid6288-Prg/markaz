import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CourseCard, EmptyState, Loading, Screen } from '../components';
import { api, ApiError } from '../api/client';
import type { CoursePayload, Paginated } from '../api/types';
import { colors, spacing, typography } from '../theme';
import type { TabStackNavigation } from '../navigation/types';

export function CoursesScreen() {
    const navigation = useNavigation<TabStackNavigation>();
    const [courses, setCourses] = useState<CoursePayload[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (pageNum: number, replace: boolean) => {
        if (replace) setLoading(true);
        else setLoadingMore(true);
        try {
            const result = await api<Paginated<CoursePayload>>('/api/v1/courses', {
                query: { page: String(pageNum), per_page: '12' },
            });
            setCourses((prev) => (replace ? result.data : [...prev, ...result.data]));
            setPage(result.current_page);
            setLastPage(result.last_page);
            setError(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در دریافت دورهها');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(1, true);
    }, [load]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(1, true);
    }, [load]);

    const onEndReached = useCallback(() => {
        if (!loading && !loadingMore && page < lastPage) {
            load(page + 1, false);
        }
    }, [loading, loadingMore, page, lastPage, load]);

    if (loading) return <Loading label="در حال دریافت دورهها…" />;

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>دورههای آموزشی</Text>
            </View>
            {error && courses.length === 0 ? (
                <EmptyState icon="📡" title="خطا در دریافت دورهها" subtitle={error} />
            ) : (
                <FlatList
                    data={courses}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={<EmptyState icon="🎓" title="دورهای یافت نشد" />}
                    ListFooterComponent={
                        loadingMore ? <Loading label="در حال دریافت…" /> : page >= lastPage && courses.length ? (
                            <Text style={styles.endText}>— پایان فهرست —</Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <View style={styles.itemWrap}>
                            <CourseCard course={item} onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })} />
                        </View>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    title: { ...typography.title, color: colors.text },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    itemWrap: { marginBottom: spacing.md },
    endText: { textAlign: 'center', color: colors.muted, fontSize: 12, paddingVertical: spacing.lg },
});
