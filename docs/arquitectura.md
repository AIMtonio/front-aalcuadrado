# Arquitectura de aalcuadrado

## Resumen

Sitio **100 % estático** hecho con **Astro + TypeScript (modo estricto)**. Al compilar, Astro lee los JSON de productos, optimiza las fotos y genera tres páginas: la portada (`/`), los aretes (`/aretes/`) los kits navideños (`/kits-navidenos/`) y las velas personalizadas (`/velas/`). El navegador no llama a ninguna API: los productos y las fotos que se administran desde el panel de [back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado) se descargan al compilar (ver *Productos y fotos desde la API*).

La vista general (contexto, contenedores y flujos) está en el [README](../README.md); las decisiones, en [adr/](adr/). Este documento entra al detalle de cada capa.

```mermaid
flowchart TB
  subgraph UI["Presentación (src/pages, src/components, src/scripts)"]
    P["Páginas: / · /aretes/ · /kits-navidenos/ · /velas/"]
    C[Componentes .astro]
    JS["Islas del navegador<br/>visor · tarjetas · filtros · kit · diseñador"]
  end

  subgraph SERV["Servicios (src/services)"]
    PED["CanalPedidos<br/>(hoy: CanalWhatsApp)"]
    CLI["ClienteEncargos · ClienteDisenos"]
  end

  subgraph DATOS["Acceso a datos (src/data)"]
    REPO["CatalogoRepository<br/>(interfaz)"]
    LOCAL[CatalogoArchivosLocales]
  end

  subgraph DOM["Dominio (src/domain)"]
    Z["Esquemas Zod y reglas puras<br/>catálogo · kits · velas · diseños"]
  end

  CFG["Configuración<br/>src/config/sitio.ts · rutas.ts"]
  FS[("src/content/<br/>catalogo-api.json, JSON de respaldo y fotos")]
  SYNC["scripts/sincronizar-api.mjs<br/>(prebuild)"]
  BE[("back-aalcuadrado")]

  P --> REPO
  C --> PED
  JS --> PED
  JS --> CLI
  REPO -.implementa.-> LOCAL
  LOCAL --> FS
  SYNC --> FS
  SYNC -- "al compilar, con token" --> BE
  CLI -- "en vivo, rutas públicas" --> BE
  LOCAL --> Z
  CLI --> Z
  PED --> CFG
  C --> CFG
```

## Capas

| Capa | Carpeta | Qué hace | Regla |
| --- | --- | --- | --- |
| Dominio | `src/domain/` | Esquemas Zod (`ProductoJsonSchema`, `ColorSchema`…) y tipos (`Producto`, `FotoProducto`, `Color`, `Coleccion`). | Solo depende de `zod`. Es el contrato que respetará el backend. |
| Datos | `src/data/` | `CatalogoRepository` (interfaz) y `CatalogoArchivosLocales` (lee los JSON y las fotos de `src/content/` con `import.meta.glob`). `src/data/index.ts` decide qué implementación se usa. | Páginas y componentes **nunca** leen archivos: siempre pasan por `catalogo`. |
| Servicios | `src/services/` | `CanalPedidos` arma los enlaces de compra (hoy, por WhatsApp). `ClienteDisenos` y `ClienteEncargos` (kits y velas) llaman a las rutas públicas de la API desde el navegador. | Sin APIs de Astro: se usa igual en el servidor y en el navegador. |
| Configuración | `src/config/sitio.ts` | WhatsApp, redes, temporada, precios, preguntas frecuentes. | Todo lo que cambia seguido vive aquí. |
| Presentación | `src/pages/`, `src/components/`, `src/scripts/` | Componentes `.astro` y TypeScript nativo para la interactividad. | Sin React, Vue ni Tailwind. |

## Decisiones

**¿Por qué Astro?**
- Genera HTML estático: carga rápido en celular y se hospeda gratis.
- `astro:assets` optimiza las fotos al compilar (AVIF/WebP, varios tamaños, `srcset`), sin servicios externos.
- Permite cambiar a renderizado híbrido o de servidor con un adaptador, sin reescribir componentes.
- Envía al navegador solo el JavaScript que se usa (visor, tarjetas, filtros, menú, formularios de kits y velas, y diseñador).

**¿Por qué estático por ahora?**
El catálogo cambia pocas veces por semana y las compras se cierran por WhatsApp. Un sitio estático no tiene costos, no se cae y no necesita mantenimiento de servidor. Cada cambio en el repositorio vuelve a publicar el sitio.

**¿Por qué Pages CMS?**
Da un panel para subir fotos y editar productos desde el navegador sin agregar servidor ni base de datos: cada cambio es un commit en `main`, que Vercel publica. Su configuración está en `.pages.yml`. Cada producto es un JSON plano en `src/content/productos/` y las fotos van a `src/content/fotos/`. Los JSON guardan la ruta de cada foto agrupada por color, así que el color de una foto ya no depende de su nombre.

**¿Por qué `import.meta.glob` y no `getCollection`?**
`import.meta.glob` importa todas las fotos de `src/content/fotos/` como `ImageMetadata`, y el catálogo cruza esas rutas con las que guardan los JSON. Los JSON se validan con los mismos esquemas Zod del dominio, que también aceptan los valores vacíos (`""` o `null`) que escribe Pages CMS. El script `npm run productos:validar` reutiliza esos esquemas y corre antes de cada publicación.

**Visor y enlaces profundos.**
Un único `<dialog>` sirve a todos los productos y a la galería. Al compilar se generan las versiones del visor (WebP en 640–1920 px y miniaturas) y viajan como JSON en la página. El estado vive en la URL (`#producto/<slug>/<n>`), así que un enlace compartido abre la misma foto y el botón "atrás" cierra el visor.

**Kits navideños.**
No son productos del catálogo: son un pedido a la medida. `src/domain/kits.ts` repite las reglas del DTO de la API (`CrearPedidoDto`) para mostrar los errores junto a cada campo antes de mandar nada, y `ClienteEncargos` hace `POST /api/pedidos` (pública, máximo 5 por minuto por IP). Las opciones del formulario viven en `sitio.kits`; la API no tiene catálogo de opciones y guarda el texto tal cual. Si no hay `API_URL` o la API falla, el pedido se manda por WhatsApp con `CanalPedidos.kit()`.

**Velas personalizadas.**
Mismo modelo que los kits ([ADR 0006](adr/0006-velas-personalizadas-como-pedido-a-la-medida.md)). `src/domain/velas.ts` repite las reglas de `CrearPedidoVelaDto` (tipo, presentación, marmoleado con un color distinto, cantidad de 1 a 20, notas) y `ClienteEncargos` hace `POST /api/velas/pedidos`. Los tamaños y moldes salen de `/api/velas/presentaciones` al compilar; colores y aromas, de los de kits con `enVela`; toppings, de `sitio.velas.toppings`. El formulario solo manda los tamaños del tipo elegido (los demás quedan en un `fieldset` deshabilitado) y muestra el marmoleado solo si la presentación lo admite; en jícara nunca. `VistaVela.astro` dibuja los tres tipos y `Toppings.astro` comparte los toppings con la vista del kit. Sin API, el pedido va por WhatsApp con `CanalPedidos.vela()`.

**Páginas y pestañas.**
Cada línea de producto tiene su página, y `Base` recibe `linea` (`inicio`, `aretes`, `kits` o `velas`) para marcar la pestaña activa, elegir los enlaces del encabezado y el mensaje de WhatsApp. Antes los aretes estaban en la portada: un script en `/` manda los enlaces viejos (`/#producto/…`, `/?coleccion=…`) a `/aretes/`.

**Productos y fotos desde la API.**
`npm run api:sincronizar` (`scripts/sincronizar-api.mjs`) inicia sesión en [back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado) con `API_URL`, `API_USUARIO` y `API_PASSWORD`, descarga las fotos a `src/content/fotos/api/` y escribe los productos, las categorías de aretes y los datos de las fotos en `src/content/catalogo-api.json` (ambos fuera de git). Si la API todavía no tiene `/api/categorias`, `/api/kits/*` o `/api/velas/presentaciones` (responde 404), se sigue sin esos datos. Las fotos de las categorías `velas-recipiente`, `velas-molde` y `velas-jicara` llegan junto con las demás. Como las fotos quedan dentro de `src/content/fotos/`, `import.meta.glob` las importa y Astro las optimiza igual que las del repositorio. `CatalogoArchivosLocales` valida el archivo con `CatalogoApiJsonSchema`:

- **Con la API**, los productos son los de la API. Las fotos de cada producto son las que la API tenga de él; si todavía no tiene, se usan las del JSON del repositorio con el mismo slug. Igual con la galería.
- **Sin la API** (sin `API_URL`), todo sale de `src/content/` como antes.

El script `prebuild` lo ejecuta antes de cada `npm run build`, así que corre solo en Vercel y en local, seguido de `npm run productos:validar`. Las credenciales vienen de las variables del proyecto en Vercel; si la API no responde o un producto tiene errores, el build falla y no se publica nada.

Después de cambiar productos o fotos hay que compilar de nuevo. Con Vercel, el panel tiene un botón **Publicar sitio** que llama al Deploy Hook del proyecto (la API guarda su URL en `DEPLOY_HOOK_URL`). Contrato completo: `docs/integracion-front.md` del backend.

## Cómo pasar a leer la API en vivo

Hoy la API se lee al compilar ([ADR 0002](adr/0002-catalogo-desde-la-api-al-compilar.md)). Si algún día hace falta leerla en cada visita (por ejemplo, inventario en tiempo real):

1. **Crear `CatalogoApi`** en `src/data/CatalogoApi.ts` implementando `CatalogoRepository`. Debe validar las respuestas con los esquemas de `src/domain/` y devolver fotos con URL remota (en `FotoProducto.src`).
2. **Cambiar una línea** en `src/data/index.ts`:
   ```ts
   export const catalogo: CatalogoRepository = new CatalogoApi(import.meta.env.API_URL);
   ```
3. **Fotos remotas:** agregar el dominio de las imágenes a `image.remotePatterns` en `astro.config.mjs` para que Astro las siga optimizando.
4. **Elegir el modo de renderizado:**
   - *Sigue estático:* se compila con los datos de la API en ese momento; el backend dispara un nuevo despliegue (Deploy Hook de Vercel) cuando cambia el catálogo.
   - *Híbrido o de servidor:* instalar un adaptador (`npx astro add node`, `netlify`, `cloudflare` o `vercel`) y marcar con `export const prerender = false` solo las rutas que deban ser dinámicas (por ejemplo, inventario en tiempo real o `/pedido`). El resto se queda prerenderizado.
5. **Carrito o checkout:** crear otra implementación de `CanalPedidos` (por ejemplo, `CanalCarrito`) y cambiarla en `src/services/pedidos.ts`. Los botones de la UI ya piden enlaces a la interfaz, no a WhatsApp.
