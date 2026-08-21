#!/usr/bin/env bash
#
# deploy.sh — انتشار خودکار روی هاست
#
# چه چیزی را آپلود می‌کند:
#   1. public/build        (باندل جدید فرانت‌اند — همیشه)
#   2. public/sw.js        (نسخه جدید سرویس‌ورکر — همیشه)
#   3. public/install.php و public/install-selfheal.php (اگر موجود باشند — همیشه)
#   4. فایل‌های PHP تغییرکرده  (app, routes, config, database, resources/views, ...)
#      — تشخیص با مقایسه زمان تغییر فایل‌ها با marker «.deploy-last»
#      — با --all همه این پوشه‌ها آپلود می‌شوند (برای اولین دیپلوی یا بازنشانی)
#
# دو روش انتقال:
#   SSH : scp + اجرای دستورات artisan روی سرور (پیشنهادی اگر هاست SSH دارد)
#   FTP : curl با --ftp-create-dirs (برای هاست اشتراکی بدون SSH)
#
# تنظیمات (به‌ترتیب اولویت: متغیر محیطی ← فایل .deploy-config.local.sh):
#   DEPLOY_HOST, DEPLOY_REMOTE_PATH
#   DEPLOY_SSH_USER, DEPLOY_SSH_PORT, DEPLOY_SSH_KEY   ← برای SSH
#   DEPLOY_FTP_USER, DEPLOY_FTP_PASS                   ← برای FTP
#   DEPLOY_MIGRATE=1  → اجرای php artisan migrate --force بعد از آپلود (فقط SSH)
#
# مثال:
#   bash deploy.sh                 # دیپلوی عادی با تنظیمات فایل محلی
#   bash deploy.sh --dry-run       # فقط فهرست فایل‌ها بدون آپلود
#   bash deploy.sh --all           # آپلود کامل پوشه‌های PHP + build
#   bash deploy.sh --migrate       # بعد از آپلود migration هم اجرا شود
#   bash deploy.sh --no-cache      # کش Laravel روی سرور پاک/ساخته نشود
#
# فایل .deploy-config.local.sh نباید داخل Git برود (در .gitignore است).

set -euo pipefail

cd "$(dirname "$0")"

# ---------- پیکربندی ----------
if [[ -f .deploy-config.local.sh ]]; then
    # shellcheck disable=SC1091
    source .deploy-config.local.sh
fi

: "${DEPLOY_HOST:?DEPLOY_HOST را در .deploy-config.local.sh یا متغیر محیطی تنظیم کنید}"
: "${DEPLOY_REMOTE_PATH:?DEPLOY_REMOTE_PATH را تنظیم کنید (ریشه پروژه روی سرور)}"

DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
DEPLOY_MIGRATE="${DEPLOY_MIGRATE:-0}"

DRY_RUN=0
ALL_FILES=0
RUN_CACHE=1

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --all) ALL_FILES=1 ;;
        --migrate) DEPLOY_MIGRATE=1 ;;
        --no-cache) RUN_CACHE=0 ;;
        *) echo "آپشن ناشناخته: $arg" >&2; exit 2 ;;
    esac
done

if [[ -n "${DEPLOY_SSH_USER:-}" ]]; then
    TRANSPORT=ssh
    TARGET="${DEPLOY_SSH_USER}@${DEPLOY_HOST}"
else
    TRANSPORT=ftp
    : "${DEPLOY_FTP_USER:?برای FTP باید DEPLOY_FTP_USER و DEPLOY_FTP_PASS تنظیم شوند (یا برای SSH از DEPLOY_SSH_USER استفاده کنید)}"
    : "${DEPLOY_FTP_PASS:?DEPLOY_FTP_PASS تنظیم نشده است}"
    TARGET="ftp://${DEPLOY_HOST}"
fi

MARKER=".deploy-last"

# ---------- ساخت فهرست فایل‌ها ----------
# همیشه آپلود می‌شوند:
always=(
    public/sw.js
    public/install.php
    public/install-selfheal.php
    public/.htaccess
    public/index.php
    composer.json
    composer.lock
)

# پوشه‌هایی که فایل‌های PHP تغییرکرده از آن‌ها انتخاب می‌شوند:
scan_dirs=(app routes config database resources/views resources/fonts bootstrap)

declare -a changed_php=()
if [[ "$ALL_FILES" -eq 1 || ! -f "$MARKER" ]]; then
    # اولین دیپلوی یا --all: همه فایل‌های پوشه‌های scan_dirs
    for dir in "${scan_dirs[@]}"; do
        [[ -d "$dir" ]] && while IFS= read -r -d '' f; do changed_php+=("$f"); done < <(find "$dir" -type f \( -name '*.php' -o -path 'resources/fonts/*' \) -print0)
    done
else
    # فقط فایل‌هایی که بعد از آخرین دیپلوی تغییر کرده‌اند
    for dir in "${scan_dirs[@]}"; do
        [[ -d "$dir" ]] && while IFS= read -r -d '' f; do changed_php+=("$f"); done < <(find "$dir" -type f -newer "$MARKER" -print0)
    done
    for f in composer.json composer.lock; do
        [[ -f "$f" && "$f" -nt "$MARKER" ]] && changed_php+=("$f")
    done
fi

# ---------- خلاصه ----------
echo "== دیپلوی به $TARGET ($TRANSPORT) =="
echo "   مسیر سرور: $DEPLOY_REMOTE_PATH"
echo "   فایل‌های همیشگی: public/build + sw.js + install + index + composer"
echo "   فایل‌های PHP برای آپلود: ${#changed_php[@]}"
if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "   [dry-run] هیچ چیزی آپلود نمی‌شود:"
    printf '      %s\n' "${always[@]}" "${changed_php[@]}" | grep -v '^$'
    exit 0
fi

# ---------- آپلود ----------
upload_scp() { # $1 = مسیر محلی (فایل یا پوشه)
    scp -q -P "$DEPLOY_SSH_PORT" ${DEPLOY_SSH_KEY:+-i "$DEPLOY_SSH_KEY"} -r "$1" "${TARGET}:${DEPLOY_REMOTE_PATH}/"
}

upload_ftp() { # $1 = مسیر محلی (فقط فایل)
    curl -sS --ftp-create-dirs \
        --user "${DEPLOY_FTP_USER}:${DEPLOY_FTP_PASS}" \
        -T "$1" "${TARGET}/${DEPLOY_REMOTE_PATH}/$(dirname "$1")/"
}

echo "== مرحله ۱: public/build (باندل جدید) =="
[[ -d public/build ]] || { echo "public/build پیدا نشد — اول npm run build را اجرا کنید." >&2; exit 1; }
if [[ "$TRANSPORT" == ssh ]]; then
    upload_scp public/build
else
    while IFS= read -r -d '' f; do upload_ftp "$f"; done < <(find public/build -type f -print0)
fi
echo "   ✅ public/build آپلود شد"

echo "== مرحله ۲: فایل‌های همیشگی =="
for f in "${always[@]}"; do
    [[ -f "$f" ]] || continue
    if [[ "$TRANSPORT" == ssh ]]; then upload_scp "$f"; else upload_ftp "$f"; fi
done
echo "   ✅ sw.js / install / index / composer آپلود شد"

echo "== مرحله ۳: فایل‌های PHP تغییرکرده (${#changed_php[@]}) =="
if [[ "${#changed_php[@]}" -eq 0 ]]; then
    echo "   هیچ فایل PHP تغییرکرده‌ای نیست."
else
    for f in "${changed_php[@]}"; do
        if [[ "$TRANSPORT" == ssh ]]; then
            # اطمینان از وجود پوشه مقصد برای فایل‌های جدید
            ssh -p "$DEPLOY_SSH_PORT" ${DEPLOY_SSH_KEY:+-i "$DEPLOY_SSH_KEY"} "$TARGET" "mkdir -p '${DEPLOY_REMOTE_PATH}/$(dirname "$f")'"
            upload_scp "$f"
        else
            upload_ftp "$f"
        fi
        echo "   ✅ $f"
    done
fi

# ---------- پاک‌سازی کش روی سرور ----------
if [[ "$RUN_CACHE" -eq 1 ]]; then
    if [[ "$TRANSPORT" == ssh ]]; then
        echo "== مرحله ۴: پاک‌سازی و بازسازی کش Laravel =="
        ssh -p "$DEPLOY_SSH_PORT" ${DEPLOY_SSH_KEY:+-i "$DEPLOY_SSH_KEY"} "$TARGET" \
            "cd '${DEPLOY_REMOTE_PATH}' && php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache"
        if [[ "$DEPLOY_MIGRATE" -eq 1 ]]; then
            echo "== اجرای migrate --force =="
            ssh -p "$DEPLOY_SSH_PORT" ${DEPLOY_SSH_KEY:+-i "$DEPLOY_SSH_KEY"} "$TARGET" \
                "cd '${DEPLOY_REMOTE_PATH}' && php artisan migrate --force"
        fi
        echo "   ✅ کش ساخته شد"
    else
        echo "== مرحله ۴: پاک‌سازی کش (دستی) =="
        echo "   هاست SSH ندارد؛ از File Manager هاست این فایل‌ها را حذف کنید تا کش دوباره ساخته شود:"
        echo "     ${DEPLOY_REMOTE_PATH}/bootstrap/cache/config.php"
        echo "     ${DEPLOY_REMOTE_PATH}/bootstrap/cache/routes-*.php"
        echo "     ${DEPLOY_REMOTE_PATH}/bootstrap/cache/views-*.php"
    fi
fi

# ---------- به‌روزرسانی marker ----------
touch "$MARKER"
echo ""
echo "== دیپلوی کامل شد ✅ =="
echo "   حالا در مرورگر Ctrl+F5 بزنید تا باندل جدید (و سرویس‌ورکر v4) گرفته شود."
echo "   اگر فیلد «کلید API ملی‌پیامک» هنوز دیده نشد: F12 → این خط را بزنید:"
echo "     document.body.innerText.includes('کلید API ملی‌پیامک (اختیاری)')"
