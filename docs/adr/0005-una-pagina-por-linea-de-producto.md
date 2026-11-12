# 0005. Una página por línea de producto

- **Estado:** Aceptada
- **Fecha:** 2026-11-07

## Contexto

El sitio nació como una sola página de aretes. Al sumar los kits navideños, las dos líneas tienen públicos, temporadas y flujos de compra distintos (catálogo + WhatsApp contra formulario a la medida).

## Decisión

- `/` es una portada que presenta el taller y deja elegir la línea.
- `/aretes/` y `/kits-navidenos/` son páginas independientes, cada una con sus secciones, preguntas frecuentes y mensaje de WhatsApp.
- Unas **pestañas fijas** bajo el encabezado permiten cambiar de línea desde cualquier página.
- `Base.astro` recibe la línea actual (`inicio`, `aretes` o `kits`) y con ella decide la pestaña activa, los enlaces del encabezado y el saludo de WhatsApp.
- Los enlaces viejos (`/#producto/…`, `/?coleccion=…`) se redirigen a `/aretes/` para no romper lo ya compartido.

## Alternativas consideradas

- **Una página con pestañas que muestran u ocultan secciones:** choca con el estado del visor en la URL (`#producto/…`) y diluye el SEO de cada línea.
- **Subdominios por línea:** más configuración de dominio sin beneficio claro.

## Consecuencias

- Cada línea tiene su URL, título y descripción para buscadores y para compartir.
- Una tercera línea de producto es una página más, un valor más en `Linea` (`src/config/rutas.ts`) y una pestaña más.
