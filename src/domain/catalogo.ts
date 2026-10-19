/**
 * Contrato de datos del catálogo.
 *
 * Estos esquemas son la fuente de verdad: hoy validan los `producto.json`
 * de las carpetas y mañana validarán las respuestas del backend.
 * Este archivo solo depende de `zod` para poder usarse también desde
 * los scripts de Node (por ejemplo, `npm run productos:validar`).
 */
import { z } from 'zod';

import { COLECCIONES, type ColeccionId } from './colecciones.ts';

export { COLECCIONES, NOMBRES_COLECCION, type ColeccionId } from './colecciones.ts';

export const ColeccionIdSchema = z.enum(COLECCIONES);

export const ETIQUETAS = ['Nuevo', 'Temporada', 'Más vendido'] as const;

export const ColorSchema = z.object({
  /** Identificador corto en minúsculas; también es el prefijo de las fotos (`morado-01.jpg`). */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones, sin espacios ni acentos'),
  nombre: z.string().min(1),
  hex: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Usa un color hexadecimal, por ejemplo #3B2A9B'),
});
export type Color = z.infer<typeof ColorSchema>;

/** Lo que se escribe en `producto.json`. */
export const ProductoJsonSchema = z
  .object({
    nombre: z.string().min(1),
    coleccion: ColeccionIdSchema,
    precio: z.number().positive().optional(),
    colores: z.array(ColorSchema).default([]),
    descripcion: z.string().max(240).default(''),
    etiqueta: z.enum(ETIQUETAS).optional(),
    disponible: z.boolean().default(true),
    destacado: z.boolean().default(false),
    orden: z.number().optional(),
  })
  .strict();
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
  /** Id del color al que pertenece, si el nombre del archivo empieza con él. */
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

export const GaleriaJsonSchema = z.record(z.string(), z.object({ alt: z.string().min(1) }).strict());

/* ---------- Utilidades puras compartidas por la app y los scripts ---------- */

export const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;
export const REGEX_IMAGEN = /\.(jpe?g|png|webp|avif)$/i;

const comparador = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

/** Orden natural: `foto-2` va antes que `foto-10`. */
export function ordenNatural(a: string, b: string): number {
  return comparador.compare(a, b);
}

export function sinExtension(archivo: string): string {
  return archivo.replace(/\.[^.]+$/, '');
}

export function esPortada(archivo: string): boolean {
  return /^portada$/i.test(sinExtension(archivo));
}

/** `aretes-en-caja.jpg` → "Aretes en caja". */
export function textoDesdeArchivo(archivo: string): string {
  const texto = sinExtension(archivo).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Devuelve el color cuyo id es prefijo del nombre del archivo (`morado-01.jpg` → morado). */
export function colorDeArchivo(archivo: string, colores: Color[]): Color | undefined {
  const base = sinExtension(archivo).toLowerCase();
  // Primero los ids más largos, para que `rosa-palido` gane sobre `rosa`.
  return [...colores]
    .sort((a, b) => b.id.length - a.id.length)
    .find((c) => base === c.id || base.startsWith(`${c.id}-`) || base.startsWith(`${c.id}_`));
}

/** Ordena archivos: portada primero y después orden natural. */
export function ordenarArchivos(archivos: string[]): string[] {
  return [...archivos].sort((a, b) => {
    const pa = esPortada(a) ? 0 : 1;
    const pb = esPortada(b) ? 0 : 1;
    return pa - pb || ordenNatural(a, b);
  });
}
