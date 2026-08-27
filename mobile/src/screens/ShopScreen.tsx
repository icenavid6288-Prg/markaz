import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EmptyState, Loading, ProductCard, Screen } from '../components';
import { api, ApiError } from '../api/client';
import type { Paginated, ProductPayload } from '../api/types';
import { colors, spacing, typography } from '../theme';
import type { TabStackNavigation } from '../navigation/types';

export function ShopScreen() {
    const navigation = useNavigation<TabStackNavigation>();
    const [products, setProducts] = useState<ProductPayload[]>([]);
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
            const result = await api<Paginated<ProductPayload>>('/api/v1/products', {
                query: { page: String(pageNum), per_page: '12' },
            });
            setProducts((prev) => (replace ? result.data : [...prev, ...result.data]));
            setPage(result.current_page);
            setLastPage(result.last_page);
            setError(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات');
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

    if (loading) return <Loading label="در حال دریافت محصولات…" />;

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>فروشگاه مرکز رشد</Text>
                <Text style={styles.subtitle}>کتابها و محصولات آموزشی</Text>
            </View>
            {error && products.length === 0 ? (
                <EmptyState icon="📡" title="خطا در دریافت محصولات" subtitle={error} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.4}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    ListEmptyComponent={<EmptyState icon="🛍" title="محصولی یافت نشد" />}
                    ListFooterComponent={
                        loadingMore ? <Loading label="در حال دریافت…" /> : page >= lastPage && products.length ? (
                            <Text style={styles.endText}>— پایان فهرست —</Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <View style={styles.itemWrap}>
                            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })} />
                        </View>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: 4 },
    title: { ...typography.title, color: colors.text },
    subtitle: { ...typography.small, color: colors.muted },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    row: { gap: spacing.md },
    itemWrap: { flex: 1, marginBottom: spacing.md },
    endText: { textAlign: 'center', color: colors.muted, fontSize: 12, paddingVertical: spacing.lg },
});
