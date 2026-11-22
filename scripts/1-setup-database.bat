@echo off
REM ------------------------------------------------------------
REM Creates the CityBite database and tables in SQL Server Express.
REM Run this ONCE. Needs "sqlcmd" (installed with SQL Server / SSMS).
REM ------------------------------------------------------------
cd /d "%~dp0..\backend"
echo Creating database CityBite ...
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "IF DB_ID('CityBite') IS NULL CREATE DATABASE CityBite"
echo Creating tables ...
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database\01_Schema.sql
echo Adding areas, cuisines, food types and promotion packages ...
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database\02_Seed_Lookups.sql
echo.
echo Done. Next: scripts\2-seed-demo-data.bat
pause
