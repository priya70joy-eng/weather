@echo off
title WeatherApp Server
color 0A
echo.
echo  ==========================================
echo    WeatherApp - Starting Server...
echo  ==========================================
echo.
cd /d "%~dp0backend"
echo  Checking Node.js...
node --version
echo.
echo  Installing dependencies (first time only)...
npm install --silent
echo.
echo  Starting WeatherApp server...
echo.
echo  ==========================================
echo   Admin Panel : http://localhost:3001/admin
echo   User Portal : http://localhost:3001/user
echo  ==========================================
echo.
echo  Keep this window open while using the app!
echo  Press Ctrl+C to stop the server.
echo.
node server.js
pause
