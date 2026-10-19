import type { ImageMetadata } from 'astro';
import {
  COLECCIONES,
  GaleriaJsonSchema,
  NOMBRES_COLECCION,
  ProductoJsonSchema,
  colorDeArchivo,
  esPortada,
  ordenNatural,
  ordenarArchivos,
  textoDesdeArchivo,
  type Coleccion,
  type FotoGaleria,
  type FotoProducto,
  type Producto,
  type ProductoJson,
} from '@/domain/catalogo';
import type { CatalogoRepository } from './CatalogoRepository';

/*
 * Vite resuelve estos patrones al compilar: cada imagen se importa como
 * `ImageMetadata` y Astro la optimiza (AVIF/WebP, varios tamaños).
 * Agregar una carpeta o una foto no requiere tocar código.
 */
const imagenesProductos = import.meta.glob<ImageMetadata>(
  '/src/content/productos/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);
const jsonProductos = import.meta.glob<unknown>('/src/content/productos/*/producto.json', {
  eager: true,
  import: 'default',
});
const imagenesGaleria = import.meta.glob<ImageMetadata>(
  '/src/content/galeria/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);
const jsonGaleria = import.meta.glob<unknown>('/src/content/galeria/galeria.json', {
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

/** `/src/content/productos/mi-producto/foto.jpg` → `{ carpeta: 'mi-producto', archivo: 'foto.jpg' }` */
function partesRuta(ruta: string) {
  const partes = ruta.split('/');
  return { carpeta: partes.at(-2) ?? '', archivo: partes.at(-1) ?? '' };
}

function datosPorDefecto(slug: string): ProductoJson {
  return {
    nombre: textoDesdeArchivo(slug),
    coleccion: 'otros',
    colores: [],
    descripcion: '',
    disponible: true,
    destacado: false,
  };
}

function leerProductoJson(slug: string): ProductoJson {
  const crudo = jsonProductos[`/src/content/productos/${slug}/producto.json`];
  if (crudo === undefined) {
    avisar(`"${slug}" no tiene producto.json: se muestra sin precio y en la colección "otros".`);
    return datosPorDefecto(slug);
  }
  const resultado = ProductoJsonSchema.safeParse(crudo);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`).join('; ');
    avisar(`"${slug}/producto.json" tiene errores (${detalle}). Se muestra con datos básicos.`);
    return datosPorDefecto(slug);
  }
  return resultado.data;
}

function construirProductos(): Producto<Imagen>[] {
  const fotosPorCarpeta = new Map<string, { archivo: string; src: Imagen }[]>();
  for (const [ruta, src] of Object.entries(imagenesProductos)) {
    const { carpeta, archivo } = partesRuta(ruta);
    const lista = fotosPorCarpeta.get(carpeta) ?? [];
    lista.push({ archivo, src });
    fotosPorCarpeta.set(carpeta, lista);
  }

  // Carpetas con producto.json pero sin fotos: se excluyen.
  for (const ruta of Object.keys(jsonProductos)) {
    const { carpeta } = partesRuta(ruta);
    if (!fotosPorCarpeta.has(carpeta)) {
      avisar(`"${carpeta}" no tiene fotos: no aparece en el catálogo.`);
    }
  }

  const productos: Producto<Imagen>[] = [];
  for (const [slug, fotosCrudas] of fotosPorCarpeta) {
    const datos = leerProductoJson(slug);
    const porArchivo = new Map(fotosCrudas.map((f) => [f.archivo, f.src]));
    const archivos = ordenarArchivos([...porArchivo.keys()]);

    const fotos: FotoProducto<Imagen>[] = archivos.map((archivo, i) => {
      const color = colorDeArchivo(archivo, datos.colores);
      const descripcionFoto = esPortada(archivo) ? '' : textoDesdeArchivo(archivo).toLowerCase();
      return {
        src: porArchivo.get(archivo)!,
        archivo,
        colorId: color?.id,
        esPortada: i === 0,
        alt: [`Aretes ${datos.nombre}`, color ? `en color ${color.nombre.toLowerCase()}` : descripcionFoto]
          .filter(Boolean)
          .join(', '),
      };
    });

    for (const color of datos.colores) {
      if (!fotos.some((f) => f.colorId === color.id)) {
        avisar(`"${slug}": el color "${color.id}" no tiene fotos (nómbralas ${color.id}-01.jpg, ${color.id}-02.jpg…).`);
      }
    }

    productos.push({
      slug,
      nombre: datos.nombre,
      coleccion: datos.coleccion,
      precio: datos.precio,
      colores: datos.colores,
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
  let textos: Record<string, { alt: string }> = {};
  if (crudo !== undefined) {
    const resultado = GaleriaJsonSchema.safeParse(crudo);
    if (resultado.success) textos = resultado.data;
    else avisar('galeria/galeria.json tiene errores; se usan los nombres de archivo como texto alternativo.');
  }

  return Object.entries(imagenesGaleria)
    .map(([ruta, src]) => {
      const { archivo } = partesRuta(ruta);
      return { src, archivo, alt: textos[archivo]?.alt ?? textoDesdeArchivo(archivo) };
    })
    .sort((a, b) => ordenNatural(a.archivo, b.archivo));
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
