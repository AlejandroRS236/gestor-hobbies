@echo off
rem Genera el instalador de Windows: desktop\dist\Gestor-de-hobbies-<version>-instalador.exe
rem Necesita Java 21 o superior (con jlink), Maven y Node.js. La primera vez descarga bastantes cosas.
setlocal
cd /d "%~dp0"

echo [1/4] Compilando la interfaz...
cd frontend
call npm install || exit /b 1
call npm run build || exit /b 1
cd ..

echo [2/4] Compilando el backend (con la interfaz dentro)...
call mvn -q clean package -DskipTests || exit /b 1

echo [3/4] Preparando un Java propio para la app...
if exist desktop\recursos\jre rmdir /s /q desktop\recursos\jre
jlink --add-modules java.se,jdk.unsupported,jdk.zipfs,jdk.localedata,jdk.charsets --include-locales=es,en --strip-debug --no-header-files --no-man-pages --output desktop\recursos\jre || exit /b 1

echo [4/4] Creando el instalador...
cd desktop
call npm install || exit /b 1
call npm run empaquetar || exit /b 1
cd ..

echo.
echo Listo. El instalador esta en desktop\dist
explorer desktop\dist
