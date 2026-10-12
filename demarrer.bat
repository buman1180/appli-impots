@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Demarrage de l appli ===
echo Scannez le QR code qui va apparaitre avec Expo Go (Android) ou l appareil photo (iPhone).
echo Le telephone et l ordinateur doivent etre sur le meme Wi-Fi.
echo Pour arreter : fermez cette fenetre.
echo.
call npx expo start
pause
