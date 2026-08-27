import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '../components';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';

export function LoginScreen({ onGoRegister }: { onGoRegister: () => void }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setError(null);
        if (!email.trim() || !password) {
            setError('ایمیل و رمز عبور را وارد کنید.');
            return;
        }
        setBusy(true);
        try {
            await login(email.trim(), password);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در ورود. دوباره تلاش کنید.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>مرکز رشد</Text>
                    </View>
                    <Text style={styles.title}>ورود به حساب کاربری</Text>
                    <Text style={styles.subtitle}>برای ادامه، وارد حساب خود شوید</Text>

                    <View style={styles.form}>
                        <Field
                            label="ایمیل"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            placeholder="you@example.com"
                            style={{ textAlign: 'left' }}
                        />
                        <Field
                            label="رمز عبور"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                            placeholder="••••••••"
                        />
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <PrimaryButton title="ورود" onPress={submit} loading={busy} />

                        <Pressable onPress={onGoRegister} style={styles.switchRow}>
                            <Text style={styles.switchText}>حساب ندارید؟ </Text>
                            <Text style={styles.switchLink}>ثبتنام کنید</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    logo: {
        alignSelf: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginBottom: spacing.xl,
    },
    logoText: { color: colors.white, fontWeight: '800', fontSize: 18 },
    title: { ...typography.title, color: colors.text, textAlign: 'center' },
    subtitle: { ...typography.small, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl },
    form: { gap: 4 },
    error: { ...typography.small, color: colors.danger, marginBottom: spacing.md },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
    switchText: { color: colors.muted, fontSize: 14 },
    switchLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
