@echo off
REM Starts the backend (port 5000) and the React website (port 5173) in two windows.
start "CityBite BACKEND" cmd /k "cd /d %~dp0..\backend\CityBite.Api && dotnet run --launch-profile http"
start "CityBite FRONTEND" cmd /k "cd /d %~dp0..\frontend && (if not exist node_modules npm install) && npm run dev"
echo Two windows were opened. The website opens at http://localhost:5173
echo Backend health check: http://localhost:5000/api/health
