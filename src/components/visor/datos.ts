/**
 * Prepara, al compilar, las versiones optimizadas de cada foto que usa
 * el visor (varios anchos en WebP y una miniatura). El resultado viaja
 * al navegador como JSON dentro de la página.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { FotoGaleria, Producto } from '@/domain/catalogo';
import { formatearPrecio } from '@/services/pedidos';

export interface FotoVisor {
  src: string;
  srcset: string;
  ancho: number;
  alto: number;
  alt: string;
  miniatura: string;
  colorId?: string;
}

export interface ElementoVisor {
  /** Lo que aparece en la URL: `producto/<slug>` o `galeria`. */
  clave: string;
  titulo: string;
  precio?: string;
  colores: { id: string; nombre: string; hex: string }[];
  disponible: boolean;
  fotos: FotoVisor[];
}

const ANCHOS = [640, 960, 1400, 1920];

async function fotoVisor(imagen: ImageMetadata, alt: string, colorId?: string): Promise<FotoVisor> {
  const anchos = ANCHOS.filter((a) => a < imagen.width).concat(Math.min(imagen.width, 1920));
  const [grande, mini] = await Promise.all([
    getImage({ src: imagen, widths: [...new Set(anchos)], format: 'webp', quality: 82 }),
    getImage({ src: imagen, width: 160, format: 'webp', quality: 70 }),
  ]);
  return {
    src: grande.src,
    srcset: grande.srcSet.attribute,
    ancho: imagen.width,
    alto: imagen.height,
    alt,
    miniatura: mini.src,
    colorId,
  };
}

export async function elementoDeProducto(producto: Producto<ImageMetadata>): Promise<ElementoVisor> {
  return {
    clave: `producto/${producto.slug}`,
    titulo: producto.nombre,
    precio: producto.precio === undefined ? undefined : formatearPrecio(producto.precio),
    colores: producto.colores,
    disponible: producto.disponible,
    fotos: await Promise.all(producto.fotos.map((f) => fotoVisor(f.src, f.alt, f.colorId))),
  };
}

export async function elementoDeGaleria(fotos: FotoGaleria<ImageMetadata>[]): Promise<ElementoVisor> {
  return {
    clave: 'galeria',
    titulo: 'Así se ven',
    colores: [],
    disponible: true,
    fotos: await Promise.all(fotos.map((f) => fotoVisor(f.src, f.alt))),
  };
}
