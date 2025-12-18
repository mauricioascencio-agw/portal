@echo off
echo Instalando dependencias...
call npm install --legacy-peer-deps
echo.
echo Iniciando servidor de desarrollo...
call npm start
pause
