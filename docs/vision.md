# Gestor de hobbies (nombre pendiente)

Aplicación de escritorio personal para gestionar en un solo sitio todos mis hobbies: **figuras/coleccionismo, anime, lectura y videojuegos**. Es para uso propio y, a la vez, mi proyecto personal para el CV y las prácticas de empresa.

> Este documento resume las decisiones tomadas en una conversación previa. Sirve como punto de partida: la tecnología concreta (lenguaje, framework, base de datos) **todavía no está decidida**.

---

## Contexto

- Soy estudiante de 4º de Ingeniería Informática (intensificación en Ingeniería del Software, UCLM). Busco prácticas, por ejemplo en NTT DATA, AstroKube y Oesia.
- Ya conozco: Java + Spring Boot (API REST, Spring Security), React, MongoDB Atlas, JUnit (TDD), Vitest, SonarQube, GitHub Actions, Docker y Scrum. Todo esto lo he usado en el proyecto de clase ESIBuy.
- Este proyecto tiene que ser **distinto de ESIBuy**: una aplicación y no una web, y algo que use de verdad a diario.
- Prioridad: **algo sencillo y terminado vale más que algo ambicioso a medias**. Lo que se valora en GitHub es cómo está hecho: README, pruebas, integración continua, código ordenado y que se pueda instalar o probar.

## Plataforma

- **Aplicación de escritorio**, para el PC y el portátil. El móvil no se plantea por ahora.
- **Los dos equipos deben ver los mismos datos.** Por eso la base de datos no puede estar dentro de cada equipo: tiene que estar en un sitio común (un servidor propio o una base de datos en la nube con plan gratuito), y las dos apps se conectan a ella.
- El trabajo pesado (búsquedas, comprobación de precios, navegador en segundo plano) lo hace un **backend** y no la interfaz.

## Idea de diseño clave

**Cada hobby es una sola lista de elementos con un estado**, no varias listas separadas. Mover algo de una parte a otra consiste solo en cambiar su estado, y se puede guardar el historial de esos cambios (fecha, precio, tienda).

### Base común (todos los hobbies)
- Título
- **Imagen** (mínimo una por elemento): sale de una API cuando la hay o la subo yo.
- Estado
- **Nota con decimales**, por ejemplo 8,7 (MyAnimeList solo deja notas enteras).
- Notas personales y detalles libres.
- Lista de **enlaces**: dónde comprar, ver o leer, con su precio.

### Datos propios de cada hobby

| Hobby | Estados | Datos propios |
|---|---|---|
| **Figuras** | Me gusta → Pensando comprar → Reservada → La tengo (+ Descartada) | Tienda, precio, gastos de envío, fecha límite de reserva, fecha de salida, fabricante, método de pago, riesgo, código **JAN** |
| **Anime** | Quiero verlo → Viendo → Visto / Abandonado | Episodios, temporada, dónde verlo |
| **Lectura** | Pendiente → Leyendo → Leído / Abandonado | Tipo: **novela** (de autor publicado o **novela web**) o **manga / manhwa / manhua**; capítulo por el que voy |
| **Videojuegos** | Pendiente → Jugando → Terminado | Plataforma, horas (estilo Steam) |

Las tres partes de las figuras ("las que tengo", "las que me gustan" y "las que estoy pensando comprar") son estados de esta misma lista. La de "pensando comprar" será la que más use. Ahora mismo la llevo en una hoja de cálculo con estas columnas: Figura, Tienda, Precio, Envío, Total, Salida, Pedir antes de, Riesgo, Estado, Fabricante, Notas, Método pago y Enlace. Además, cada figura tiene "alternativas" en otras tiendas.

## Fases

1. **Figuras**: imágenes, estados, alternativas por tienda y enlaces añadidos a mano. → Primera versión **terminada y utilizable**.
2. **Anime y lectura**, sobre la misma base común.
   - Importar mi lista de **MyAnimeList** (tiene exportación) para no meterla a mano.
   - Imágenes de APIs públicas: AniList para anime y Open Library para libros, por ejemplo.
   - "Dónde verlo" en España: APIs gratuitas como TMDB (proveedores de streaming).
3. **Botones "Buscar" y "Comparar"**, con tiendas configurables (ver abajo).
4. **Videojuegos** (estilo Steam; quizá importando desde Steam) y extras: estadísticas, avisos de fechas límite, etc.

## Fase 3: buscar y comparar (sin IA)

Decisión: **no usar IA** en la app. Todo se hace con un **navegador en segundo plano** (headless: Playwright, Selenium o similar) y lectura de páginas (scraping).

### Botón "Buscar"
- Busca en **mi lista de tiendas de confianza** usando la URL de búsqueda de cada una.
- Cuando se pueda, busca por **código JAN** (código de barras) y no por el nombre: así da en la figura exacta.
- Si no encuentra algo en mis tiendas, puede tirar de un buscador en segundo plano para encontrar más páginas.
- Me enseña los resultados y yo **reviso y borro** lo que no quiera.

### Botón "Comparar"
- Revisa los enlaces ya guardados: precio actual, disponibilidad (en stock, reserva, agotada) y fechas.
- Compara con el precio guardado y marca cambios y ofertas. Útil para comprobar si las rebajas (Black Friday) son reales: en España, el precio tachado de una rebaja debe ser el más bajo de los 30 días anteriores.
- Para leer el precio, primero usa los datos estructurados que llevan muchas tiendas (schema.org `Product`/`Offer`) y, si no hay, un selector propio de esa tienda.
- Las tiendas que solo funcionan con JavaScript (por ejemplo Xtralife) se abren con el navegador en segundo plano.

### Tiendas configurables desde la app (menos mantenimiento)
Las tiendas son **datos, no código**: añadir, editar o quitar una no requiere commits ni PR.
- **Añadir tienda**: un formulario con:
  - Nombre.
  - URL de búsqueda con un hueco, por ejemplo `https://figuya.com/en/search?q={busqueda}`.
  - Modo de lectura del precio y el stock: automático (datos estándar) o manual (en qué parte de la página está el precio).
  - Botón **"Probar"** antes de guardar.
- **Editar / eliminar tienda.**
- **Volver a añadir un enlace** que quité sin repetir la búsqueda.
- Las tiendas raras (que piden iniciar sesión o pulsar botones) seguirán necesitando código: son la excepción.

### Errores: panel de estado de las tiendas
- Para cada tienda: última vez que funcionó y, si falla, el motivo ("no carga", "no encuentra el precio", "bloqueada").
- Así sé enseguida cuál revisar, ya sea editando su configuración o en el código.

### Normas
- **No saltarse protecciones anti-bot** (captchas, bloqueos). Si una web bloquea, se marca como "bloqueada, revisar a mano" y la app me deja el enlace.
- Pocas peticiones y espaciadas: con una comprobación al día basta para uso personal.

## Tiendas que uso ahora mismo (para empezar)

Figuya, Good Smile Europe, Xtralife, Frikanime, Myth Factory, Elbenwald, Jedishop, Japan&Co, Dark Side Toy, Vendilo y Wallapop (este último solo para ver si un anuncio sigue activo).

## Por decidir en la nueva conversación

- [ ] Tecnología de la app de escritorio y del backend (aprovechar Java/Spring Boot y React o probar algo nuevo).
- [ ] Base de datos y dónde alojarla para compartirla entre el PC y el portátil.
- [ ] Estructura del repositorio, pruebas e integración continua desde el principio.
- [ ] Nombre del proyecto.
