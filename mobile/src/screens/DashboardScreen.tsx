import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, EmptyState, Loading, ProgressBar, Screen, SectionHeader } from '../components';
import { api, ApiError } from '../api/client';
import type { DashboardData } from '../api/types';
import { colors, faNum, radius, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { TabStackNavigation } from '../navigation/types';

export function DashboardScreen() {
    const navigation = useNavigation<TabStackNavigation>();
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (asRefresh = false) => {
        if (asRefresh) setRefreshing(true);
        try {
            const result = await api<DashboardData>('/api/v1/dashboard');
            setData(result);
            setError(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در دریافت اطلاعات');
        } finally {
            if (asRefresh) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (!data && !error) return <Loading label="در حال دریافت پنل کاربری…" />;

    const enrollments = data?.enrollments ?? [];
    const inProgress = enrollments.filter((e) => e.status === 'active').length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;

    return (
        <Screen>
            <FlatList
                data={enrollments}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <Avatar name={user?.name} size={52} />
                            <View style={styles.headerText}>
                                <Text style={styles.greeting}>سلام، {user?.name} 👋</Text>
                                <Text style={styles.greetingSub}>به پنل کاربری خوش آمدید</Text>
                            </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.statsRow}>
                            <StatCard value={faNum(enrollments.length)} label="دورههای من" />
                            <StatCard value={faNum(inProgress)} label="در حال یادگیری" />
                            <StatCard value={faNum(completed)} label="تکمیلشده" />
                        </View>

                        {(data?.orders?.length ?? 0) > 0 ? (
                            <View style={styles.section}>
                                <SectionHeader title="سفارشهای اخیر" />
                                {data?.orders.map((order) => (
                                    <View key={order.id} style={styles.orderRow}>
                                        <View style={styles.orderInfo}>
                                            <Text style={styles.orderNumber}>{order.order_number}</Text>
                                            <Text style={styles.orderDate}>
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString('fa-IR') : '—'}
                                            </Text>
                                        </View>
                                        <View style={styles.orderLeft}>
                                            <Text style={styles.orderTotal}>{faNum(order.total)} تومان</Text>
                                            <Text style={styles.orderStatus}>{orderStatusLabel(order.status)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <SectionHeader title="دورههای من" />
                    </View>
                }
                ListEmptyComponent={
                    error ? (
                        <EmptyState icon="📡" title="خطا در دریافت دورهها" subtitle={error} />
                    ) : (
                        <EmptyState
                            icon="🎓"
                            title="هنوز در دورهای ثبتنام نکردهاید"
                            subtitle="از بخش دورهها، اولین دورهی خود را انتخاب کنید"
                        />
                    )
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.courseRow, pressed && { opacity: 0.85 }]}
                        onPress={() => navigation.navigate('CourseDetail', { slug: item.course?.slug ?? '' })}
                    >
                        <View style={styles.courseRowHeader}>
                            <Text style={styles.courseRowTitle} numberOfLines={1}>
                                {item.course?.title}
                            </Text>
                            <Text style={styles.courseRowPercent}>{faNum(item.progress_percent)}٪</Text>
                        </View>
                        <ProgressBar percent={item.progress_percent} />
                        <Text style={styles.courseRowStatus}>{enrollmentStatusLabel(item.status)}</Text>
                    </Pressable>
                )}
            />
        </Screen>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function orderStatusLabel(status: string): string {
    const map: Record<string, string> = {
        pending: 'در انتظار پرداخت',
        paid: 'پرداختشده',
        completed: 'تکمیلشده',
        cancelled: 'لغوشده',
        failed: 'ناموفق',
    };
    return map[status] || status;
}

function enrollmentStatusLabel(status: string): string {
    const map: Record<string, string> = {
        active: 'در حال یادگیری',
        completed: 'تکمیل شده',
        paused: 'متوقف',
        cancelled: 'لغو شده',
    };
    return map[status] || status;
}

const styles = StyleSheet.create({
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    headerText: { gap: 2 },
    greeting: { ...typography.title, color: colors.text },
    greetingSub: { ...typography.small, color: colors.muted },
    errorText: { ...typography.small, color: colors.danger, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        gap: 2,
    },
    statValue: { ...typography.title, color: colors.primary },
    statLabel: { ...typography.tiny, color: colors.muted },
    section: { marginBottom: spacing.lg, gap: spacing.sm },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    orderInfo: { gap: 2 },
    orderNumber: { ...typography.body, color: colors.text, fontWeight: '700' },
    orderDate: { ...typography.tiny, color: colors.muted },
    orderLeft: { alignItems: 'flex-end', gap: 2 },
    orderTotal: { ...typography.body, color: colors.text, fontWeight: '700' },
    orderStatus: { ...typography.tiny, color: colors.primary },
    courseRow: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        gap: 8,
    },
    courseRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    courseRowTitle: { ...typography.heading, color: colors.text, flex: 1 },
    courseRowPercent: { ...typography.small, color: colors.primary, fontWeight: '700' },
    courseRowStatus: { ...typography.tiny, color: colors.muted },
});
