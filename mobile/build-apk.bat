@echo off
REM Build the Android APK with EAS Build (Expo cloud service).
REM Usage:  build-apk.bat https://example.com
REM         build-apk.bat http://192.168.1.10:8000
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "API_URL=%~1"
if "%API_URL%"=="" set "API_URL=%EXPO_PUBLIC_API_URL%"
set "PROFILE=%EAS_PROFILE%"
if "%PROFILE%"=="" set "PROFILE=preview"

if not "%API_URL%"=="" (
    echo ==^> Setting server URL in eas.json ^(profile %PROFILE%^): %API_URL%
    call node -e "const fs=require('fs');const url=process.argv[1],profile=process.argv[2];const file='eas.json';const config=JSON.parse(fs.readFileSync(file,'utf8'));for(const name of [profile,'production']){const target=config.build&&config.build[name];if(!target)continue;target.env=Object.assign({},target.env,{EXPO_PUBLIC_API_URL:url});}fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');" "%API_URL%" "%PROFILE%"
) else (
    echo ==^> No URL given; using the value already stored in eas.json.
)

echo ==^> Checking Expo login...
call npx eas-cli whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo Please sign in to your free Expo account first:
    echo     npx eas-cli login
    echo Or set the EXPO_TOKEN environment variable.
    exit /b 1
)

echo ==^> Linking the project to EAS...
call npx eas-cli init --non-interactive >nul 2>&1

echo ==^> Building the APK ^(profile %PROFILE%^)...
call npx eas-cli build --platform android --profile %PROFILE%

echo.
echo The download link for the .apk file is printed when the build finishes.
