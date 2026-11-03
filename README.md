# aalcuadrado

Landing page de **aalcuadrado** (se lee "A al cuadrado"): aretes y accesorios con motivos mexicanos, diseñados e impresos en 3D.

Está hecha con [Astro](https://astro.build) y es un sitio estático: no hay base de datos. Los productos y sus fotos se guardan en este repositorio y se editan desde **[Pages CMS](https://pagescms.org)**, un panel en el navegador. Todas las compras se hacen por WhatsApp.

---

## 1. Correr el sitio en tu computadora

Necesitas **Node.js 24** (o 22.22 en adelante). Descárgalo de [nodejs.org](https://nodejs.org) si no lo tienes.

```bash
npm install        # solo la primera vez (o cuando cambien las dependencias)
npm run dev        # abre http://localhost:4321
```

Mientras `npm run dev` esté corriendo, cada cambio que guardes (una foto nueva, un precio) se ve al recargar la página. Para detenerlo, presiona `Ctrl + C` en la terminal.

Otros comandos útiles:

| Comando | Para qué sirve |
| --- | --- |
| `npm run productos:validar` | Revisa los productos y sus fotos y te dice qué falta. |
| `npm run build` | Genera el sitio final en la carpeta `dist/`. |
| `npm run preview` | Muestra el sitio ya compilado, igual que como quedará publicado. |
| `npm run check` | Revisa que el código no tenga errores. |
| `npm run ejemplos:generar` | Vuelve a crear las fotos de ejemplo (no sobrescribe las que ya existen). |
| `npm run og:generar` | Vuelve a crear la imagen para compartir en redes (`public/og.png`). |

---

## 2. Productos y fotos desde Pages CMS

Pages CMS es un panel gratuito que edita los archivos de este repositorio. No necesita servidor: cada vez que guardas, hace un commit en GitHub y el sitio se vuelve a publicar solo en uno o dos minutos. Funciona desde el celular.

### Configurarlo (una sola vez)

1. Asegúrate de que el archivo `.pages.yml` ya esté en la rama `main` en GitHub.
2. Entra a [app.pagescms.org](https://app.pagescms.org) y elige **Sign in with GitHub**.
3. Cuando lo pida, instala la app de Pages CMS en tu cuenta y dale acceso **solo** al repositorio `front-aalcuadrado`.
4. Abre el repositorio y elige la rama `main`. Verás dos secciones: **Productos** y **Galería "Así se ven"**.

### Agregar un producto

1. En **Productos**, toca **Add an entry**.
2. Escribe el **nombre**. De ahí sale el nombre del archivo y el enlace del producto (por ejemplo, "Calavera catrina" → `calavera-catrina`), así que piénsalo bien: no se cambia después.
3. Elige la **colección** y escribe una **descripción** corta.
4. En **Colores**, agrega cada color con su nombre (como lo verá el cliente), su color en hexadecimal (`#E4007C`) y sus fotos. Las fotos se suben ahí mismo.
5. Si tienes fotos que no son de un color (en el puesto, en la caja…), súbelas en **Otras fotos**. La **foto principal** es opcional; si no la pones, se usa la primera del primer color.
6. Revisa **Disponible** y **Destacado**, y guarda con **Save**.

Recomendaciones para las fotos:

- Formatos: `.jpg`, `.jpeg`, `.png`, `.webp` o `.avif`. Las fotos HEIC del iPhone no sirven: compártelas como JPG o cambia la cámara a "Más compatible".
- Las verticales (4:5, por ejemplo 1200 × 1500 px) son las que mejor se ven.
- Súbelas de menos de 1 MB cada una. El sitio las optimiza solo, pero así el repositorio no crece de más.
- Usa nombres distintos para cada foto (por ejemplo `catrina-morado-1.jpg`). Si subes otra foto con el mismo nombre, puede sustituir a la anterior.

### Galería "Así se ven"

En **Galería "Así se ven"** agrega las fotos de ambiente y escribe en **Descripción** qué se ve en cada una (sirve para quien no puede ver la imagen). Salen en el orden de la lista.

### Si prefieres editar a mano

Pages CMS solo escribe archivos normales, así que también puedes editarlos tú:

- Las fotos van en `src/content/fotos/productos/` y `src/content/fotos/galeria/`.
- Cada producto es un archivo `src/content/productos/<nombre-del-producto>.json`:

```json
{
  "nombre": "Calavera catrina",
  "coleccion": "dia-de-muertos",
  "descripcion": "La catrina de Posada, en un arete que casi no pesa.",
  "etiqueta": "Nuevo",
  "disponible": true,
  "destacado": false,
  "orden": 4,
  "colores": [
    {
      "nombre": "Morado",
      "hex": "#3B2A9B",
      "fotos": ["/src/content/fotos/productos/catrina-morado-1.jpg"]
    }
  ],
  "otrasFotos": ["/src/content/fotos/productos/catrina-en-caja.jpg"]
}
```

| Campo | ¿Obligatorio? | Qué poner |
| --- | --- | --- |
| `nombre` | Sí | Nombre del producto. |
| `coleccion` | Sí | Una de estas: `dia-de-muertos`, `mexicanos`, `patrios`, `navidad`, `otros`. |
| `colores` | No | Cada color con `nombre`, `hex` y la lista de sus `fotos`. |
| `portada` | No | Foto principal. Si no hay, se usa la primera del primer color. |
| `otrasFotos` | No | Fotos que no son de un color. |
| `descripcion` | No | Una o dos líneas (máximo 240 caracteres). |
| `etiqueta` | No | `"Nuevo"`, `"Temporada"` o `"Más vendido"`. |
| `disponible` | No | `true` (por defecto) o `false` para marcarlo como agotado. |
| `destacado` | No | `true` para que su foto salga en la portada del sitio. |
| `orden` | No | Número para ordenar el catálogo (1 va primero). |
| `precio` | No | Por ahora no se usa: todos los diseños listos cuestan lo que diga `src/config/sitio.ts`. |

Después revisa que todo esté bien:

```bash
npm run productos:validar
```

Te dirá si falta algo: productos sin fotos, fotos que no existen, errores en el JSON o fotos que no usa nadie. Esta revisión también corre antes de cada publicación: si algo está mal, el sitio no se publica y lo verás en la pestaña **Actions** de GitHub.

### Quitar los productos de ejemplo

Los tres productos que vienen (`papel-picado-calaverita`, `corazon-talavera`, `nochebuena`) y las fotos de la galería son **de ejemplo** (dicen "Foto de ejemplo"). Bórralos desde Pages CMS o cambia sus fotos por fotos reales. Las fotos que ya no uses puedes borrarlas desde **Media** en Pages CMS.

---

## 3. Cambios frecuentes

### Marcar un producto como agotado

En Pages CMS, abre el producto y apaga **Disponible**. Se mostrará con la etiqueta "Agotado" y el botón "Avísame por WhatsApp".

### Cambiar los precios

Por ahora los precios son fijos y están en `src/config/sitio.ts`:

```ts
precios: {
  listo: 40,          // cualquier diseño del catálogo
  personalizado: 60,  // diseños personalizados
},
```

### Activar o desactivar la temporada

En `src/config/sitio.ts`, dentro de `temporada`:

```ts
temporada: {
  activa: true,               // false para ocultar la franja
  coleccion: 'dia-de-muertos', // colección a la que lleva el enlace
  titulo: 'Temporada de Día de Muertos',
  texto: 'Llévate 2 pares por',
  precio: 200,
},
```

### Cambiar el número de WhatsApp

En `src/config/sitio.ts`:

```ts
whatsapp: {
  numero: '525510727166',
},
```

Escríbelo **con lada de país y sin espacios, signos ni guiones**. Para un celular de México: `52` + los 10 dígitos.

En el mismo archivo están las redes sociales (ocultas por ahora), el mínimo de mayoreo y las preguntas frecuentes.

### Diseñador ("Diseña tus aretes")

La sección no menciona la IA en ningún texto visible. Llama a `POST /api/disenos` de [back-aalcuadrado](https://github.com/AIMtonio/back-aalcuadrado) desde el navegador del visitante. Para que aparezca:

1. Define `API_URL` al compilar: en `.env` para local (`API_URL=http://localhost:3000`) y en el secret `API_URL` de GitHub para producción. Es la misma variable que usa `npm run api:sincronizar`. **Queda escrita en la página**, así que debe ser la URL pública del túnel, nunca una con credenciales.
2. En la API, agrega el dominio del sitio a `CORS_ORIGINS` (por ejemplo `https://aimtonio.github.io`).
3. La sección arranca oculta y se muestra solo si `GET /api/disenos` responde `disponible: true`. Si la API está apagada, sin llave de OpenAI o sin cupo del día, no se ve.

Las palabras que no se aceptan están en `src/domain/palabras-prohibidas.ts`. Agrega o quita palabras ahí, en minúsculas y sin acentos. La revisión es del lado del navegador: evita gastar imágenes en ideas que no se van a aceptar, pero alguien que llame a la API directamente se la puede saltar.

---

## 4. Publicar los cambios

El sitio se publica solo en **GitHub Pages** cada vez que subes cambios a la rama `main`.

**Una sola vez:** en GitHub, entra al repositorio → **Settings → Pages** → en **Source** elige **GitHub Actions**.

Después, cada vez que quieras publicar:

```bash
npm run productos:validar   # opcional, para revisar antes
git add .
git commit -m "Agrego calavera catrina"
git push
```

En la pestaña **Actions** de GitHub verás el avance. En uno o dos minutos el sitio queda en `https://aimtonio.github.io/front-aalcuadrado/`.

### Alternativa: Netlify o Cloudflare Pages

Ambos son gratuitos y no necesitan el GitHub Action:

1. Crea una cuenta y conecta este repositorio de GitHub.
2. Configura:
   - **Comando de compilación:** `npm run build`
   - **Carpeta de publicación:** `dist`
   - **Variable de entorno:** `SITE_URL` con tu dirección final (por ejemplo `https://aalcuadrado.netlify.app` o tu dominio propio). No hace falta `BASE_PATH`.
3. Cada `git push` a `main` publicará el sitio.

Si usas tu propio dominio (por ejemplo `aalcuadrado.mx`), recuerda poner esa dirección en `SITE_URL`.

---

## 5. Cómo está organizado el proyecto

```
src/
  content/
    productos/<producto>.json ← datos de cada producto (los edita Pages CMS)
    galeria.json             ← fotos de ambiente y su descripción
    fotos/productos/         ← fotos de los productos
    fotos/galeria/           ← fotos de ambiente
  config/sitio.ts            ← WhatsApp, redes, temporada, precios, preguntas
  domain/                    ← tipos y reglas de los datos (esquemas Zod)
  data/                      ← lectura del catálogo (hoy: archivos JSON; mañana: API)
  services/pedidos.ts        ← arma los enlaces de WhatsApp
  services/disenos.ts        ← cliente del diseñador con IA (/api/disenos)
  components/                ← secciones de la página
  scripts/                   ← interactividad (visor, tarjetas, colores)
  styles/                    ← colores, tipografía y estilos base
scripts/                     ← validar productos, generar ejemplos e imagen OG
docs/arquitectura.md         ← decisiones técnicas y cómo crecer a un backend
.pages.yml                   ← campos del panel de Pages CMS
```
