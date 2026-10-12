@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Connexion a votre compte Expo ===
echo Repondez aux questions qui apparaissent.
echo Le mot de passe ne s affiche pas quand vous le tapez : c est normal.
echo.
call npx expo login
echo.
call npx expo whoami
echo.
echo Si votre nom d utilisateur s affiche ci-dessus, c est bon : lancez demarrer.bat
pause
