/**
 * Revisa los productos, la galería y sus fotos e informa qué falta.
 * Uso: npm run productos:validar
 *
 * Usa los mismos esquemas que el sitio (src/domain/catalogo.ts),
 * así que si aquí todo sale bien, el catálogo se verá completo.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  GaleriaJsonSchema,
  ProductoJsonSchema,
  REGEX_IMAGEN,
  fotosDelProducto,
  idDeColor,
  normalizarRuta,
} from '../src/domain/catalogo.ts';

const raizProyecto = new URL('../', import.meta.url).pathname;
const raiz = join(raizProyecto, 'src/content');
const carpetaProductos = join(raiz, 'productos');
const carpetaFotos = join(raiz, 'fotos');
const rutaGaleria = join(raiz, 'galeria.json');

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

/** Todas las fotos de src/content/fotos, como las escribe Pages CMS: `/src/content/fotos/…`. */
function listarFotos(carpeta: string): string[] {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return listarFotos(ruta);
    return REGEX_IMAGEN.test(nombre) ? [`/${relative(raizProyecto, ruta)}`] : [];
  });
}

function leerJson(ruta: string): unknown {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    error(`No es JSON válido: ${(e as Error).message}`);
    return undefined;
  }
}

const fotosExistentes = new Set(listarFotos(carpetaFotos));
const fotosUsadas = new Set<string>();

function revisarFoto(ruta: string) {
  const r = normalizarRuta(ruta);
  fotosUsadas.add(r);
  if (!fotosExistentes.has(r)) error(`La foto "${ruta}" no existe.`);
}

console.log('\nProductos (src/content/productos)\n');

const archivos = existsSync(carpetaProductos)
  ? readdirSync(carpetaProductos).filter((n) => !n.startsWith('.'))
  : [];
if (archivos.length === 0) aviso('No hay ningún producto.');

for (const archivo of archivos.sort()) {
  const erroresAntes = errores;
  const avisosAntes = avisos;
  const ruta = join(carpetaProductos, archivo);

  if (!archivo.endsWith('.json') || statSync(ruta).isDirectory()) {
    console.log(archivo);
    aviso('Aquí solo van archivos .json (uno por producto); se ignora.');
    continue;
  }

  const slug = archivo.replace(/\.json$/, '');
  const crudo = leerJson(ruta);
  const r = crudo === undefined ? undefined : ProductoJsonSchema.safeParse(crudo);
  const fotos = r?.success ? fotosDelProducto(r.data) : [];
  console.log(`${slug} ${gris(`(${fotos.length} foto${fotos.length === 1 ? '' : 's'})`)}`);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    aviso('El nombre del archivo debería ir en minúsculas, sin acentos ni espacios (se usa en el enlace).');
  }
  if (r && !r.success) {
    for (const i of r.error.issues) error(`${i.path.join('.') || '(raíz)'}: ${i.message}`);
  } else if (r?.success) {
    const datos = r.data;
    if (fotos.length === 0) error('No tiene fotos: no aparecerá en el catálogo.');
    for (const f of fotos) revisarFoto(f.ruta);
    for (const color of datos.colores) {
      if (color.fotos.length === 0) aviso(`El color "${color.nombre}" no tiene fotos.`);
    }
    const ids = datos.colores.map(idDeColor);
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (repetidos.length) error(`Colores repetidos: ${[...new Set(repetidos)].join(', ')}.`);
  }

  if (errores === erroresAntes && avisos === avisosAntes) console.log(`   ${verde('✓')} Todo en orden`);
}

console.log('\nGalería (src/content/galeria.json)\n');
if (!existsSync(rutaGaleria)) {
  aviso('No existe galeria.json: la sección "Así se ven" no se mostrará.');
} else {
  const crudo = leerJson(rutaGaleria);
  const r = crudo === undefined ? undefined : GaleriaJsonSchema.safeParse(crudo);
  if (r && !r.success) {
    for (const i of r.error.issues) error(`${i.path.join('.') || '(raíz)'}: ${i.message}`);
  } else if (r?.success) {
    const erroresAntes = errores;
    for (const f of r.data.fotos) revisarFoto(f.imagen);
    if (r.data.fotos.length === 0) aviso('No hay fotos: la sección "Así se ven" no se mostrará.');
    else if (errores === erroresAntes) console.log(`   ${verde('✓')} ${r.data.fotos.length} fotos`);
  }
}

const sinUsar = [...fotosExistentes].filter((f) => !fotosUsadas.has(f)).sort();
if (sinUsar.length) {
  console.log('\nFotos sin usar (src/content/fotos)\n');
  for (const f of sinUsar) aviso(`${f} no aparece en ningún producto ni en la galería.`);
}

console.log(
  `\n${errores ? rojo(`${errores} error${errores === 1 ? '' : 'es'}`) : verde('0 errores')} · ${
    avisos ? amarillo(`${avisos} aviso${avisos === 1 ? '' : 's'}`) : verde('0 avisos')
  }\n`,
);
process.exit(errores ? 1 : 0);
