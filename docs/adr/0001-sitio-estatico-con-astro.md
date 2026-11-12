# 0001. Sitio estático con Astro

- **Estado:** Aceptada
- **Fecha:** 2026-10-21

## Contexto

aalcuadrado es un taller pequeño: el catálogo cambia pocas veces por semana, casi todas las visitas llegan desde el celular y las ventas se cierran por chat. No hay presupuesto para servidores ni tiempo para mantenerlos.

## Decisión

Generar el sitio completo al compilar con **Astro** (`output: 'static'`), en TypeScript estricto y sin frameworks de UI. La interactividad (visor, filtros, formularios) va en islas de TypeScript nativo que solo se cargan donde se usan. Se publica en el CDN de Vercel.

## Alternativas consideradas

- **SPA (React/Vue) con API en vivo:** más JavaScript en el celular, depende de la API en cada visita y requiere SEO adicional.
- **SSR en un servidor propio:** más flexible, pero agrega un servidor que mantener y que se puede caer.
- **Constructor de sitios (Wix, Shopify):** rápido de arrancar, pero con costo mensual y poco control sobre el diseño y el flujo de pedidos.

## Consecuencias

- Carga rápida y hospedaje gratuito; el sitio no tiene estado que se pueda corromper.
- Las imágenes se optimizan al compilar (`astro:assets`, AVIF/WebP, `srcset`) sin servicios externos.
- Cualquier cambio de contenido requiere un build nuevo (ver [0002](0002-catalogo-desde-la-api-al-compilar.md)).
- Si algún día se necesita algo en vivo (inventario, carrito), Astro permite marcar solo esas rutas como dinámicas con un adaptador, sin reescribir componentes.
