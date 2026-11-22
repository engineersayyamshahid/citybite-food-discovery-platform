@echo off
REM Fills the database with demo restaurants, dishes, reviews, bills and users.
REM Run ONCE after 1-setup-database.bat. (Needs the .NET 10 SDK.)
cd /d "%~dp0..\backend\CityBite.Api"
dotnet run -- --seed-demo
echo.
echo Done. Next: scripts\3-run-all.bat
pause
