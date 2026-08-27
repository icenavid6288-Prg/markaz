@echo off
REM ساخت APK اندروید با EAS Build — اجرا:  build-apk.bat
cd /d "%~dp0"

echo ==^> بررسي ورود به حساب اکسپو...
call npx eas-cli whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo ابتدا وارد حساب اکسپو شويد ^(رايگان^):
    echo     npx eas-cli login
    exit /b 1
)

echo ==^> اتصال پروژه به EAS...
call npx eas-cli init --non-interactive >nul 2>&1

echo ==^> شروع ساخت APK ^(نسخه preview^)...
call npx eas-cli build --platform android --profile preview

echo.
echo بعد از اتمام ساخت، لينک دانلود APK در خروجي نمايش داده مي‌شود.
