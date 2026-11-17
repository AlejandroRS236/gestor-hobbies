#!/usr/bin/env sh
# Compila todo el backend (core + api) y lo arranca. Uso: ./arrancar-backend.sh
cd "$(dirname "$0")" && mvn -q install -DskipTests && mvn -pl api spring-boot:run
