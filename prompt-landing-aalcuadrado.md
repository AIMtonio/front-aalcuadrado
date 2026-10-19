# Prompt para Claude Code: landing de aalcuadrado

Antes de pegarlo:
1. Crea una carpeta vacía para el proyecto y abre Claude Code dentro de ella.
2. Copia ahí `aalcuadrado-logo.svg` y `aalcuadrado-simbolo.svg`.
3. Cambia los valores entre [CORCHETES]. Si aún no los tienes, déjalos así: quedarán centralizados en un solo archivo de configuración.

Copia todo lo que está debajo de la línea.

---

Construye la landing page de mi emprendimiento **aalcuadrado**. Lee todo el brief antes de escribir código. Primero propón un plan breve (estructura de carpetas, modelo de datos y componentes) y después impleméntalo completo. Al terminar, levanta el sitio, revísalo en móvil (375 px) y en escritorio (1440 px) y corrige lo que se vea mal.

## 1. La marca

- **Nombre:** aalcuadrado, siempre en minúsculas. Se lee "A al cuadrado": su creador se llama Antonio Alonso (A por A).
- **Qué vende:** bisutería y accesorios con motivos mexicanos, diseñados e impresos en 3D. El producto actual son aretes (por ejemplo, de papel picado). Después vendrán más motivos y tipos de accesorio, así que la marca y la página deben funcionar para cualquier producto, no solo para uno.
- **Personalidad:** moderna, minimalista y gráfica, con la tecnología 3D como sello. Lo mexicano vive en los productos y las fotos, no en la decoración de la página.
- **Público:** personas de 20 a 40 años en México que compran accesorios con identidad, para usarlos o regalarlos. También tiendas y revendedoras que compran al mayoreo.
- **Tono de los textos:** español de México, cercano, directo y breve. Tutea al cliente. Sin exceso de signos de admiración ni frases de relleno. No uses eslogan.

## 2. Identidad visual

- **Logo:** `aalcuadrado-logo.svg` (símbolo + palabra) y `aalcuadrado-simbolo.svg` (solo símbolo). El símbolo es una "A" hecha de cuadritos morados redondeados en una cuadrícula de 5×5, con un cuadrito rosa arriba a la derecha que hace de "²". Usa el símbolo como favicon y en el botón flotante si queda bien. El logotipo debe leerse como "A al cuadrado" en lectores de pantalla (`aria-label`).
- **Recurso gráfico de la marca: el cuadrito.** Es el elemento memorable de toda la página. Úsalo con intención en pocos lugares: en el hero (por ejemplo, los cuadritos que se ensamblan para formar la "A", como si se imprimiera, en una sola animación de entrada), en indicadores de la galería o en los selectores de color. No lo repitas como decoración en cada sección.
- **Paleta:**
  - Morado `#3B2A9B`: color principal (el de los cuadritos).
  - Rosa mexicano `#E4007C`: acento para acciones principales y el "²". Con moderación.
  - Cempasúchil `#FF9F1C`: solo para la franja de temporada.
  - Tinta `#17142B`: texto principal.
  - Gris lavanda `#5C5878`: texto secundario.
  - Blanco `#FFFFFF` y alterno `#F4F3FA`.
- **Tipografía (Google Fonts):** "Unbounded" (600–700) para logotipo y titulares, y "DM Sans" para el cuerpo. Escala tipográfica clara y líneas de menos de 75 caracteres.
- **Movimiento:** una sola animación de entrada en el hero. Las demás animaciones solo responden a acciones del usuario (abrir la galería, cambiar de foto). Respeta `prefers-reduced-motion`.
- **Evita el look de plantilla:** nada de tarjetas idénticas con la misma sombra gris en todas las secciones, ni etiquetas en MAYÚSCULAS espaciadas encima de cada título, ni flechas "→" pegadas a los botones. Las fotos del producto son las protagonistas: dales espacio.

## 3. Stack: Astro + TypeScript, 100% estático

Usa **Astro (versión estable más reciente) con TypeScript en modo estricto**, con `output: 'static'`. Las razones de la elección:
- Genera HTML estático, rápido y gratuito de hospedar.
- Puede leer las fotos del producto desde carpetas en tiempo de compilación y optimizarlas automáticamente (`astro:assets`: AVIF/WebP, tamaños responsivos).
- Cuando exista un backend, el mismo proyecto puede pasar a renderizado híbrido o de servidor con un adaptador, sin reescribir el sitio.

Reglas de implementación:
- No uses React, Vue ni otro framework de UI. La interactividad (galería, filtros, menú) se hace con TypeScript nativo en componentes `.astro` con `<script>`, o como Web Components si eso la ordena mejor. Así el JavaScript que se envía al navegador queda mínimo.
- Estilos con CSS propio y variables (custom properties) para los tokens de la marca, en un archivo de tokens. Nada de Tailwind.
- No uses ninguna base de datos ni API en esta fase. Todo vive en el repositorio.

## 4. Fotos del producto leídas dinámicamente

Quiero agregar productos y fotos sin tocar código: solo creando carpetas y arrastrando imágenes.

**Estructura:**
```
src/content/productos/
  papel-picado-calaverita/
    producto.json        ← datos del producto
    portada.jpg          ← opcional: foto principal
    morado-01.jpg        ← fotos; el prefijo indica el color
    morado-02.jpg
    rosa-01.jpg
    puesto-01.jpg        ← sin prefijo de color = foto general
src/content/galeria/     ← fotos de ambiente (puestos, en caja, en la mesa de impresión)
```

**Reglas de lectura:**
- Cada carpeta dentro de `productos/` es un producto. Carga todas las imágenes de la carpeta automáticamente (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, en mayúsculas o minúsculas) con content collections y/o `import.meta.glob`.
- Orden de las fotos: `portada.*` primero; después, orden natural por nombre (`02` antes de `10`).
- Si el nombre empieza con un color declarado en `producto.json` (por ejemplo, `morado-`), esa foto pertenece a ese color. Al elegir un color en la tarjeta o en la galería, se muestran primero las fotos de ese color.
- Si no hay `portada`, la primera foto es la portada.
- `producto.json` se valida con un esquema Zod con estos campos: `nombre`, `coleccion` (enum: "dia-de-muertos", "mexicanos", "patrios", "navidad", "otros"), `precio` (número en MXN), `colores` (lista de `{ id, nombre, hex }`), `descripcion` corta, `etiqueta` opcional ("Nuevo" | "Temporada" | "Más vendido"), `disponible` (boolean, por defecto true), `destacado` (boolean) y `orden` (número opcional).
- Si falta `producto.json`, el producto se construye igual: el nombre sale del nombre de la carpeta, la colección es "otros" y no se muestra precio (en su lugar, "Pregunta por WhatsApp"). Muestra una advertencia en consola durante la compilación.
- Si una carpeta no tiene fotos, el build no debe romperse: excluye ese producto y avisa en consola.
- Las fotos de `galeria/` se cargan igual, en orden natural. El texto alternativo sale del nombre del archivo (`aretes-en-caja.jpg` → "Aretes en caja"), con opción de sobreescribirlo desde un `galeria.json` opcional.
- Crea **3 productos de ejemplo** con imágenes de muestra generadas por un script (con `sharp`: fondos de color con el nombre del producto), marcadas con claridad como de ejemplo, para que el sitio funcione desde el primer `npm run dev`. Uno de ellos debe ser "Papel picado calaverita" a $[120], en morado y rosa.
- Agrega un script `npm run productos:validar` que revise todas las carpetas e informe qué falta (sin fotos, JSON inválido, colores sin fotos).

## 5. Galería interactiva

Es la pieza más importante de la página. Constrúyela como componentes reutilizables.

**En las tarjetas del catálogo:**
- La foto de portada con proporción 4:5. En escritorio, al pasar el cursor, cambia a la segunda foto. En móvil, se pueden deslizar las fotos dentro de la tarjeta.
- Los selectores de color son cuadritos (el recurso de la marca). Al tocar uno, la tarjeta muestra una foto de ese color y se actualiza el mensaje de WhatsApp.
- Al tocar la foto, se abre el visor.

**El visor (lightbox):**
- Muestra la foto grande, las miniaturas, un contador ("3 de 8"), el nombre del producto, el precio, los colores y el botón "Pedir por WhatsApp".
- Navegación con flechas del teclado, botones y deslizamiento con el dedo en móvil.
- Zoom con doble toque o doble clic, y con pellizco en móvil. Al hacer zoom se puede arrastrar la imagen.
- Se cierra con Escape, con el botón de cerrar o tocando el fondo. Al cerrar, el foco regresa a la tarjeta que lo abrió. Mientras está abierto, el foco queda atrapado dentro del visor y se bloquea el scroll de la página.
- Usa `<dialog>` nativo con roles y etiquetas ARIA correctos.
- Precarga la foto siguiente y la anterior.
- Enlace profundo: abrir un producto actualiza la URL (`#producto/papel-picado-calaverita/3`), de modo que si comparto ese enlace por WhatsApp, abre el visor en esa foto. El botón "atrás" del navegador cierra el visor.
- Sección "Así se ven" con las fotos de `galeria/` en mosaico (masonry o cuadrícula con alturas variadas), usando el mismo visor.

## 6. Cómo se compra: todo por WhatsApp

No hay carrito ni pagos en esta fase. Todos los botones de compra abren WhatsApp con un mensaje prellenado.

- Número: `[TU_NÚMERO_CON_LADA, ejemplo 5215512345678]`, en `https://wa.me/<NUMERO>?text=<MENSAJE_URL_ENCODED>`.
- Por producto: "Hola, me interesan los aretes [nombre] en color [color]. ¿Están disponibles?" (incluye el enlace profundo al producto).
- Personalización: "Hola, quiero unos aretes personalizados. Mi idea es: "
- Mayoreo: "Hola, me interesa comprar al mayoreo para mi tienda/negocio."
- Botón flotante de WhatsApp fijo abajo a la derecha, visible en todo el sitio, con el texto accesible "Escríbenos por WhatsApp".

## 7. Secciones (en este orden)

1. **Encabezado:** logo; enlaces a Catálogo, Galería, Personaliza, Mayoreo y Preguntas; botón "Pedir por WhatsApp". Menú hamburguesa accesible en móvil.
2. **Hero:** la animación del símbolo armándose con cuadritos, un titular corto sobre accesorios mexicanos impresos en 3D (propón 3 opciones y usa la mejor), un subtítulo de una línea, el botón "Ver catálogo" y el botón secundario "Pedir por WhatsApp". Muestra la foto del producto destacado.
3. **Temporada:** franja de la colección de temporada con la promoción "2 pares por $[200]". Se activa o desactiva desde la configuración.
4. **Catálogo:** cuadrícula con filtros por colección (Todos, Día de Muertos, Mexicanos, Patrios, Navidad). Solo aparecen los filtros de colecciones que tengan productos. Los filtros actualizan la URL (`?coleccion=patrios`) y funcionan con teclado. Los productos no disponibles se muestran con la etiqueta "Agotado" y con el botón "Avísame por WhatsApp".
5. **Así se ven:** la galería de ambiente.
6. **Cómo se hacen:** proceso en 3 pasos (aquí sí va numeración, porque es una secuencia): diseño digital, impresión 3D capa por capa, armado y revisión a mano. Incluye una línea breve y cálida que diga que detrás de aalcuadrado está Antonio Alonso.
7. **Por qué aalcuadrado:** 3 o 4 beneficios concretos: muy ligeros ([5–7] g por arete), no se rompen ni se arrugan, colores a elección, ganchos [TIPO DE GANCHO: CONFIRMAR ANTES DE PUBLICAR].
8. **Personaliza:** colores, iniciales o nombre (+$[40]) y pedidos para eventos (bodas, XV años, fiestas), con su botón de WhatsApp.
9. **Mayoreo:** desde [12] pares, se cotiza por WhatsApp. No muestres precios de mayoreo.
10. **Preguntas frecuentes** (acordeón accesible): material (PLA), cuidados, tiempo de entrega ([X] días), envíos ([zonas y costo]), formas de pago ([métodos]) y cambios.
11. **Pie de página:** logo, Instagram `[@aalcuadrado]`, Facebook `[página]`, TikTok `[@aalcuadrado]`, WhatsApp, "Hecho en [Ciudad de México]" y el año.

## 8. Arquitectura preparada para un backend futuro

Hoy todo es estático, pero más adelante agregaré un backend para gestionar productos, inventario y pedidos. Deja la base lista sin construir nada de eso todavía:

- **Capa de dominio** (`src/domain/`): tipos y esquemas Zod de `Producto`, `FotoProducto`, `Color` y `Coleccion`. Son el contrato de datos que respetará el futuro backend.
- **Capa de acceso a datos** (`src/data/`): una interfaz `CatalogoRepository` (`listarProductos`, `obtenerProducto`, `listarColecciones`, `listarFotosGaleria`) con una implementación `CatalogoArchivosLocales` que lee las carpetas. Las páginas y componentes nunca leen archivos directamente: siempre pasan por el repositorio. Más adelante agregaré `CatalogoApi` sin tocar la UI.
- **Servicio de pedidos** (`src/services/pedidos.ts`): construye los enlaces de WhatsApp detrás de una interfaz `CanalPedidos`, para poder cambiarlo después por un carrito o checkout.
- **Configuración** (`src/config/sitio.ts`): número de WhatsApp, redes, promoción de temporada (activa, texto, precio), precios de personalización y mayoreo, y textos de las preguntas frecuentes. Todo comentado en español.
- Documenta en `docs/arquitectura.md` las decisiones (por qué Astro, por qué es estático, cómo se migraría a modo híbrido o servidor con un adaptador y una API) con un diagrama Mermaid de capas.

## 9. Calidad

- Mobile-first: la mayoría de los visitantes llegarán desde Instagram o WhatsApp en el celular.
- Lighthouse de 90 o más en todas las categorías en móvil. Las imágenes deben estar optimizadas, con `loading="lazy"` fuera del hero, `sizes` correcto y sin saltos de diseño (CLS).
- Accesibilidad AA: contraste, foco visible, todo operable con teclado y textos alternativos.
- SEO en español (`lang="es-MX"`): título, descripción, Open Graph y Twitter Card (genera una imagen OG de 1200×630 con el logo), JSON-LD de `Organization` y de `Product` por cada producto, `sitemap` y `robots.txt`.
- `npm run check` (astro check + tipos) sin errores, y el build sin advertencias, salvo las de productos incompletos.

## 10. Despliegue

Configura el despliegue gratuito en GitHub Pages con un GitHub Action que compile y publique al hacer push a `main`. Deja también una nota en el README sobre cómo usar Netlify o Cloudflare Pages como alternativa.

## 11. Al terminar

1. Resume la estructura del proyecto y las decisiones principales.
2. Escribe un `README.md` en español, para alguien que no programa todos los días, con:
   - Cómo correr el sitio en mi computadora.
   - **Cómo agregar un producto nuevo paso a paso** (crear carpeta, nombrar las fotos, llenar `producto.json`), con un ejemplo.
   - Cómo marcar un producto como agotado, cambiar precios, activar o desactivar la temporada y cambiar el número de WhatsApp.
   - Cómo publicar los cambios.
3. Lista lo que quedó pendiente de mi parte (fotos reales, datos entre corchetes, tipo de ganchos).
