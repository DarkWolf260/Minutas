@echo off
title Bot de WhatsApp - Minutas
cd /d "%~dp0"

echo =======================================
echo Verificando si el bot ya esta corriendo...
echo =======================================

rem Busca si hay algun proceso escuchando en el puerto 3001
netstat -ano | findstr :3001 >nul
if %errorlevel% == 0 (
    echo.
    echo [ADVERTENCIA] El puerto 3001 ya esta en uso.
    echo Forzando cierre del proceso en segundo plano...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo Proceso anterior cerrado exitosamente.
    echo.
)

rem Limpia posibles instancias zombies de Edge/Chromium/Puppeteer que bloquean la sesion
powershell -NoProfile -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and ($_.CommandLine -like '*whatsapp-bot*session*' -or $_.ExecutablePath -like '*\.cache\puppeteer\*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1


cd whatsapp-bot

echo.
echo Iniciando Bot de WhatsApp (Microsoft Edge)...
echo No cierres esta ventana mientras uses la app.
echo =======================================
echo.

if exist "dist\MinutasWhatsAppBot.exe" (
    "dist\MinutasWhatsAppBot.exe"
) else (
    call npm start
)

echo.
echo =======================================
echo El bot se ha detenido.
echo =======================================
pause
