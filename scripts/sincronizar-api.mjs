/**
 * Descarga el catálogo de la API (back-aalcuadrado): los productos, las fotos
 * subidas desde su panel, los colores y aromas de los kits y los tamaños y moldes
 * de las velas. Las fotos van a src/content/fotos/api/ y los datos a
 * src/content/catalogo-api.json. Corre antes de compilar.
 * Sin API_URL no hace nada: el sitio usa solo los productos y fotos del repositorio.
 *
 *   API_URL=https://api.tudominio.com API_USUARIO=… API_PASSWORD=… npm run api:sincronizar
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';

const CARPETA = 'src/content/fotos/api';
const MANIFIESTO = 'src/content/catalogo-api.json';
const { API_URL, API_USUARIO, API_PASSWORD } = process.env;

if (!API_URL) {
  console.log('[api] Sin API_URL: se usan solo los productos y fotos del repositorio.');
  process.exit(0);
}
if (!API_USUARIO || !API_PASSWORD) {
  console.error('[api] Faltan API_USUARIO o API_PASSWORD.');
  process.exit(1);
}

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(new URL(ruta, API_URL), opciones);
  if (!respuesta.ok) {
    throw new Error(`[api] ${opciones.method ?? 'GET'} ${ruta} respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  return respuesta;
}

const { access_token } = await (
  await pedir('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: API_USUARIO, password: API_PASSWORD }),
  })
).json();
const conToken = { headers: { Authorization: `Bearer ${access_token}` } };

// Una API de antes de un módulo responde 404 en su ruta (por ejemplo /api/categorias,
// /api/kits/colores o /api/velas/presentaciones): se sigue sin esos datos.
async function pedirOpcional(ruta) {
  const respuesta = await fetch(new URL(ruta, API_URL), conToken);
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error(`[api] GET ${ruta} respondió ${respuesta.status}: ${await respuesta.text()}`);
  return respuesta.json();
}

const [productosApi, categoriasApi, imagenes, coloresKit, aromasKit, presentacionesVela] = await Promise.all([
  pedir('/api/productos', conToken).then((r) => r.json()),
  pedirOpcional('/api/categorias').then((c) => c ?? []),
  pedir('/api/imagenes', conToken).then((r) => r.json()),
  pedirOpcional('/api/kits/colores'),
  pedirOpcional('/api/kits/aromas'),
  pedirOpcional('/api/velas/presentaciones'),
]);

// Se descarga todo de nuevo en cada compilación: así una foto borrada en el panel desaparece del sitio.
await rm(CARPETA, { recursive: true, force: true });

const fotos = [];
for (const imagen of imagenes) {
  const destino = posix.join(CARPETA, imagen.categoria, imagen.archivo);
  await mkdir(posix.dirname(destino), { recursive: true });
  // Se arma con API_URL (no con imagen.url) para que funcione igual en local que en el túnel.
  const archivo = await pedir(`/uploads/${imagen.categoria}/${encodeURIComponent(imagen.archivo)}`);
  await writeFile(destino, Buffer.from(await archivo.arrayBuffer()));
  fotos.push({
    imagen: `/${destino}`,
    categoria: imagen.categoria,
    producto: imagen.producto,
    color: imagen.color,
    alt: imagen.alt,
    orden: imagen.orden,
  });
}

const productos = productosApi.map((p) => ({
  slug: p.slug,
  nombre: p.nombre,
  coleccion: p.coleccion,
  descripcion: p.descripcion,
  etiqueta: p.etiqueta,
  precio: p.precio,
  disponible: p.disponible,
  destacado: p.destacado,
  orden: p.orden,
  categoria: p.categoria ? { slug: p.categoria.slug, nombre: p.categoria.nombre } : null,
  colores: p.colores,
}));

// Ya vienen ordenadas como en el panel (por `orden` y luego por nombre).
const categorias = categoriasApi.map((c) => ({
  slug: c.slug,
  nombre: c.nombre,
}));

// Solo los disponibles, ya en el orden del panel. `null` si la API no tiene el módulo o está vacío:
// el sitio usa entonces los de src/config/sitio.ts.
const kits =
  coloresKit?.length || aromasKit?.length
    ? {
        colores: (coloresKit ?? [])
          .filter((c) => c.disponible)
          .map(({ nombre, hex, enJabon, enVela }) => ({
            nombre,
            hex,
            enJabon,
            enVela,
          })),
        aromas: (aromasKit ?? [])
          .filter((a) => a.disponible)
          .map(({ nombre, enJabon, enVela }) => ({ nombre, enJabon, enVela })),
      }
    : null;

// Tamaños y moldes de las velas individuales: solo los disponibles, ya agrupados por tipo y en
// el orden del panel. `null` si la API no tiene el módulo: el sitio usa los de src/config/sitio.ts.
const disponibles = (presentacionesVela ?? []).filter((p) => p.disponible);
const velas = presentacionesVela
  ? { presentaciones: disponibles.map(({ tipo, nombre, gramos, marmoleable, orden }) => ({ tipo, nombre, gramos, marmoleable, orden })) }
  : null;

await writeFile(MANIFIESTO, `${JSON.stringify({ productos, categorias, fotos, kits, velas }, null, 2)}\n`);
console.log(
  `[api] ${productos.length} producto(s), ${categorias.length} categoría(s), ${fotos.length} foto(s)` +
    (kits ? `, ${kits.colores.length} color(es) y ${kits.aromas.length} aroma(s) de kits` : '') +
    (velas ? `, ${velas.presentaciones.length} tamaño(s) o molde(s) de velas` : '') +
    ` descargados de ${API_URL}.`,
);
