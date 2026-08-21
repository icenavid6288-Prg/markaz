import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Screen } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme';
import type { TabStackNavigation } from '../navigation/types';

export function ProfileScreen() {
    const navigation = useNavigation<TabStackNavigation>();
    const { user, logout } = useAuth();

    const confirmLogout = () => {
        Alert.alert('خروج از حساب', 'از حساب کاربری خود خارج میشوید؟', [
            { text: 'انصراف', style: 'cancel' },
            { text: 'خروج', style: 'destructive', onPress: () => logout() },
        ]);
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <Avatar name={user?.name} size={72} />
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    {user?.phone ? <Text style={styles.email}>{user.phone}</Text> : null}
                    {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
                </View>

                <View style={styles.menu}>
                    <MenuItem
                        icon="⚙️"
                        title="تنظیمات سرور"
                        subtitle="آدرس سایت و اتصال اپلیکیشن"
                        onPress={() => navigation.navigate('Settings')}
                    />
                    <MenuItem icon="ℹ️" title="درباره اپلیکیشن" subtitle="مرکز رشد و کارآفرینی دکتر بیدی" onPress={() => Alert.alert('مرکز رشد و کارآفرینی دکتر بیدی', 'اپلیکیشن رسمی مرکز رشد — نسخه ۱.۰.۰')} />
                    <MenuItem icon="🚪" title="خروج از حساب" subtitle="بازگشت به صفحه ورود" danger onPress={confirmLogout} />
                </View>
            </ScrollView>
        </Screen>
    );
}

function MenuItem({
    icon,
    title,
    subtitle,
    danger,
    onPress,
}: {
    icon: string;
    title: string;
    subtitle?: string;
    danger?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.85 }]}
            onPress={onPress}
        >
            <Text style={styles.menuIcon}>{icon}</Text>
            <View style={styles.menuText}>
                <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
                {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
            </View>
            <Text style={styles.menuArrow}>‹</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { padding: spacing.lg, paddingBottom: spacing.xxl },
    headerCard: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        padding: spacing.xl,
        gap: 6,
        marginBottom: spacing.lg,
    },
    name: { ...typography.title, color: colors.text, marginTop: spacing.sm },
    email: { ...typography.small, color: colors.muted },
    bio: { ...typography.small, color: colors.text, textAlign: 'center', lineHeight: 20 },
    menu: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    menuIcon: { fontSize: 20 },
    menuText: { flex: 1, gap: 2 },
    menuTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
    menuSubtitle: { ...typography.tiny, color: colors.muted },
    menuArrow: { fontSize: 22, color: colors.muted, transform: [{ rotate: '180deg' }] },
});
