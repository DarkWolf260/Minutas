@echo off
title Bot de WhatsApp - Minutas
echo =======================================
echo Verificando si el bot ya está corriendo...
echo =======================================

rem Busca si hay algún proceso escuchando en el puerto 3001
netstat -ano | findstr :3001 >nul
if %errorlevel% == 0 (
    echo.
    echo [ADVERTENCIA] El bot ya parece estar abierto en otra ventana.
    echo El puerto 3001 ya está en uso.
    echo.
    echo Si no ves la otra ventana, puede que se haya quedado
    echo pegado en segundo plano.
    echo.
    pause
    exit
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
