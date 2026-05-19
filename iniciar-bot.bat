@echo off
title Bot de WhatsApp - Minutas
echo =======================================
echo Verificando si el bot ya está corriendo...
echo =======================================

rem Busca si hay algún proceso escuchando en el puerto 3001
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

echo.
echo Iniciando Bot de WhatsApp...
echo No cierres esta ventana mientras uses la app.
echo =======================================
echo.

cd whatsapp-bot
npm start

echo.
echo =======================================
echo El bot se ha detenido.
echo =======================================
pause
