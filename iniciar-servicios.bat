@echo off
title Minutas - Inicializador de Servicios
echo ====================================================
echo   MINUTAS - SISTEMA DE INICIO AUTOMATICO (PROD)
echo ====================================================
echo.

rem 1. Esperar a que el motor de Docker (Rancher Desktop) este listo
echo [1/4] Verificando estado del motor Docker...
:wait_docker
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ESPERANDO] Docker no responde aun. Reintentando en 5 segundos...
    timeout /t 5 /nobreak >nul
    goto wait_docker
)
echo [OK] Docker esta activo y corriendo.
echo.

rem 2. Iniciar base de datos de Supabase local
echo [2/4] Iniciando contenedores locales de Supabase...
call npx supabase start --ignore-health-check

rem Verificar si el contenedor de la base de datos realmente quedó corriendo
docker ps --filter "name=supabase_db_Minutas" --filter "status=running" | findstr supabase_db_Minutas >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo iniciar Supabase. Revisa si Docker esta corriendo bien.
    pause
    exit /b 1
)
echo [OK] Supabase esta corriendo correctamente.
echo.

rem 3. Iniciar el Bot de WhatsApp en una ventana independiente
echo [3/4] Lanzando el Bot de WhatsApp en segundo plano...
start "Bot de WhatsApp - Minutas" cmd /k "cd whatsapp-bot && npm start"
echo [OK] Comando del bot lanzado.
echo.

rem 4. Iniciar el servidor Frontend (Vite Preview) en modo Produccion
echo [4/4] Levantando servidor web local en el puerto 4173...
start "Servidor Web - Minutas" cmd /k "npx vite preview --port 4173 --host"
echo [OK] Servidor web lanzado.
echo.

echo ====================================================
echo [LISTO] Todos los servicios han sido lanzados.
echo Abriendo la aplicacion en el navegador...
echo ====================================================
timeout /t 3 /nobreak >nul
start http://localhost:4173
exit
