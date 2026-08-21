#!/usr/bin/env bash
#
# تنظیمات محلی دیپلوی — این فایل را کپی کنید و مقادیر واقعی را وارد کنید:
#   cp .deploy-config.example.sh .deploy-config.local.sh
# فایل .deploy-config.local.sh هرگز نباید داخل Git برود (در .gitignore است).

# هاست (برای SSH و FTP یکی است — آدرس دامنه یا IP سرور)
export DEPLOY_HOST="ftp.example.com"

# مسیر ریشه پروژه روی سرور (جایی که artisan در آن قرار دارد)
export DEPLOY_REMOTE_PATH="/home/user/domains/example.com/public_html"

# ---------- حالت SSH (پیشنهادی) ----------
# اگر DEPLOY_SSH_USER خالی باشد، اسکریپت به حالت FTP می‌رود.
export DEPLOY_SSH_USER=""
export DEPLOY_SSH_PORT="22"
# مسیر کلید خصوصی (اختیاری — اگر خالی بود از ssh-agent/پیش‌فرض استفاده می‌شود)
export DEPLOY_SSH_KEY=""
# بعد از آپلود migration هم اجرا شود؟ (0 یا 1)
export DEPLOY_MIGRATE="0"

# ---------- حالت FTP (هاست اشتراکی بدون SSH) ----------
export DEPLOY_FTP_USER=""
export DEPLOY_FTP_PASS=""
