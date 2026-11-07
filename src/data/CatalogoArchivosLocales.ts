import type { ImageMetadata } from 'astro';
import { sitio } from '@/config/sitio';
import {
  COLECCIONES,
  CatalogoApiJsonSchema,
  GaleriaJsonSchema,
  NOMBRES_COLECCION,
  ProductoJsonSchema,
  ETIQUETAS,
  fotosDelProducto,
  idDeColor,
  normalizarRuta,
  ordenNatural,
  textoDesdeArchivo,
  type CatalogoApi,
  type Categoria,
  type CategoriaProducto,
  type Coleccion,
  type Color,
  type ColeccionId,
  type FotoGaleria,
  type FotoProducto,
  type FotoJson,
  type Producto,
} from '@/domain/catalogo';
import type { OpcionesKit } from '@/domain/kits';
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

// Lo descarga `npm run api:sincronizar`. Si no existe, el glob regresa {} y no hay error.
const jsonCatalogoApi = import.meta.glob<unknown>('/src/content/catalogo-api.json', {
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

/** Productos y fotos de la API, si se corrió `npm run api:sincronizar`; `null` si no. */
function leerCatalogoApi(): CatalogoApi | null {
  const crudo = Object.values(jsonCatalogoApi)[0];
  if (crudo === undefined) return null;
  const resultado = CatalogoApiJsonSchema.safeParse(crudo);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    avisar(`catalogo-api.json tiene errores (${detalle}); se usan solo los productos del repositorio.`);
    return null;
  }
  return resultado.data;
}

const catalogoApi = leerCatalogoApi();
const fotosApi = catalogoApi?.fotos ?? [];

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

/** Lo que hace falta para armar un producto, venga de la API o de un JSON del repositorio. */
interface FuenteProducto {
  slug: string;
  nombre: string;
  coleccion: ColeccionId;
  descripcion: string;
  etiqueta?: (typeof ETIQUETAS)[number];
  disponible: boolean;
  destacado: boolean;
  orden?: number;
  categoria?: CategoriaProducto;
  colores: Color[];
  /** Fotos del JSON del repositorio: se usan si la API no tiene fotos de este producto. */
  fotosRepositorio: FotoJson[];
}

/** Los productos de `src/content/productos/*.json` que son válidos, por slug. */
function productosDelRepositorio(): Map<string, FuenteProducto> {
  const fuentes = new Map<string, FuenteProducto>();
  for (const [ruta, crudo] of Object.entries(jsonProductos)) {
    const slug = slugDeRuta(ruta);
    const resultado = ProductoJsonSchema.safeParse(crudo);
    if (!resultado.success) {
      const detalle = resultado.error.issues.map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`).join('; ');
      avisar(`"productos/${slug}.json" tiene errores (${detalle}); no aparece en el catálogo.`);
      continue;
    }
    const datos = resultado.data;
    fuentes.set(slug, {
      slug,
      nombre: datos.nombre,
      coleccion: datos.coleccion,
      descripcion: datos.descripcion,
      etiqueta: datos.etiqueta,
      disponible: datos.disponible,
      destacado: datos.destacado,
      orden: datos.orden,
      colores: datos.colores.map((c) => ({ id: idDeColor(c), nombre: c.nombre, hex: c.hex })),
      fotosRepositorio: fotosDelProducto(datos),
    });
  }
  return fuentes;
}

/**
 * Con la API, los productos son los de la API; un JSON del repositorio con el mismo
 * slug solo presta sus fotos mientras la API no tenga fotos de ese producto.
 * Sin la API, los productos son los JSON del repositorio.
 */
function fuentesDeProductos(): FuenteProducto[] {
  const repositorio = productosDelRepositorio();
  if (!catalogoApi) return [...repositorio.values()];
  return catalogoApi.productos.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    coleccion: p.coleccion,
    descripcion: p.descripcion,
    etiqueta: p.etiqueta ?? undefined,
    disponible: p.disponible,
    destacado: p.destacado,
    orden: p.orden ?? undefined,
    categoria: p.categoria ?? undefined,
    colores: p.colores,
    fotosRepositorio: repositorio.get(p.slug)?.fotosRepositorio ?? [],
  }));
}

function construirProductos(): Producto<Imagen>[] {
  const productos: Producto<Imagen>[] = [];
  const fuentes = fuentesDeProductos();

  // Fotos de la API que no se pueden ligar a ningún producto: no aparecen en el sitio.
  const slugs = new Set(fuentes.map((f) => f.slug));
  for (const f of fotosApi) {
    if (f.categoria !== 'productos') continue;
    const archivo = archivoDeRuta(f.imagen);
    if (!f.producto) {
      avisar(`La foto "${archivo}" de la API no tiene producto: asígnale uno para que aparezca.`);
    } else if (!slugs.has(f.producto)) {
      avisar(`La foto "${archivo}" de la API es del producto "${f.producto}", que no existe en el catálogo.`);
    }
  }

  for (const datos of fuentes) {
    const { slug, colores } = datos;

    // Si la API tiene fotos de este producto, reemplazan a las del repositorio.
    const deLaApi = fotosApi.filter((f) => f.categoria === 'productos' && f.producto === slug);
    const origen =
      deLaApi.length > 0
        ? deLaApi.map((f) => ({ ruta: f.imagen, colorId: f.color ?? undefined, alt: f.alt ?? undefined }))
        : datos.fotosRepositorio.map((f) => ({ ...f, alt: undefined }));

    const fotos: FotoProducto<Imagen>[] = [];
    for (const { ruta: rutaFoto, colorId: colorPedido, alt } of origen) {
      const src = buscarImagen(rutaFoto, `"${slug}"`);
      if (!src) continue;
      const color = colores.find((c) => c.id === colorPedido);
      if (colorPedido && !color) {
        avisar(`"${slug}": una foto es del color "${colorPedido}", que el producto no tiene; se muestra sin color.`);
      }
      fotos.push({
        src,
        archivo: archivoDeRuta(rutaFoto),
        colorId: color?.id,
        esPortada: fotos.length === 0,
        alt: alt ?? [`Aretes ${datos.nombre}`, color && `en color ${color.nombre.toLowerCase()}`].filter(Boolean).join(', '),
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
      categoria: datos.categoria,
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

/** Las fotos de la API de una categoría sin producto (galería o kits), en el orden del panel. */
function fotosSueltasDeApi(categoria: 'galeria' | 'kits', contexto: string): FotoGaleria<Imagen>[] {
  const fotos: FotoGaleria<Imagen>[] = [];
  for (const { imagen, alt } of fotosApi.filter((f) => f.categoria === categoria)) {
    const src = buscarImagen(imagen, contexto);
    if (!src) continue;
    const archivo = archivoDeRuta(imagen);
    // La API agrega al nombre un sufijo aleatorio (`aretes-puestos-1a2b3c4d.jpg`); no va en el texto.
    fotos.push({
      src,
      archivo,
      alt: alt ?? textoDesdeArchivo(archivo.replace(/-[0-9a-f]{8}(?=\.[^.]+$)/, '')),
    });
  }
  return fotos;
}

function construirGaleria(): FotoGaleria<Imagen>[] {
  // Si la API tiene fotos de galería, reemplazan a las de galeria.json.
  const deLaApi = fotosSueltasDeApi('galeria', 'Galería');
  if (deLaApi.length > 0) return deLaApi;
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

/**
 * Colores y aromas de los kits. Cada lista (colores del jabón, aromas de la vela…)
 * sale del panel si tiene al menos una opción disponible; si no, de `sitio.kits`,
 * para que el formulario nunca quede sin opciones.
 */
function construirOpcionesKit(): OpcionesKit {
  const kits = catalogoApi?.kits;
  const elegir = <T>(deLaApi: T[], fijas: readonly T[], descripcion: string): T[] => {
    if (deLaApi.length > 0) return deLaApi;
    if (kits) avisar(`El panel no tiene ${descripcion} disponibles; se usan los de src/config/sitio.ts.`);
    return [...fijas];
  };
  const pieza = (clave: 'jabon' | 'vela', nombre: string) => {
    const en = clave === 'jabon' ? 'enJabon' : 'enVela';
    return {
      colores: elegir(
        (kits?.colores ?? []).filter((c) => c[en]).map(({ nombre, hex }) => ({ nombre, hex })),
        sitio.kits[clave].colores,
        `colores para ${nombre}`,
      ),
      aromas: elegir(
        (kits?.aromas ?? []).filter((a) => a[en]).map((a) => a.nombre),
        sitio.kits[clave].aromas,
        `aromas para ${nombre}`,
      ),
    };
  };
  return { jabon: pieza('jabon', 'el jabón'), vela: pieza('vela', 'la vela') };
}

export class CatalogoArchivosLocales implements CatalogoRepository<Imagen> {
  #productos?: Producto<Imagen>[];
  #galeria?: FotoGaleria<Imagen>[];
  #fotosKits?: FotoGaleria<Imagen>[];
  #opcionesKit?: OpcionesKit;

  async listarProductos() {
    this.#productos ??= construirProductos();
    return this.#productos;
  }

  async listarColecciones(): Promise<Coleccion[]> {
    const productos = await this.listarProductos();
    return COLECCIONES.map((id) => ({
      id,
      nombre: NOMBRES_COLECCION[id],
      totalProductos: productos.filter((p) => p.coleccion === id).length,
    })).filter((c) => c.totalProductos > 0);
  }

  async listarCategorias(): Promise<Categoria[]> {
    const productos = await this.listarProductos();
    // Las del panel en su orden; si un producto trae una que no está en la lista, va al final.
    const porSlug = new Map<string, CategoriaProducto>();
    for (const c of catalogoApi?.categorias ?? []) porSlug.set(c.slug, c);
    for (const p of productos)
      if (p.categoria && !porSlug.has(p.categoria.slug)) porSlug.set(p.categoria.slug, p.categoria);
    return [...porSlug.values()]
      .map((c) => ({
        ...c,
        totalProductos: productos.filter((p) => p.categoria?.slug === c.slug).length,
      }))
      .filter((c) => c.totalProductos > 0);
  }

  async listarFotosGaleria() {
    this.#galeria ??= construirGaleria();
    return this.#galeria;
  }

  async listarFotosKits() {
    this.#fotosKits ??= fotosSueltasDeApi('kits', 'Kits');
    return this.#fotosKits;
  }

  async opcionesKit() {
    this.#opcionesKit ??= construirOpcionesKit();
    return this.#opcionesKit;
  }
}
