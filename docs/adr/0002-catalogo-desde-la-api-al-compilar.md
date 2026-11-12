# 0002. El catálogo se lee de la API al compilar

- **Estado:** Aceptada
- **Fecha:** 2026-11-02

## Contexto

El catálogo empezó como JSON en el repositorio editados con Pages CMS. Con [back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado) el dueño administra productos, categorías, colores y aromas de kits, y fotos desde un panel propio. La API corre en hardware propio detrás de Cloudflare Tunnel: es barata, pero no tiene la disponibilidad de un CDN.

## Decisión

Antes de cada build, `scripts/sincronizar-api.mjs` inicia sesión en la API, descarga el catálogo y las fotos a `src/content/` (fuera de git) y escribe `catalogo-api.json`. El sitio se compila con esos datos como si fueran archivos locales. `CatalogoRepository` oculta de dónde vienen.

- Si una ruta todavía no existe en la API (`404`), se sigue sin esos datos y se usan los valores de respaldo de `src/config/sitio.ts` o de los JSON del repositorio.
- Si la API no responde o un dato no pasa los esquemas Zod, **el build falla** y sigue en línea la versión anterior.
- El panel publica con un Deploy Hook de Vercel (botón **Publicar sitio**).

## Alternativas consideradas

- **Leer la API en cada visita (SSR o desde el navegador):** el sitio heredaría la disponibilidad del servidor de casa.
- **Fotos servidas directamente desde la API:** se pierde la optimización de imágenes de Astro y cada visita carga el túnel.
- **Seguir solo con Pages CMS:** no alcanza para pedidos, opciones de kits ni el diseñador.

## Consecuencias

- Las visitas nunca tocan la API para leer; solo para escribir (pedidos, diseños).
- Los cambios del panel tardan en verse lo que tarda un build, y alguien tiene que presionar **Publicar sitio**.
- Las credenciales de la API solo existen en el entorno de build.
- El front y el back pueden desplegarse en cualquier orden gracias a la tolerancia a `404`.
