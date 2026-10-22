/**
 * Contrato de datos del catálogo.
 *
 * Estos esquemas son la fuente de verdad: hoy validan los JSON de
 * `src/content/` (escritos a mano o desde Pages CMS) y mañana validarán
 * las respuestas del backend.
 * Este archivo solo depende de `zod` para poder usarse también desde
 * los scripts de Node (por ejemplo, `npm run productos:validar`).
 */
import { z } from 'zod';

import { COLECCIONES, type ColeccionId } from './colecciones.ts';

export { COLECCIONES, NOMBRES_COLECCION, type ColeccionId } from './colecciones.ts';

export const ColeccionIdSchema = z.enum(COLECCIONES);

export const ETIQUETAS = ['Nuevo', 'Temporada', 'Más vendido'] as const;

export const REGEX_IMAGEN = /\.(jpe?g|png|webp|avif)$/i;
const REGEX_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
 * Pages CMS escribe "" o null cuando un campo opcional se deja vacío.
 * Estos ayudantes los tratan como si el campo no existiera.
 */
const vacio = (v: unknown) => (v === '' || v === null ? undefined : v);
const opcional = <T extends z.ZodType>(esquema: T) => z.preprocess(vacio, esquema.optional());
const lista = <T extends z.ZodType>(esquema: T) => z.preprocess((v) => vacio(v) ?? [], z.array(esquema));

/** Ruta de una foto dentro del repositorio, tal como la escribe Pages CMS: `/src/content/fotos/…/foto.jpg`. */
export const RutaImagenSchema = z
  .string()
  .regex(/^\/?src\/content\/fotos\//, 'La foto debe estar dentro de src/content/fotos/')
  .regex(REGEX_IMAGEN, 'Usa una foto .jpg, .png, .webp o .avif');

export const ColorSchema = z.object({
  /** Identificador corto en minúsculas; se usa en los enlaces y para elegir el color. */
  id: z.string().min(1).regex(REGEX_ID, 'Usa minúsculas, números y guiones, sin espacios ni acentos'),
  nombre: z.string().min(1),
  hex: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Usa un color hexadecimal, por ejemplo #3B2A9B'),
});
export type Color = z.infer<typeof ColorSchema>;

/** Un color tal como se escribe en el JSON: el `id` es opcional (sale del nombre) y trae sus fotos. */
export const ColorJsonSchema = ColorSchema.extend({
  id: opcional(ColorSchema.shape.id),
  fotos: lista(RutaImagenSchema),
});
export type ColorJson = z.infer<typeof ColorJsonSchema>;

/** Lo que se escribe en `src/content/productos/<slug>.json` (a mano o desde Pages CMS). */
export const ProductoJsonSchema = z.object({
  nombre: z.string().min(1),
  coleccion: ColeccionIdSchema,
  precio: opcional(z.number().positive()),
  /** Foto principal. Si no hay, se usa la primera del primer color. */
  portada: opcional(RutaImagenSchema),
  colores: lista(ColorJsonSchema),
  /** Fotos que no son de un color en particular (en el puesto, en la caja…). */
  otrasFotos: lista(RutaImagenSchema),
  descripcion: z.preprocess((v) => vacio(v) ?? '', z.string().max(240)),
  etiqueta: opcional(z.enum(ETIQUETAS)),
  disponible: z.preprocess(vacio, z.boolean().default(true)),
  destacado: z.preprocess(vacio, z.boolean().default(false)),
  orden: opcional(z.number()),
});
export type ProductoJson = z.infer<typeof ProductoJsonSchema>;

/**
 * Foto ya resuelta. `src` es una referencia opaca a la imagen:
 * con archivos locales es un `ImageMetadata` de Astro; con un backend
 * podría ser una URL. Por eso el tipo es genérico.
 */
export interface FotoProducto<TImagen = unknown> {
  src: TImagen;
  alt: string;
  archivo: string;
  /** Id del color al que pertenece, si se subió dentro de un color. */
  colorId?: string;
  esPortada: boolean;
}

export interface Producto<TImagen = unknown> {
  slug: string;
  nombre: string;
  coleccion: ColeccionId;
  /** `undefined` cuando no hay precio: se muestra "Pregunta por WhatsApp". */
  precio?: number;
  colores: Color[];
  descripcion: string;
  etiqueta?: (typeof ETIQUETAS)[number];
  disponible: boolean;
  destacado: boolean;
  orden?: number;
  fotos: FotoProducto<TImagen>[];
}

export interface Coleccion {
  id: ColeccionId;
  nombre: string;
  totalProductos: number;
}

export interface FotoGaleria<TImagen = unknown> {
  src: TImagen;
  alt: string;
  archivo: string;
}

/** Lo que se escribe en `src/content/galeria.json`. Las fotos salen en este orden. */
export const GaleriaJsonSchema = z.object({
  fotos: lista(z.object({ imagen: RutaImagenSchema, alt: opcional(z.string().min(1)) })),
});

/** Un producto tal como lo devuelve la API (back-aalcuadrado). Los colores ya traen su `id`. */
export const ProductoApiSchema = z.object({
  slug: z.string().regex(REGEX_ID),
  nombre: z.string().min(1),
  coleccion: ColeccionIdSchema,
  descripcion: z.string().max(240),
  etiqueta: z.enum(ETIQUETAS).nullable(),
  precio: z.number().positive().nullable(),
  disponible: z.boolean(),
  destacado: z.boolean(),
  orden: z.number().nullable(),
  colores: z.array(ColorSchema),
});
export type ProductoApi = z.infer<typeof ProductoApiSchema>;

/** Una foto subida desde el panel de la API, ya descargada a `src/content/fotos/api/`. */
export const FotoApiSchema = z.object({
  imagen: RutaImagenSchema,
  categoria: z.enum(['productos', 'galeria']),
  producto: z.string().nullable(),
  color: z.string().nullable(),
  alt: z.string().nullable(),
  orden: z.number(),
});
export type FotoApi = z.infer<typeof FotoApiSchema>;

/** Lo que escribe `npm run api:sincronizar` en `src/content/catalogo-api.json`. Las fotos ya vienen en orden. */
export const CatalogoApiJsonSchema = z.object({
  productos: z.array(ProductoApiSchema),
  fotos: z.array(FotoApiSchema),
});
export type CatalogoApi = z.infer<typeof CatalogoApiJsonSchema>;

/* ---------- Utilidades puras compartidas por la app y los scripts ---------- */

export const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;

const comparador = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

/** Orden natural: `foto-2` va antes que `foto-10`. */
export function ordenNatural(a: string, b: string): number {
  return comparador.compare(a, b);
}

export function sinExtension(archivo: string): string {
  return archivo.replace(/\.[^.]+$/, '');
}

/** `aretes-en-caja.jpg` → "Aretes en caja". */
export function textoDesdeArchivo(archivo: string): string {
  const texto = sinExtension(archivo).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Rosa mexicano" → `rosa-mexicano`. Se usa para el `id` de los colores que no lo traen. */
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `src/content/fotos/a.jpg` → `/src/content/fotos/a.jpg` (las claves de `import.meta.glob` empiezan con `/`). */
export function normalizarRuta(ruta: string): string {
  return ruta.startsWith('/') ? ruta : `/${ruta}`;
}

/** Id del color: el que trae el JSON o, si no, el nombre en minúsculas y con guiones. */
export function idDeColor(color: Pick<ColorJson, 'id' | 'nombre'>): string {
  return color.id ?? slugificar(color.nombre);
}

/** Ruta de cada foto del producto con el color al que pertenece, sin repetir. */
export interface FotoJson {
  ruta: string;
  colorId?: string;
}

/** Orden de las fotos: portada, luego las de cada color (en el orden de los colores) y al final las demás. */
export function fotosDelProducto(datos: ProductoJson): FotoJson[] {
  const fotos: FotoJson[] = [];
  const vistas = new Set<string>();
  const agregar = (ruta: string, colorId?: string) => {
    const r = normalizarRuta(ruta);
    if (vistas.has(r)) return;
    vistas.add(r);
    fotos.push({ ruta: r, colorId });
  };
  if (datos.portada) agregar(datos.portada);
  for (const color of datos.colores) for (const ruta of color.fotos) agregar(ruta, idDeColor(color));
  for (const ruta of datos.otrasFotos) agregar(ruta);
  return fotos;
}
