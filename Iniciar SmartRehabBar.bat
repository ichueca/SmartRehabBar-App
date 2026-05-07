@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   SmartRehabBar - Inicio local
echo ============================================
echo.
echo La aplicacion se abrira por defecto en:
echo   http://localhost:5000
echo.
echo Puedes cerrar la ventana con Ctrl+C para detenerla.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start-local.ps1" %*
if errorlevel 1 goto :error

exit /b 0

:error
echo.
echo ============================================
echo   ERROR al iniciar SmartRehabBar
echo ============================================
echo.
echo Revisa el mensaje mostrado arriba y vuelve a intentarlo.
echo.
pause
exit /b 1
