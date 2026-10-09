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

cd whatsapp-bot

rem Verifica si existen los modulos instalados
if not exist "node_modules\" (
    echo.
    echo ==============================================================
    echo [INFO] No se encontraron dependencias instaladas en whatsapp-bot.
    echo Instalando paquetes automaticamente con npm install...
    echo (Esto puede tardar unos minutos descargando Puppeteer/Chromium)
    echo ==============================================================
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] La instalacion de dependencias fallo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas con exito.
    echo.
)

echo.
echo Iniciando Bot de WhatsApp...
echo No cierres esta ventana mientras uses la app.
echo =======================================
echo.

call npm start

echo.
echo =======================================
echo El bot se ha detenido.
echo =======================================
pause
