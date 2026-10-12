@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Installation de l appli impots (premiere fois seulement) ===
echo Cela peut prendre 3 a 5 minutes.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n est pas installe. Installez la version LTS depuis https://nodejs.org puis relancez ce fichier.
  pause
  exit /b 1
)
call npm install expo@latest
call npx expo install react react-native expo-status-bar react-dom react-native-web @expo/metro-runtime
call npx expo install typescript @types/react -- --save-dev
call npx expo install --fix
echo.
echo === Installation terminee. Lancez maintenant demarrer.bat ===
pause
