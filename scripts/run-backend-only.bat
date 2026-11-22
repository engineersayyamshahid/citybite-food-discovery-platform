@echo off
cd /d "%~dp0..\backend\CityBite.Api"
dotnet run --launch-profile http
