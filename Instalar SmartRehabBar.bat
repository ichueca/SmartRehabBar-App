@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   SmartRehabBar - Instalacion local
echo ============================================
echo.
echo Este asistente instalara dependencias y
echo preparara la base de datos SQLite local.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\install-local.ps1" %*
if errorlevel 1 goto :error

echo.
echo ============================================
echo   Instalacion completada correctamente
echo ============================================
echo.
echo Siguiente paso: ejecutar "Iniciar SmartRehabBar.bat"
echo.
pause
exit /b 0

:error
echo.
echo ============================================
echo   ERROR en la instalacion
echo ============================================
echo.
echo Revisa el mensaje mostrado arriba y vuelve a intentarlo.
echo.
pause
exit /b 1
