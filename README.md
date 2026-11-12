# aalcuadrado · front

Sitio público de **aalcuadrado** (se lee "A al cuadrado"), un taller de manualidades hechas a mano en Mérida. Este repositorio es la **capa de presentación** de un sistema de dos piezas: un sitio estático que se publica en un CDN y una API propia ([back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado)) que administra el catálogo y recibe pedidos.

| | |
| --- | --- |
| **Producción** | <https://aalcuadrado.antonioalonso.com.mx> |
| **Estilo** | Sitio estático generado al compilar (SSG), con islas de TypeScript en el navegador |
| **Stack** | Astro 7 · TypeScript estricto · Zod · Sharp · CSS propio (sin frameworks de UI) |
| **Hospedaje** | Vercel (CDN) · la API vive en un servidor propio detrás de Cloudflare Tunnel |
| **Líneas de producto** | Aretes impresos en 3D (catálogo) · Kits navideños de vela + jabones (pedido a la medida) |

> ¿Buscas cómo agregar un producto, cambiar un precio o publicar? Eso está en el **[Manual de operación](docs/operacion.md)**. Este README describe el sistema.

---

## Contenido

1. [Principios](#1-principios)
2. [Contexto del sistema](#2-contexto-del-sistema)
3. [Contenedores y despliegue](#3-contenedores-y-despliegue)
4. [Arquitectura del front](#4-arquitectura-del-front)
5. [Flujo de publicación](#5-flujo-de-publicación)
6. [Flujo de un pedido de kit](#6-flujo-de-un-pedido-de-kit)
7. [Mapa del sitio](#7-mapa-del-sitio)
8. [Atributos de calidad](#8-atributos-de-calidad)
9. [Decisiones de arquitectura](#9-decisiones-de-arquitectura)
10. [Riesgos y deuda técnica](#10-riesgos-y-deuda-técnica)
11. [Desarrollo](#11-desarrollo)
12. [Documentación](#12-documentación)

---

## 1. Principios

1. **Estático primero.** Todo lo que se puede decidir al compilar se decide al compilar: catálogo, fotos optimizadas, opciones de los kits. El navegador solo llama a la API para lo que de verdad ocurre en vivo (mandar un pedido, generar un diseño).
2. **El sitio no se cae si la API se cae.** La API alimenta el *build*, no las visitas. Si está apagada, el sitio publicado sigue funcionando y los pedidos se desvían a WhatsApp.
3. **Un contrato, dos lados.** Los esquemas Zod de `src/domain/` repiten las reglas de los DTO del back. El front valida antes de mandar y el back valida al recibir.
4. **Puertos y adaptadores ligeros.** Páginas y componentes hablan con interfaces (`CatalogoRepository`, `CanalPedidos`), nunca con archivos, `fetch` o WhatsApp directamente.
5. **Configuración de negocio en un solo lugar.** Lo que cambia seguido (precios, textos, tiempos de entrega, opciones fijas) vive en `src/config/sitio.ts`. Lo que cambia muy seguido (productos, colores, aromas, fotos) vive en el panel de la API.

---

## 2. Contexto del sistema

Quién usa el sistema y con qué sistemas externos habla.

```mermaid
flowchart LR
  visitante(["👤 Visitante<br/>compra aretes o arma un kit"])
  duenio(["👤 Dueño del taller<br/>administra catálogo y cotiza"])

  subgraph aalcuadrado["Sistema aalcuadrado"]
    front["🌐 Sitio público<br/><i>este repositorio</i><br/>Astro estático"]
    api["⚙️ API y panel<br/><i>back-aalcuadrado</i><br/>NestJS + MariaDB"]
  end

  whatsapp["💬 WhatsApp<br/>cierre de ventas"]
  openai["🎨 OpenAI Images<br/>diseñador de aretes"]
  gtm["📊 Google Tag Manager<br/>analítica"]
  github["🐙 GitHub + Pages CMS<br/>código y contenido de respaldo"]

  visitante -- "navega y pide" --> front
  visitante -- "chatea" --> whatsapp
  front -- "pedidos y diseños<br/>HTTPS, en vivo" --> api
  front -- "catálogo y fotos<br/>al compilar" --> api
  front -. "enlaces wa.me" .-> whatsapp
  front -. "eventos" .-> gtm
  api -- "genera imágenes" --> openai
  duenio -- "panel /panel/" --> api
  duenio -- "edita contenido" --> github
  github -- "commit dispara build" --> front

  classDef persona fill:#3b2a9b,stroke:#2c1f78,color:#fff
  classDef propio fill:#fffcf7,stroke:#3b2a9b,stroke-width:2px,color:#17142b
  classDef externo fill:#f7f1e8,stroke:#a39e8f,color:#17142b,stroke-dasharray:4 3
  class visitante,duenio persona
  class front,api propio
  class whatsapp,openai,gtm,github externo
  style aalcuadrado fill:#f4f3fa,stroke:#3b2a9b,color:#17142b
```

| Actor / sistema | Rol |
| --- | --- |
| Visitante | Ve el catálogo de aretes, arma kits navideños y pide por WhatsApp o por formulario. |
| Dueño del taller | Administra productos, categorías, colores, aromas y fotos en el panel; cotiza los pedidos de kits. |
| WhatsApp | Canal de venta principal (aretes) y respaldo de los pedidos de kits. |
| OpenAI Images | Lo usa solo la API, para el diseñador de aretes. La llave nunca llega al navegador. |
| GitHub + Pages CMS | Código fuente y un catálogo de respaldo en JSON, editable desde el navegador. |

---

## 3. Contenedores y despliegue

Dónde corre cada pieza y cómo se comunican.

```mermaid
flowchart TB
  subgraph cliente["Navegador del visitante"]
    html["HTML + CSS estáticos"]
    islas["Islas TypeScript<br/>visor · filtros · arma tu kit · diseñador"]
  end

  subgraph vercel["Vercel"]
    cdn[("CDN<br/>dist/: 3 páginas,<br/>imágenes AVIF/WebP")]
    build["Build<br/>prebuild → astro build"]
  end

  subgraph casa["Servidor propio"]
    tunel["Cloudflare Tunnel<br/>HTTPS público"]
    nest["API NestJS<br/>/api/*  ·  /panel/  ·  /uploads/"]
    db[("MariaDB<br/>productos, categorías,<br/>opciones de kit, pedidos")]
    disco[("Disco<br/>UPLOADS_DIR/<br/>productos · galeria · kits")]
  end

  repo[("GitHub<br/>front-aalcuadrado")]

  html --> islas
  cdn -- "GET páginas e imágenes" --> html
  islas -- "POST /api/pedidos<br/>GET·POST /api/disenos" --> tunel
  tunel --> nest
  nest --> db
  nest --> disco
  repo -- "push a main" --> build
  nest -- "Deploy Hook<br/>botón Publicar sitio" --> build
  build -- "login + GET catálogo<br/>con token" --> tunel
  build -- "publica" --> cdn

  classDef nube fill:#fffcf7,stroke:#3b2a9b,color:#17142b
  classDef datos fill:#e9e6f7,stroke:#3b2a9b,color:#17142b
  class html,islas,build,tunel,nest nube
  class cdn,db,disco,repo datos
  style cliente fill:#f7f1e8,stroke:#a39e8f,color:#17142b
  style vercel fill:#f4f3fa,stroke:#3b2a9b,color:#17142b
  style casa fill:#e3efe7,stroke:#1f5e3b,color:#17142b
```

| Contenedor | Tecnología | Responsabilidad | Escala / costo |
| --- | --- | --- | --- |
| Sitio estático | Astro, HTML, CSS, TS | Presentar el catálogo y los kits; validar y mandar pedidos | CDN global, plan gratuito |
| Build | Node 22+, `scripts/*.mjs`, Sharp | Sincronizar la API, validar contenido y optimizar imágenes | 1 build por cambio, segundos |
| API | NestJS, TypeORM, JWT | Catálogo, fotos, opciones de kit, pedidos, diseñador | Una instancia, límites por IP |
| Base de datos | MariaDB / MySQL | Estado del negocio | Una instancia |
| Archivos | Disco del servidor | Fotos originales subidas desde el panel | Se copian al front en cada build |

---

## 4. Arquitectura del front

Capas dentro de este repositorio. Las flechas indican dependencia: una capa solo conoce a las de abajo.

```mermaid
flowchart TB
  subgraph presentacion["Presentación · src/pages · src/components · src/scripts"]
    paginas["Páginas<br/>/ · /aretes/ · /kits-navidenos/"]
    componentes["Componentes .astro<br/>Hero, Catálogo, ArmaTuKit, Visor…"]
    scripts["Islas del navegador<br/>tarjetas.ts · visor.ts · kit.ts · disenador.ts"]
  end

  subgraph servicios["Servicios · src/services"]
    canal["CanalPedidos<br/>enlaces de WhatsApp"]
    clientes["ClienteKits · ClienteDisenos<br/>fetch a la API pública"]
  end

  subgraph datos["Datos · src/data"]
    repo["CatalogoRepository<br/>interfaz"]
    local["CatalogoArchivosLocales<br/>catalogo-api.json + JSON de respaldo"]
  end

  subgraph dominio["Dominio · src/domain"]
    zod["Esquemas Zod y reglas puras<br/>catálogo · kits · diseños"]
  end

  config["Configuración · src/config<br/>sitio.ts · rutas.ts"]

  paginas --> componentes
  paginas --> repo
  componentes --> canal
  scripts --> canal
  scripts --> clientes
  repo -. "implementa" .- local
  local --> zod
  clientes --> zod
  canal --> config
  componentes --> config

  classDef capa fill:#fffcf7,stroke:#3b2a9b,color:#17142b
  class paginas,componentes,scripts,canal,clientes,repo,local,zod,config capa
  style presentacion fill:#f4f3fa,stroke:#3b2a9b,color:#17142b
  style servicios fill:#f7f1e8,stroke:#a39e8f,color:#17142b
  style datos fill:#f7f1e8,stroke:#a39e8f,color:#17142b
  style dominio fill:#e3efe7,stroke:#1f5e3b,color:#17142b
```

| Capa | Regla |
| --- | --- |
| Dominio | Solo depende de `zod`. Funciona igual en el navegador, en el build y en los scripts de Node. |
| Datos | Es el único lugar que lee archivos (`import.meta.glob`). Cambiar de origen de datos es cambiar una línea en `src/data/index.ts`. |
| Servicios | Sin APIs de Astro: se usan en el servidor y en el navegador. La UI pide "un enlace para pedir", no "un enlace de WhatsApp". |
| Presentación | Componentes `.astro` sin frameworks de UI. El JavaScript del navegador se carga solo donde hay interacción. |

---

## 5. Flujo de publicación

El catálogo se "congela" en cada build. Cambiar algo en el panel no se ve hasta volver a publicar.

```mermaid
flowchart LR
  disparo{{"Disparo"}}
  push["push / merge a main"]
  cms["guardar en Pages CMS"]
  hook["botón Publicar sitio<br/>en el panel"]

  sync["api:sincronizar<br/>login JWT · GET productos,<br/>categorías, imágenes,<br/>colores y aromas de kit"]
  manifiesto[("catalogo-api.json<br/>+ fotos en src/content/fotos/api/")]
  validar["productos:validar<br/>esquemas Zod"]
  astro["astro build<br/>HTML · AVIF/WebP · srcset<br/>JSON-LD · sitemap"]
  cdn[("CDN de Vercel")]
  falla["❌ El build falla<br/>sigue en línea<br/>la versión anterior"]

  push --> disparo
  cms --> disparo
  hook --> disparo
  disparo --> sync --> manifiesto --> validar --> astro --> cdn
  sync -. "API no responde" .-> falla
  validar -. "contenido inválido" .-> falla

  classDef paso fill:#fffcf7,stroke:#3b2a9b,color:#17142b
  classDef datos fill:#e9e6f7,stroke:#3b2a9b,color:#17142b
  classDef error fill:#fbe9ea,stroke:#b3202a,color:#7d141b
  class push,cms,hook,sync,validar,astro paso
  class manifiesto,cdn datos
  class falla error
```

- **Tolerante a versiones de la API.** Si una ruta nueva todavía no existe (responde `404`, por ejemplo `/api/categorias` o `/api/kits/colores`), la sincronización sigue sin esos datos y el sitio usa sus valores de respaldo.
- **Atómico.** Vercel solo cambia de versión si el build completo termina bien; nunca se publica un sitio a medias.
- **Sin API** (`API_URL` vacío), el sitio se arma con los JSON del repositorio y los pedidos de kits van por WhatsApp.

---

## 6. Flujo de un pedido de kit

El único flujo que escribe datos desde el sitio público.

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitante
  participant F as Arma tu kit<br/>(kit.ts)
  participant D as Dominio<br/>(revisarPedido)
  participant A as API<br/>POST /api/pedidos
  participant B as MariaDB<br/>pedidos_kits
  participant W as WhatsApp
  actor P as Dueño (panel)

  V->>F: elige jabones, vela y topping
  F-->>V: actualiza la vista previa y el resumen
  V->>F: Mandar mi pedido
  F->>D: valida campos, largos y contacto
  alt datos inválidos
    D-->>F: errores por campo
    F-->>V: marca los campos y enfoca el primero
  else datos válidos
    F->>A: JSON del pedido (sin token)
    alt 201 Created
      A->>B: INSERT
      A-->>F: { id }
      F-->>V: ¡Recibimos tu pedido! (folio) + botón de WhatsApp
      P->>A: GET /api/pedidos (con token)
      P->>V: cotiza por correo o teléfono
    else 400 · 429 · sin conexión
      A-->>F: error
      F-->>V: mensaje en español + "Mandarlo por WhatsApp"
      V->>W: mismo pedido, ya escrito
    end
  end
```

Estados del pedido, del lado del visitante y del taller:

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Armando: abre /kits-navidenos/
  Armando --> Validando: Mandar mi pedido
  Validando --> Armando: faltan datos
  Validando --> Enviando: datos válidos
  Enviando --> Recibido: 201 con folio
  Enviando --> PorWhatsApp: falla la API
  Validando --> PorWhatsApp: build sin API_URL
  Recibido --> Cotizado: el dueño escribe con el precio
  PorWhatsApp --> Cotizado: el dueño contesta el chat
  Cotizado --> EnTaller: el cliente confirma
  EnTaller --> Entregado: una semana después
  Entregado --> [*]
```

---

## 7. Mapa del sitio

```mermaid
flowchart LR
  inicio["/ · Portada<br/>¿Qué quieres ver?"]
  aretes["/aretes/<br/>Catálogo · Galería · Proceso ·<br/>Personaliza · Diseñador · Mayoreo · FAQ"]
  kits["/kits-navidenos/<br/>Así quedan · Cómo funciona ·<br/>Arma tu kit · FAQ"]
  visor(["Visor de fotos<br/>#producto/slug/n · #galeria/n · #kits/n"])
  wa(["WhatsApp"])

  inicio -- "tarjeta / pestaña" --> aretes
  inicio -- "tarjeta / pestaña" --> kits
  aretes <-- "pestañas del encabezado" --> kits
  aretes --> visor
  kits --> visor
  aretes --> wa
  kits --> wa
  inicio -. "enlaces viejos /#producto/… redirigen" .-> aretes

  classDef pagina fill:#fffcf7,stroke:#3b2a9b,color:#17142b
  classDef kit fill:#e3efe7,stroke:#1f5e3b,color:#17142b
  class inicio,aretes pagina
  class kits kit
```

---

## 8. Atributos de calidad

| Atributo | Cómo se logra |
| --- | --- |
| **Rendimiento** | HTML prerenderizado; imágenes AVIF/WebP en varios anchos con `srcset`; fuentes servidas desde el mismo sitio; JavaScript solo en las islas interactivas. |
| **Disponibilidad** | Las visitas dependen solo del CDN. Si la API se cae, se pierde el guardado de pedidos, no el sitio, y queda WhatsApp como respaldo. |
| **Seguridad** | Las credenciales de la API solo existen en el build. El navegador usa rutas públicas con límite por IP (5 pedidos por minuto) y CORS restringido al dominio. La llave de OpenAI vive solo en la API. |
| **Integridad de datos** | Esquemas Zod al compilar y antes de mandar; DTO con `class-validator` en la API. Un contenido inválido detiene el build. |
| **Accesibilidad** | HTML semántico, foco visible, `aria-live` en filtros y formularios, textos alternativos en todas las fotos y respeto de `prefers-reduced-motion`. |
| **SEO** | Sitemap, URL canónicas, Open Graph y JSON-LD (`Organization`, `Product`) por página. |
| **Mantenibilidad** | TypeScript estricto, capas con dependencias en un solo sentido, configuración centralizada y `npm run check` en cada cambio. |
| **Costo** | Sin servidores pagados para el sitio; la API corre en hardware propio. |

---

## 9. Decisiones de arquitectura

Cada decisión importante tiene su registro (ADR) con contexto, alternativas y consecuencias.

| # | Decisión | Estado |
| --- | --- | --- |
| [0001](docs/adr/0001-sitio-estatico-con-astro.md) | Sitio estático con Astro | Aceptada |
| [0002](docs/adr/0002-catalogo-desde-la-api-al-compilar.md) | El catálogo se lee de la API al compilar, no en cada visita | Aceptada |
| [0003](docs/adr/0003-ventas-por-whatsapp-detras-de-una-interfaz.md) | Las ventas se cierran por WhatsApp, detrás de una interfaz | Aceptada |
| [0004](docs/adr/0004-kits-como-pedido-a-la-medida.md) | Los kits son un pedido a la medida, no productos del catálogo | Aceptada |
| [0005](docs/adr/0005-una-pagina-por-linea-de-producto.md) | Una página por línea de producto | Aceptada |

---

## 10. Riesgos y deuda técnica

| Riesgo | Impacto | Mitigación actual / siguiente paso |
| --- | --- | --- |
| La API es una sola instancia en hardware propio | Si se apaga, fallan los builds y el guardado de pedidos | El sitio sigue en línea y los pedidos se desvían a WhatsApp. Siguiente paso: monitoreo del túnel y respaldo de MariaDB. |
| Los cambios del panel no se ven hasta volver a publicar | Contenido desactualizado si nadie presiona "Publicar sitio" | Deploy Hook desde el panel. Siguiente paso: publicar automáticamente al guardar. |
| `API_URL` queda escrita en la página | Cualquiera puede llamar a las rutas públicas | Solo se exponen rutas sin datos sensibles, con límite por IP y validación en la API. |
| El filtro de palabras del diseñador corre en el navegador | Se puede saltar llamando a la API directo | La API limita a 10 diseños por minuto por IP y rechaza (422) lo que bloquea la moderación de OpenAI; el filtro del front solo ahorra imágenes. |
| Los dos jabones de un kit comparten forma, color y aroma | El cliente no puede pedir dos jabones distintos | Requiere ampliar `pedidos_kits` en el back y el formulario. |
| Precios de aretes fijos en `sitio.ts` | El precio de cada producto en la API se ignora | Mover el precio al panel cuando haya precios distintos por modelo. |

---

## 11. Desarrollo

Requisitos: **Node.js 22.22 o más nuevo** (ver `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:4321
npm run check        # astro check + tsc
npm run build        # sincroniza la API (si hay API_URL), valida y compila en dist/
```

Variables de entorno (en `.env` para local y en Vercel para producción):

| Variable | Uso |
| --- | --- |
| `API_URL` | URL pública de la API. La usan el build y el navegador (pedidos, diseñador). |
| `API_USUARIO`, `API_PASSWORD` | Solo el build, para descargar el catálogo. Nunca llegan al navegador. |
| `SITE_URL` | Opcional. Dominio para enlaces absolutos y sitemap. |

Estructura:

```
src/
  pages/        rutas: index, aretes/, kits-navidenos/
  components/   secciones por página (inicio/, catalogo/, kits/, visor/) y comunes
  scripts/      islas del navegador
  services/     CanalPedidos, ClienteKits, ClienteDisenos
  data/         CatalogoRepository y su implementación
  domain/       esquemas Zod y reglas puras
  config/       sitio.ts (negocio) y rutas.ts
  content/      catálogo de respaldo en JSON y fotos (Pages CMS)
  styles/       tokens de diseño y estilos base
scripts/        sincronizar-api, validar-productos, generar-og, generar-ejemplos
docs/           arquitectura, ADR y manual de operación
```

---

## 12. Documentación

| Documento | Para quién |
| --- | --- |
| [docs/arquitectura.md](docs/arquitectura.md) | Desarrolladores: detalle de cada capa, integración con la API y cómo evolucionar. |
| [docs/adr/](docs/adr/) | Arquitectura: por qué el sistema es como es. |
| [docs/operacion.md](docs/operacion.md) | Quien administra el sitio: productos, fotos, precios, kits y publicación. |
| [back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado) · `docs/integracion-front.md` | Contrato completo de la API. |
