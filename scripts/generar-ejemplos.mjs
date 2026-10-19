/**
 * Genera fotos de EJEMPLO para que el sitio funcione desde el primer `npm run dev`.
 * Reemplázalas por fotos reales: borra la carpeta del producto de ejemplo
 * o sustituye las imágenes conservando los nombres.
 *
 * Uso: npm run ejemplos:generar   (no sobrescribe archivos existentes; usa --forzar para hacerlo)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const raiz = new URL('../src/content/', import.meta.url).pathname;
const forzar = process.argv.includes('--forzar');

const productos = [
  {
    slug: 'papel-picado-calaverita',
    json: {
      nombre: 'Papel picado calaverita',
      coleccion: 'dia-de-muertos',
      precio: 120,
      colores: [
        { id: 'morado', nombre: 'Morado', hex: '#3B2A9B' },
        { id: 'rosa', nombre: 'Rosa mexicano', hex: '#E4007C' },
      ],
      descripcion: 'Una calaverita calada como el papel picado de las ofrendas, pero que no se rompe ni se arruga.',
      etiqueta: 'Temporada',
      disponible: true,
      destacado: true,
      orden: 1,
    },
    fotos: [
      ['portada', '#3B2A9B', 'Portada'],
      ['morado-01', '#3B2A9B', 'Morado · frente'],
      ['morado-02', '#2C1F78', 'Morado · detalle'],
      ['rosa-01', '#E4007C', 'Rosa · frente'],
      ['rosa-02', '#B80064', 'Rosa · detalle'],
      ['puesto-01', '#17142B', 'En el puesto'],
    ],
  },
  {
    slug: 'corazon-talavera',
    json: {
      nombre: 'Corazón de talavera',
      coleccion: 'mexicanos',
      precio: 150,
      colores: [
        { id: 'azul', nombre: 'Azul cobalto', hex: '#1F3FAE' },
        { id: 'amarillo', nombre: 'Amarillo', hex: '#F2B705' },
      ],
      descripcion: 'El trazo de la talavera poblana en un corazón ligero, para usar todos los días.',
      etiqueta: 'Nuevo',
      disponible: true,
      destacado: false,
      orden: 2,
    },
    fotos: [
      ['azul-01', '#1F3FAE', 'Azul · frente'],
      ['azul-02', '#16308A', 'Azul · de lado'],
      ['amarillo-01', '#C99700', 'Amarillo · frente'],
    ],
  },
  {
    slug: 'nochebuena',
    json: {
      nombre: 'Nochebuena',
      coleccion: 'navidad',
      precio: 130,
      colores: [{ id: 'rojo', nombre: 'Rojo', hex: '#C8102E' }],
      descripcion: 'La flor de diciembre, en capas que se notan cuando les da la luz.',
      disponible: false,
      destacado: false,
      orden: 3,
    },
    fotos: [
      ['rojo-01', '#C8102E', 'Rojo · frente'],
      ['rojo-02', '#9E0C24', 'Rojo · detalle'],
    ],
  },
];

const galeria = [
  ['aretes-en-caja', 1200, 1500, '#3B2A9B'],
  ['puesto-en-el-mercado', 1600, 1067, '#17142B'],
  ['mesa-de-impresion', 1200, 1200, '#5C5878'],
  ['aretes-puestos', 1200, 1600, '#E4007C'],
  ['detalle-de-capas', 1600, 1200, '#2C1F78'],
  ['pedido-listo-para-enviar', 1200, 1500, '#FF9F1C'],
];

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Lienzo con cuadritos (el recurso de la marca) y el texto "Foto de ejemplo". */
function svgEjemplo({ ancho, alto, fondo, titulo, subtitulo }) {
  const lado = Math.round(Math.min(ancho, alto) * 0.07);
  const paso = Math.round(lado * 1.16);
  const patron = [
    [1, 0], [2, 0], [3, 0],
    [0, 1], [4, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
    [0, 3], [4, 3],
    [0, 4], [4, 4],
  ];
  const ox = ancho / 2 - (paso * 5) / 2;
  const oy = alto * 0.3 - (paso * 5) / 2;
  const cuadritos = patron
    .map(([x, y]) => `<rect x="${ox + x * paso}" y="${oy + y * paso}" width="${lado}" height="${lado}" rx="${lado * 0.2}" fill="#fff" fill-opacity="0.9"/>`)
    .join('');
  const tamTitulo = Math.round(Math.min(ancho, alto) * 0.075);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
    <rect width="100%" height="100%" fill="${fondo}"/>
    ${cuadritos}
    <rect x="${ox + paso * 5}" y="${oy - paso * 0.6}" width="${lado * 0.75}" height="${lado * 0.75}" rx="${lado * 0.15}" fill="#E4007C"/>
    <text x="50%" y="${alto * 0.62}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${tamTitulo}" fill="#fff">${escapar(titulo)}</text>
    <text x="50%" y="${alto * 0.62 + tamTitulo * 1.3}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${tamTitulo * 0.55}" fill="#fff" fill-opacity="0.85">${escapar(subtitulo)}</text>
    <rect x="${ancho / 2 - tamTitulo * 3.2}" y="${alto * 0.84}" width="${tamTitulo * 6.4}" height="${tamTitulo * 0.95}" rx="${tamTitulo * 0.47}" fill="#000" fill-opacity="0.35"/>
    <text x="50%" y="${alto * 0.84 + tamTitulo * 0.64}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${tamTitulo * 0.42}" letter-spacing="2" fill="#fff">FOTO DE EJEMPLO</text>
  </svg>`;
}

async function escribirImagen(ruta, opciones) {
  if (existsSync(ruta) && !forzar) return false;
  await sharp(Buffer.from(svgEjemplo(opciones))).jpeg({ quality: 82, mozjpeg: true }).toFile(ruta);
  return true;
}

let creadas = 0;
for (const p of productos) {
  const carpeta = join(raiz, 'productos', p.slug);
  mkdirSync(carpeta, { recursive: true });
  const rutaJson = join(carpeta, 'producto.json');
  if (!existsSync(rutaJson) || forzar) writeFileSync(rutaJson, `${JSON.stringify(p.json, null, 2)}\n`);
  for (const [nombre, fondo, subtitulo] of p.fotos) {
    if (await escribirImagen(join(carpeta, `${nombre}.jpg`), { ancho: 1200, alto: 1500, fondo, titulo: p.json.nombre, subtitulo })) creadas++;
  }
}

const carpetaGaleria = join(raiz, 'galeria');
mkdirSync(carpetaGaleria, { recursive: true });
for (const [nombre, ancho, alto, fondo] of galeria) {
  const titulo = nombre.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  if (await escribirImagen(join(carpetaGaleria, `${nombre}.jpg`), { ancho, alto, fondo, titulo, subtitulo: 'Así se ven' })) creadas++;
}

console.log(`Listo: ${creadas} imágenes de ejemplo creadas en src/content/.`);
