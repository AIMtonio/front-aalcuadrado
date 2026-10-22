/**
 * Descarga las fotos subidas desde el panel de la API a src/content/fotos/api/
 * y escribe src/content/fotos-api.json con sus datos.
 * Corre antes de compilar. Sin API_URL no hace nada: el sitio usa solo las fotos del repositorio.
 *
 *   API_URL=https://api.tudominio.com API_USUARIO=… API_PASSWORD=… npm run fotos:sincronizar
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';

const CARPETA = 'src/content/fotos/api';
const MANIFIESTO = 'src/content/fotos-api.json';
const { API_URL, API_USUARIO, API_PASSWORD } = process.env;

if (!API_URL) {
  console.log('[fotos] Sin API_URL: se usan solo las fotos del repositorio.');
  process.exit(0);
}
if (!API_USUARIO || !API_PASSWORD) {
  console.error('[fotos] Faltan API_USUARIO o API_PASSWORD.');
  process.exit(1);
}

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(new URL(ruta, API_URL), opciones);
  if (!respuesta.ok) {
    throw new Error(`[fotos] ${opciones.method ?? 'GET'} ${ruta} respondió ${respuesta.status}: ${await respuesta.text()}`);
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

const imagenes = await (await pedir('/api/imagenes', { headers: { Authorization: `Bearer ${access_token}` } })).json();

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

await writeFile(MANIFIESTO, `${JSON.stringify({ fotos }, null, 2)}\n`);
console.log(`[fotos] ${fotos.length} foto(s) descargadas de ${API_URL}.`);
