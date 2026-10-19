# aalcuadrado

Landing page de **aalcuadrado** (se lee "A al cuadrado"): aretes y accesorios con motivos mexicanos, diseñados e impresos en 3D.

Está hecha con [Astro](https://astro.build) y es un sitio estático: no hay base de datos. Los productos son **carpetas con fotos**, y todas las compras se hacen por WhatsApp.

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
| `npm run productos:validar` | Revisa las carpetas de productos y te dice qué falta. |
| `npm run build` | Genera el sitio final en la carpeta `dist/`. |
| `npm run preview` | Muestra el sitio ya compilado, igual que como quedará publicado. |
| `npm run check` | Revisa que el código no tenga errores. |
| `npm run ejemplos:generar` | Vuelve a crear las fotos de ejemplo (no sobrescribe las que ya existen). |
| `npm run og:generar` | Vuelve a crear la imagen para compartir en redes (`public/og.png`). |

---

## 2. Agregar un producto nuevo

Cada producto es una carpeta dentro de `src/content/productos/`.

### Paso 1. Crea la carpeta

El nombre de la carpeta aparece en el enlace del producto, así que usa **minúsculas, sin acentos ni espacios** (usa guiones):

```
src/content/productos/calavera-catrina/
```

### Paso 2. Copia las fotos y nómbralas así

| Nombre del archivo | Qué significa |
| --- | --- |
| `portada.jpg` | Foto principal (opcional). Si no hay, se usa la primera. |
| `morado-01.jpg`, `morado-02.jpg` | Fotos del color **morado**. El inicio del nombre debe ser igual al `id` del color en `producto.json`. |
| `rosa-01.jpg` | Fotos del color **rosa**. |
| `puesto-01.jpg`, `en-caja-01.jpg` | Fotos generales (sin color). |

- Formatos: `.jpg`, `.jpeg`, `.png`, `.webp` o `.avif`.
- Usa números con dos dígitos (`01`, `02`… `10`) para que el orden sea claro.
- Las fotos verticales (proporción 4:5, por ejemplo 1200 × 1500 px) son las que mejor se ven.
- No te preocupes por el peso: el sitio las optimiza solo.

### Paso 3. Crea `producto.json`

En la misma carpeta, crea un archivo `producto.json`:

```json
{
  "nombre": "Calavera catrina",
  "coleccion": "dia-de-muertos",
  "precio": 140,
  "colores": [
    { "id": "morado", "nombre": "Morado", "hex": "#3B2A9B" },
    { "id": "rosa", "nombre": "Rosa mexicano", "hex": "#E4007C" }
  ],
  "descripcion": "La catrina de Posada, en un arete que casi no pesa.",
  "etiqueta": "Nuevo",
  "disponible": true,
  "destacado": false,
  "orden": 4
}
```

| Campo | ¿Obligatorio? | Qué poner |
| --- | --- | --- |
| `nombre` | Sí | Nombre del producto. |
| `coleccion` | Sí | Una de estas: `dia-de-muertos`, `mexicanos`, `patrios`, `navidad`, `otros`. |
| `precio` | No | Número en pesos, sin signo `$`. Si no lo pones, aparece "Pregunta por WhatsApp". |
| `colores` | No | Lista de colores. `id` en minúsculas y sin espacios (es el inicio del nombre de las fotos), `nombre` como lo verá el cliente y `hex` para pintar el cuadrito. |
| `descripcion` | No | Una o dos líneas. |
| `etiqueta` | No | `"Nuevo"`, `"Temporada"` o `"Más vendido"`. |
| `disponible` | No | `true` (por defecto) o `false` para marcarlo como agotado. |
| `destacado` | No | `true` para que su foto salga en la portada del sitio. |
| `orden` | No | Número para ordenar el catálogo (1 va primero). |

> Si una carpeta no tiene `producto.json`, el producto se muestra igual: con el nombre de la carpeta, en la colección "otros" y sin precio.

### Paso 4. Revisa que todo esté bien

```bash
npm run productos:validar
```

Te dirá si falta algo: carpetas sin fotos, errores en el JSON o colores sin fotos.

### Fotos de ambiente ("Así se ven")

Copia las fotos a `src/content/galeria/`. El texto alternativo sale del nombre del archivo (`aretes-en-caja.jpg` → "Aretes en caja"). Si quieres escribirlo tú, crea `src/content/galeria/galeria.json`:

```json
{
  "aretes-en-caja.jpg": { "alt": "Tres pares de aretes de papel picado dentro de su caja" }
}
```

### Quitar los productos de ejemplo

Los tres productos que vienen (`papel-picado-calaverita`, `corazon-talavera`, `nochebuena`) y las fotos de `galeria/` son **de ejemplo** (dicen "Foto de ejemplo"). Reemplaza las imágenes por fotos reales con los mismos nombres, o borra la carpeta completa del producto.

---

## 3. Cambios frecuentes

### Marcar un producto como agotado

En su `producto.json`, cambia `"disponible": true` por `"disponible": false`. Se mostrará con la etiqueta "Agotado" y el botón "Avísame por WhatsApp".

### Cambiar un precio

En su `producto.json`, cambia el número de `"precio"`.

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
  numero: '5215512345678',
},
```

Escríbelo **con lada de país y sin espacios, signos ni guiones**. Para un celular de México: `521` + los 10 dígitos.

En el mismo archivo están las redes sociales, el costo de personalizar, el mínimo de mayoreo y las preguntas frecuentes.

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
    productos/<producto>/    ← fotos + producto.json de cada producto
    galeria/                 ← fotos de ambiente
  config/sitio.ts            ← WhatsApp, redes, temporada, precios, preguntas
  domain/                    ← tipos y reglas de los datos (esquemas Zod)
  data/                      ← lectura del catálogo (hoy: carpetas; mañana: API)
  services/pedidos.ts        ← arma los enlaces de WhatsApp
  components/                ← secciones de la página
  scripts/                   ← interactividad (visor, tarjetas, colores)
  styles/                    ← colores, tipografía y estilos base
scripts/                     ← validar productos, generar ejemplos e imagen OG
docs/arquitectura.md         ← decisiones técnicas y cómo crecer a un backend
```
