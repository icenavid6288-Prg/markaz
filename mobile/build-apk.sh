#!/usr/bin/env bash
# ساخت APK اندروید با EAS Build (سرویس ابری اکسپو)
# اجرا:  bash build-apk.sh
# نکته: فقط بار اول باید وارد حساب اکسپو شوید (eas login)

set -e
cd "$(dirname "$0")"

echo "==> بررسی ورود به حساب اکسپو..."
if ! npx eas-cli whoami >/dev/null 2>&1; then
    echo "==> ابتدا وارد حساب اکسپو شوید (رایگان):"
    echo "    npx eas-cli login"
    echo "    (یا توکن را با متغیر محیطی EXPO_TOKEN تنظیم کنید)"
    exit 1
fi

echo "==> اتصال پروژه به EAS..."
npx eas-cli init --non-interactive 2>/dev/null || true

echo "==> شروع ساخت APK (نسخه preview)..."
npx eas-cli build --platform android --profile preview

echo
echo "✅ بعد از اتمام ساخت، لینک دانلود APK در خروجی نمایش داده می‌شود."
