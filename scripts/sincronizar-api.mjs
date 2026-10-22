/**
 * Descarga el catálogo de la API (back-aalcuadrado): los productos y las fotos
 * subidas desde su panel. Las fotos van a src/content/fotos/api/ y los datos a
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

const [productosApi, imagenes] = await Promise.all([
  pedir('/api/productos', conToken).then((r) => r.json()),
  pedir('/api/imagenes', conToken).then((r) => r.json()),
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
  colores: p.colores,
}));

await writeFile(MANIFIESTO, `${JSON.stringify({ productos, fotos }, null, 2)}\n`);
console.log(`[api] ${productos.length} producto(s) y ${fotos.length} foto(s) descargados de ${API_URL}.`);
