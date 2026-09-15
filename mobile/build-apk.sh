#!/usr/bin/env bash
# ساخت APK اندروید با EAS Build (سرویس ابری اکسپو)
#
# اجرا:
#   bash build-apk.sh https://example.com
#   bash build-apk.sh http://192.168.1.10:8000
#   EXPO_PUBLIC_API_URL=https://example.com bash build-apk.sh
#
# اگر آدرس داده نشود و در eas.json هم مقداردهی نشده باشد، ساخت با هشدار ادامه پیدا نمی‌کند
# (چون APK با آدرس localhost روی گوشی به هیچ سروری وصل نمی‌شود).
# نکته: فقط بار اول باید وارد حساب اکسپو شوید (eas login)

set -e
cd "$(dirname "$0")"

API_URL="${1:-${EXPO_PUBLIC_API_URL:-}}"
PROFILE="${EAS_PROFILE:-preview}"

if [ -n "$API_URL" ]; then
    case "$API_URL" in
        http://localhost*|http://127.*|https://localhost*|http://0.0.0.0*)
            echo "⚠️  آدرس «$API_URL» فقط روی شبیه‌ساز کار می‌کند، نه روی گوشی واقعی." >&2
            ;;
    esac

    echo "==> ثبت آدرس سرور در eas.json (پروفایل $PROFILE): $API_URL"
    node -e '
        const fs = require("fs");
        const url = process.argv[1];
        const profile = process.argv[2];
        const file = "eas.json";
        const config = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const name of [profile, "production"]) {
            const target = config.build?.[name];
            if (!target) continue;
            target.env = { ...(target.env || {}), EXPO_PUBLIC_API_URL: url };
        }
        fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
    ' "$API_URL" "$PROFILE"
else
    echo "==> آدرسی داده نشد؛ از مقدار موجود در eas.json استفاده می‌شود."
fi

echo "==> بررسی ورود به حساب اکسپو..."
if ! npx eas-cli whoami >/dev/null 2>&1; then
    echo "==> ابتدا وارد حساب اکسپو شوید (رایگان):"
    echo "    npx eas-cli login"
    echo "    (یا توکن را با متغیر محیطی EXPO_TOKEN تنظیم کنید)"
    exit 1
fi

echo "==> اتصال پروژه به EAS..."
npx eas-cli init --non-interactive 2>/dev/null || true

echo "==> شروع ساخت APK (پروفایل $PROFILE)..."
npx eas-cli build --platform android --profile "$PROFILE"

echo
echo "✅ بعد از اتمام ساخت، لینک دانلود APK در خروجی نمایش داده می‌شود."
