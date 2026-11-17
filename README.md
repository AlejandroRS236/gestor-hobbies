# Gestor de hobbies

[![CI](https://github.com/AlejandroRS236/gestor-hobbies/actions/workflows/ci.yml/badge.svg)](https://github.com/AlejandroRS236/gestor-hobbies/actions/workflows/ci.yml)

Aplicación de escritorio personal para gestionar en un solo sitio mis hobbies: figuras/coleccionismo, anime, lectura y videojuegos. Los datos están en una base de datos en la nube, así que el PC y el portátil ven lo mismo.

> Proyecto en construcción. La visión completa y las decisiones de diseño están en [docs/vision.md](docs/vision.md).

## Arquitectura

```
gestor-hobbies/
├── core/       Java + Spring Boot: modelo, servicios y persistencia (JPA + Flyway)
├── api/        Spring Boot REST: la puerta de entrada que usa la interfaz
├── frontend/   React + Vite + TypeScript
└── desktop/    Electron: abre la ventana y arranca el backend
```

La lógica vive en `core` y no depende de la interfaz: la API y el frontend se pueden cambiar sin tocarla.

**Idea clave del modelo:** cada hobby es una sola lista de elementos con un estado. Pasar una figura de "Pensando comprar" a "Reservada" es solo cambiar su estado. Cada elemento tiene enlaces (tienda, URL, precio, envío); en las figuras, esos enlaces son las alternativas en distintas tiendas y la app calcula cuál sale más barata con el envío incluido.

## Requisitos

- Java 21 y Maven
- Node.js 22
- Una base de datos PostgreSQL (por ejemplo, el plan gratuito de [Supabase](https://supabase.com))

## Puesta en marcha (desarrollo)

1. Copia `.env.example` como `.env` y rellena los datos de la base de datos, o define las variables `DB_URL`, `DB_USER` y `DB_PASSWORD`.
2. Backend:
   ```bash
   mvn -pl api -am spring-boot:run
   ```
   Flyway crea las tablas la primera vez.
3. Frontend (en otra terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Abre http://localhost:5173.

## Pruebas

```bash
mvn verify               # backend (JUnit)
cd frontend && npm test  # frontend (Vitest + Testing Library)
```

La integración continua (GitHub Actions) ejecuta ambas en cada push.

## Hoja de ruta

- [x] Esqueleto del proyecto, modelo de figuras y API básica
- [ ] Fase 1: figuras completas (formularios, imágenes, alternativas por tienda) y app de escritorio instalable
- [ ] Fase 2: anime y lectura (importación desde MyAnimeList, imágenes de AniList y Open Library)
- [ ] Fase 3: botones "Buscar" y "Comparar" con tiendas configurables
- [ ] Fase 4: videojuegos, estadísticas y avisos de fechas límite
