import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, Loading, PrimaryButton, PriceTag, Screen } from '../components';
import { api, ApiError, openSitePage, resolveAssetUrl } from '../api/client';
import type { ProductPayload } from '../api/types';
import { colors, faNum, radius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route }: Props) {
    const { slug } = route.params;
    const [product, setProduct] = useState<ProductPayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        api<ProductPayload>(`/api/v1/products/${slug}`)
            .then(setProduct)
            .catch((e) => setError(e instanceof ApiError ? e.message : 'خطا در دریافت محصول'));
    }, [slug]);

    useEffect(() => {
        let mounted = true;
        resolveAssetUrl(product?.image).then((uri) => {
            if (mounted) setImageUri(uri);
        });
        return () => {
            mounted = false;
        };
    }, [product?.image]);

    if (!product) {
        return error ? (
            <Screen>
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>محصول یافت نشد</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </Screen>
        ) : (
            <Loading label="در حال دریافت محصول…" />
        );
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.imageFallback]}>
                        <Text style={styles.imageFallbackText}>{product.title}</Text>
                    </View>
                )}

                <View style={styles.body}>
                    <View style={styles.chipsRow}>
                        <Chip label={product.type === 'book' ? 'کتاب' : 'محصول'} />
                        {product.is_featured ? <Chip label="پیشنهاد ویژه" tone="gold" /> : null}
                    </View>

                    <Text style={styles.title}>{product.title}</Text>
                    {product.author ? <Text style={styles.author}>نویسنده: {product.author}</Text> : null}

                    <View style={styles.metaRow}>
                        {product.publisher ? <Text style={styles.meta}>ناشر: {product.publisher}</Text> : null}
                        {product.pages ? <Text style={styles.meta}>{faNum(product.pages)} صفحه</Text> : null}
                        {product.isbn ? <Text style={styles.meta}>ISBN: {product.isbn}</Text> : null}
                    </View>

                    <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>قیمت</Text>
                        <PriceTag priceValue={product.price} discount={product.discount_price} size="lg" />
                    </View>

                    <PrimaryButton
                        title="خرید از فروشگاه"
                        onPress={() =>
                            openSitePage(`/shop/${product.slug}`).catch((e) =>
                                Alert.alert('خطا', e instanceof ApiError ? e.message : 'خطا در باز کردن صفحه')
                            )
                        }
                    />

                    {product.description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>توضیحات</Text>
                            <Text style={styles.sectionBody}>{product.description}</Text>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: spacing.xxl },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
    errorTitle: { ...typography.title, color: colors.text },
    errorText: { ...typography.small, color: colors.muted, textAlign: 'center' },
    image: { width: '100%', height: 240, backgroundColor: colors.primary },
    imageFallback: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    imageFallbackText: { color: colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    body: { padding: spacing.lg, gap: spacing.md },
    chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    title: { ...typography.hero, color: colors.text },
    author: { ...typography.body, color: colors.muted },
    metaRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
    meta: { ...typography.small, color: colors.muted },
    priceBox: {
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: 4,
    },
    priceLabel: { ...typography.small, color: colors.primaryDark, fontWeight: '600' },
    section: { marginTop: spacing.md, gap: spacing.sm },
    sectionTitle: { ...typography.title, color: colors.text, fontSize: 17 },
    sectionBody: { ...typography.body, color: colors.text, lineHeight: 26 },
});
