import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EmptyState, Loading, Screen, SectionHeader } from '../components';
import { CourseCard, ProductCard } from '../components';
import { api, ApiError } from '../api/client';
import type { HomeData } from '../api/types';
import { colors, radius, spacing, typography } from '../theme';
import type { TabStackNavigation } from '../navigation/types';

export function HomeScreen() {
    const navigation = useNavigation<TabStackNavigation>();
    const [data, setData] = useState<HomeData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (asRefresh = false) => {
        if (asRefresh) setRefreshing(true);
        try {
            const home = await api<HomeData>('/api/v1/home');
            setData(home);
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

    if (!data && !error) return <Loading label="در حال دریافت اطلاعات…" />;
    if (!data && error) {
        return (
            <Screen>
                <View style={styles.errorBox}>
                    <EmptyState icon="📡" title="اتصال برقرار نشد" subtitle={error} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroBadge}>اپلیکیشن مرکز رشد</Text>
                    <Text style={styles.heroTitle}>{data?.site.name}</Text>
                    <Text style={styles.heroSubtitle}>{data?.site.slogan}</Text>
                </View>

                {data?.featured_courses?.length ? (
                    <View style={styles.section}>
                        <SectionHeader title="دورههای ویژه" onMore={() => navigation.navigate('Courses')} />
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={data.featured_courses}
                            keyExtractor={(item) => `f${item.id}`}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <View style={styles.hCardWrap}>
                                    <CourseCard course={item} onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })} />
                                </View>
                            )}
                        />
                    </View>
                ) : null}

                {data?.latest_courses?.length ? (
                    <View style={styles.section}>
                        <SectionHeader title="جدیدترین دورهها" onMore={() => navigation.navigate('Courses')} />
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={data.latest_courses}
                            keyExtractor={(item) => `l${item.id}`}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <View style={styles.hCardWrap}>
                                    <CourseCard course={item} onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })} />
                                </View>
                            )}
                        />
                    </View>
                ) : null}

                {data?.latest_products?.length ? (
                    <View style={styles.section}>
                        <SectionHeader title="تازههای فروشگاه" onMore={() => navigation.navigate('Shop')} />
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={data.latest_products}
                            keyExtractor={(item) => `p${item.id}`}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <View style={styles.hCardWrap}>
                                    <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })} />
                                </View>
                            )}
                        />
                    </View>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: spacing.xxl },
    errorBox: { flex: 1, justifyContent: 'center' },
    hero: {
        backgroundColor: colors.primary,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: radius.xl,
        padding: spacing.xl,
        gap: 8,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accent,
        color: colors.text,
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '800' },
    heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 22 },
    section: { marginTop: spacing.xl },
    hList: { paddingHorizontal: spacing.lg, gap: spacing.md },
    hCardWrap: { width: 220 },
});
