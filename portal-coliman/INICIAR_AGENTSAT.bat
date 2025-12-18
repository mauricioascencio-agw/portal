@echo off
echo ========================================
echo   Portal AgentSat - Inicio Completo
echo ========================================
echo.
echo Levantando servicios con Docker...
echo.

docker-compose up --build -d

echo.
echo Esperando a que los servicios esten listos (30 segundos)...
timeout /t 30 /nobreak

echo.
echo Creando usuario SuperAdmin...
docker exec -it agentsat_backend python crear_superadmin_simple.py

echo.
echo ========================================
echo   LISTO!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8001
echo   API Docs: http://localhost:8001/docs
echo   MySQL: localhost:3308
echo.
echo   Usuario: inge.mauricio.ascencio@gmail.com
echo   Password: Admin123!
echo.
echo ========================================
pause
