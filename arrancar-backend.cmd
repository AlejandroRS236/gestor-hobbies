@echo off
rem Compila todo el backend (core + api) y lo arranca. Uso: arrancar-backend
cd /d "%~dp0"
call mvn -q install -DskipTests || exit /b 1
call mvn -pl api spring-boot:run
