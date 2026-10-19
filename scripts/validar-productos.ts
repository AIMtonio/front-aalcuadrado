/**
 * Revisa las carpetas de productos y de galería e informa qué falta.
 * Uso: npm run productos:validar
 *
 * Usa los mismos esquemas que el sitio (src/domain/catalogo.ts),
 * así que si aquí todo sale bien, el catálogo se verá completo.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  GaleriaJsonSchema,
  ProductoJsonSchema,
  REGEX_IMAGEN,
  colorDeArchivo,
  ordenarArchivos,
} from '../src/domain/catalogo.ts';

const raiz = new URL('../src/content/', import.meta.url).pathname;
const carpetaProductos = join(raiz, 'productos');
const carpetaGaleria = join(raiz, 'galeria');

const verde = (t: string) => `\x1b[32m${t}\x1b[0m`;
const amarillo = (t: string) => `\x1b[33m${t}\x1b[0m`;
const rojo = (t: string) => `\x1b[31m${t}\x1b[0m`;
const gris = (t: string) => `\x1b[90m${t}\x1b[0m`;

let errores = 0;
let avisos = 0;

function error(mensaje: string) {
  errores++;
  console.log(`   ${rojo('✗')} ${mensaje}`);
}
function aviso(mensaje: string) {
  avisos++;
  console.log(`   ${amarillo('!')} ${mensaje}`);
}

console.log('\nProductos (src/content/productos)\n');

const carpetas = existsSync(carpetaProductos)
  ? readdirSync(carpetaProductos).filter((n) => !n.startsWith('.') && statSync(join(carpetaProductos, n)).isDirectory())
  : [];

if (carpetas.length === 0) aviso('No hay ninguna carpeta de producto.');

for (const slug of carpetas.sort()) {
  const ruta = join(carpetaProductos, slug);
  const archivos = readdirSync(ruta);
  const fotos = ordenarArchivos(archivos.filter((a) => REGEX_IMAGEN.test(a)));
  const otros = archivos.filter((a) => !REGEX_IMAGEN.test(a) && a !== 'producto.json' && !a.startsWith('.'));
  const erroresAntes = errores;
  const avisosAntes = avisos;

  console.log(`${slug} ${gris(`(${fotos.length} foto${fotos.length === 1 ? '' : 's'})`)}`);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    aviso('El nombre de la carpeta debería ir en minúsculas, sin acentos ni espacios (se usa en el enlace).');
  }
  if (fotos.length === 0) error('No tiene fotos: no aparecerá en el catálogo.');
  for (const a of otros) aviso(`"${a}" no es una imagen compatible (usa .jpg, .png, .webp o .avif); se ignora.`);

  const rutaJson = join(ruta, 'producto.json');
  if (!existsSync(rutaJson)) {
    aviso('Falta producto.json: se mostrará sin precio, con el nombre de la carpeta y en la colección "otros".');
  } else {
    let crudo: unknown;
    try {
      crudo = JSON.parse(readFileSync(rutaJson, 'utf8'));
    } catch (e) {
      error(`producto.json no es JSON válido: ${(e as Error).message}`);
    }
    if (crudo !== undefined) {
      const r = ProductoJsonSchema.safeParse(crudo);
      if (!r.success) {
        for (const i of r.error.issues) error(`producto.json → ${i.path.join('.') || '(raíz)'}: ${i.message}`);
      } else {
        const datos = r.data;
        if (datos.precio === undefined) aviso('Sin precio: se mostrará "Pregunta por WhatsApp".');
        for (const color of datos.colores) {
          if (!fotos.some((f) => colorDeArchivo(f, datos.colores)?.id === color.id)) {
            aviso(`El color "${color.id}" no tiene fotos (nómbralas ${color.id}-01.jpg, ${color.id}-02.jpg…).`);
          }
        }
        const ids = datos.colores.map((c) => c.id);
        const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (repetidos.length) error(`Colores repetidos: ${[...new Set(repetidos)].join(', ')}.`);
      }
    }
  }

  if (errores === erroresAntes && avisos === avisosAntes) console.log(`   ${verde('✓')} Todo en orden`);
}

console.log('\nGalería (src/content/galeria)\n');
const fotosGaleria = existsSync(carpetaGaleria) ? readdirSync(carpetaGaleria).filter((a) => REGEX_IMAGEN.test(a)) : [];
if (fotosGaleria.length === 0) aviso('No hay fotos: la sección "Así se ven" no se mostrará.');
else console.log(`   ${verde('✓')} ${fotosGaleria.length} fotos`);

const rutaGaleriaJson = join(carpetaGaleria, 'galeria.json');
if (existsSync(rutaGaleriaJson)) {
  try {
    const r = GaleriaJsonSchema.safeParse(JSON.parse(readFileSync(rutaGaleriaJson, 'utf8')));
    if (!r.success) error('galeria.json no tiene el formato esperado: { "foto.jpg": { "alt": "Descripción" } }');
    else for (const archivo of Object.keys(r.data)) if (!fotosGaleria.includes(archivo)) aviso(`galeria.json menciona "${archivo}", que no existe.`);
  } catch (e) {
    error(`galeria.json no es JSON válido: ${(e as Error).message}`);
  }
}

console.log(
  `\n${errores ? rojo(`${errores} error${errores === 1 ? '' : 'es'}`) : verde('0 errores')} · ${
    avisos ? amarillo(`${avisos} aviso${avisos === 1 ? '' : 's'}`) : verde('0 avisos')
  }\n`,
);
process.exit(errores ? 1 : 0);
