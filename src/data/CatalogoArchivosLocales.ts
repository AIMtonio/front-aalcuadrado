import type { ImageMetadata } from 'astro';
import { sitio } from '@/config/sitio';
import {
  COLECCIONES,
  GaleriaJsonSchema,
  NOMBRES_COLECCION,
  ProductoJsonSchema,
  fotosDelProducto,
  idDeColor,
  normalizarRuta,
  ordenNatural,
  textoDesdeArchivo,
  type Coleccion,
  type FotoGaleria,
  type FotoProducto,
  type Producto,
} from '@/domain/catalogo';
import type { CatalogoRepository } from './CatalogoRepository';

/*
 * Vite resuelve estos patrones al compilar: cada imagen se importa como
 * `ImageMetadata` y Astro la optimiza (AVIF/WebP, varios tamaños).
 * Los JSON (que escribe Pages CMS) solo guardan la ruta de cada foto;
 * aquí se cruza esa ruta con la imagen ya importada.
 */
const imagenes = import.meta.glob<ImageMetadata>(
  '/src/content/fotos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);
const jsonProductos = import.meta.glob<unknown>('/src/content/productos/*.json', {
  eager: true,
  import: 'default',
});
const jsonGaleria = import.meta.glob<unknown>('/src/content/galeria.json', {
  eager: true,
  import: 'default',
});

type Imagen = ImageMetadata;

const avisados = new Set<string>();
function avisar(mensaje: string) {
  if (avisados.has(mensaje)) return;
  avisados.add(mensaje);
  console.warn(`\x1b[33m[aalcuadrado]\x1b[0m ${mensaje}`);
}

/** `/src/content/productos/mi-producto.json` → `mi-producto` */
function slugDeRuta(ruta: string): string {
  return (ruta.split('/').at(-1) ?? '').replace(/\.json$/, '');
}

function archivoDeRuta(ruta: string): string {
  return ruta.split('/').at(-1) ?? '';
}

function buscarImagen(ruta: string, contexto: string): Imagen | undefined {
  const imagen = imagenes[normalizarRuta(ruta)];
  if (!imagen) avisar(`${contexto}: no encontré la foto "${ruta}"; se omite.`);
  return imagen;
}

function construirProductos(): Producto<Imagen>[] {
  const productos: Producto<Imagen>[] = [];

  for (const [ruta, crudo] of Object.entries(jsonProductos)) {
    const slug = slugDeRuta(ruta);
    const resultado = ProductoJsonSchema.safeParse(crudo);
    if (!resultado.success) {
      const detalle = resultado.error.issues.map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`).join('; ');
      avisar(`"productos/${slug}.json" tiene errores (${detalle}); no aparece en el catálogo.`);
      continue;
    }
    const datos = resultado.data;
    const colores = datos.colores.map((c) => ({ id: idDeColor(c), nombre: c.nombre, hex: c.hex }));

    const fotos: FotoProducto<Imagen>[] = [];
    for (const { ruta: rutaFoto, colorId } of fotosDelProducto(datos)) {
      const src = buscarImagen(rutaFoto, `"${slug}"`);
      if (!src) continue;
      const color = colores.find((c) => c.id === colorId);
      fotos.push({
        src,
        archivo: archivoDeRuta(rutaFoto),
        colorId,
        esPortada: fotos.length === 0,
        alt: [`Aretes ${datos.nombre}`, color && `en color ${color.nombre.toLowerCase()}`].filter(Boolean).join(', '),
      });
    }

    if (fotos.length === 0) {
      avisar(`"${slug}" no tiene fotos: no aparece en el catálogo.`);
      continue;
    }
    for (const color of colores) {
      if (!fotos.some((f) => f.colorId === color.id)) avisar(`"${slug}": el color "${color.nombre}" no tiene fotos.`);
    }

    productos.push({
      slug,
      nombre: datos.nombre,
      coleccion: datos.coleccion,
      // De momento todos los diseños listos cuestan lo mismo (ver sitio.precios).
      precio: sitio.precios.listo,
      colores,
      descripcion: datos.descripcion,
      etiqueta: datos.etiqueta,
      disponible: datos.disponible,
      destacado: datos.destacado,
      orden: datos.orden,
      fotos,
    });
  }

  // Disponibles primero; luego por `orden` (si lo hay) y por nombre.
  return productos.sort(
    (a, b) =>
      Number(b.disponible) - Number(a.disponible) ||
      (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER) ||
      ordenNatural(a.nombre, b.nombre),
  );
}

function construirGaleria(): FotoGaleria<Imagen>[] {
  const crudo = Object.values(jsonGaleria)[0];
  if (crudo === undefined) return [];
  const resultado = GaleriaJsonSchema.safeParse(crudo);
  if (!resultado.success) {
    avisar('galeria.json tiene errores; la sección "Así se ven" no se muestra.');
    return [];
  }

  const fotos: FotoGaleria<Imagen>[] = [];
  for (const { imagen, alt } of resultado.data.fotos) {
    const src = buscarImagen(imagen, 'Galería');
    if (!src) continue;
    const archivo = archivoDeRuta(imagen);
    fotos.push({ src, archivo, alt: alt ?? textoDesdeArchivo(archivo) });
  }
  return fotos;
}

export class CatalogoArchivosLocales implements CatalogoRepository<Imagen> {
  #productos?: Producto<Imagen>[];
  #galeria?: FotoGaleria<Imagen>[];

  async listarProductos() {
    this.#productos ??= construirProductos();
    return this.#productos;
  }

  async obtenerProducto(slug: string) {
    return (await this.listarProductos()).find((p) => p.slug === slug);
  }

  async listarColecciones(): Promise<Coleccion[]> {
    const productos = await this.listarProductos();
    return COLECCIONES.map((id) => ({
      id,
      nombre: NOMBRES_COLECCION[id],
      totalProductos: productos.filter((p) => p.coleccion === id).length,
    })).filter((c) => c.totalProductos > 0);
  }

  async listarFotosGaleria() {
    this.#galeria ??= construirGaleria();
    return this.#galeria;
  }
}
