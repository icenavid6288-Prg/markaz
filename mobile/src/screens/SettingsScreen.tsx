import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '../components';
import { getServerUrl, resetServerUrl, setServerUrl } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';

export function SettingsScreen() {
    const [url, setUrl] = useState('');
    const [defaultUrl, setDefaultUrl] = useState('');
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getServerUrl().then(setUrl);
        getServerUrl().then((u) => setDefaultUrl(u));
    }, []);

    const save = async () => {
        setMsg(null);
        setBusy(true);
        try {
            const normalized = await setServerUrl(url);
            setUrl(normalized);
            setMsg({ text: `ذخیره شد. اپلیکیشن به «${normalized}» متصل میشود.`, ok: true });
        } catch (e) {
            setMsg({ text: e instanceof Error ? e.message : 'خطا در ذخیرهسازی', ok: false });
        } finally {
            setBusy(false);
        }
    };

    const reset = async () => {
        setMsg(null);
        setBusy(true);
        try {
            const normalized = await resetServerUrl();
            setUrl(normalized);
            setMsg({ text: `بازنشانی شد. اتصال به «${normalized}».`, ok: true });
        } catch {
            setMsg({ text: 'خطا در بازنشانی', ok: false });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Screen>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.title}>تنظیمات سرور</Text>
                        <Text style={styles.hint}>
                            اپلیکیشن به وبسایت مرکز رشد متصل میشود. اگر سایت روی هاست یا سرور دیگری است،
                            آدرس آن را اینجا وارد کنید.
                        </Text>

                        <Field
                            label="آدرس سایت (سرور)"
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://example.com"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{ textAlign: 'left' }}
                        />

                        {msg ? (
                            <Text style={[styles.msg, msg.ok ? styles.msgOk : styles.msgErr]}>{msg.text}</Text>
                        ) : null}

                        <View style={styles.row}>
                            <View style={styles.btnWrap}>
                                <PrimaryButton title="ذخیره" onPress={save} loading={busy} />
                            </View>
                            <View style={styles.btnWrap}>
                                <PrimaryButton title="پیشفرض" variant="secondary" onPress={reset} loading={busy} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.note}>
                        <Text style={styles.noteTitle}>نکته برای تست روی گوشی</Text>
                        <Text style={styles.noteText}>
                            وقتی اپلیکیشن روی گوشی اجرا میشود، «localhost» به خود گوشی اشاره میکند.
                            برای اتصال به سرور رایانهی خود، بهجای آن آدرس آیپی رایانه در شبکهی محلی را
                            وارد کنید (مثلاً http://192.168.1.10:8000) و مطمئن شوید سرور لاراول با
                            php artisan serve --host=0.0.0.0 اجرا شده است.
                        </Text>
                        <Text style={styles.noteText}>
                            برای نسخهی نهایی، آدرس دامنهی اینترنتی سایت (مثلاً https://example.com) را وارد کنید.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { padding: spacing.lg, paddingBottom: spacing.xxl },
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        padding: spacing.lg,
    },
    title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
    hint: { ...typography.small, color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
    msg: { ...typography.small, marginBottom: spacing.md },
    msgOk: { color: colors.primary },
    msgErr: { color: colors.danger },
    row: { flexDirection: 'row', gap: spacing.md },
    btnWrap: { flex: 1 },
    note: {
        marginTop: spacing.lg,
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.sm,
    },
    noteTitle: { ...typography.heading, color: colors.primaryDark },
    noteText: { ...typography.small, color: colors.text, lineHeight: 22 },
});
