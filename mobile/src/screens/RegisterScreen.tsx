import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '../components';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';

export function RegisterScreen({ onGoLogin }: { onGoLogin: () => void }) {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setError(null);
        if (!name.trim() || !email.trim() || !password) {
            setError('همه فیلدها را پر کنید.');
            return;
        }
        if (password !== confirm) {
            setError('رمز عبور و تکرار آن یکسان نیست.');
            return;
        }
        setBusy(true);
        try {
            await register(name.trim(), email.trim(), password);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'خطا در ثبتنام. دوباره تلاش کنید.');
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
                    <Text style={styles.title}>ساخت حساب کاربری</Text>
                    <Text style={styles.subtitle}>به جمع یادگیرندگان مرکز رشد بپیوندید</Text>

                    <View style={styles.form}>
                        <Field label="نام و نام خانوادگی" value={name} onChangeText={setName} placeholder="مثلاً: علی محمدی" />
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
                            autoComplete="password-new"
                            placeholder="حداقل ۸ کاراکتر"
                        />
                        <Field
                            label="تکرار رمز عبور"
                            value={confirm}
                            onChangeText={setConfirm}
                            secureTextEntry
                            autoComplete="password-new"
                            placeholder="••••••••"
                        />
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <PrimaryButton title="ثبتنام" onPress={submit} loading={busy} />

                        <Pressable onPress={onGoLogin} style={styles.switchRow}>
                            <Text style={styles.switchText}>قبلاً ثبتنام کردهاید؟ </Text>
                            <Text style={styles.switchLink}>وارد شوید</Text>
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
        paddingVertical: spacing.xxl,
    },
    title: { ...typography.title, color: colors.text, textAlign: 'center' },
    subtitle: { ...typography.small, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl },
    form: { gap: 4 },
    error: { ...typography.small, color: colors.danger, marginBottom: spacing.md },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
    switchText: { color: colors.muted, fontSize: 14 },
    switchLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
