import type { Categoria, Coleccion, FotoGaleria, Producto } from '@/domain/catalogo';
import type { OpcionesKit } from '@/domain/kits';
import type { OpcionesVela, TipoVela } from '@/domain/velas';

/**
 * Puerta de entrada a los datos del catálogo.
 *
 * Las páginas y los componentes solo hablan con esta interfaz.
 * Hoy la implementa `CatalogoArchivosLocales` (lee carpetas del repositorio);
 * más adelante, `CatalogoApi` podrá leer del backend sin tocar la interfaz.
 */
export interface CatalogoRepository<TImagen = unknown> {
  /** Productos listos para mostrarse, ya ordenados. */
  listarProductos(): Promise<Producto<TImagen>[]>;
  /** Solo colecciones con al menos un producto, en el orden de los filtros. */
  listarColecciones(): Promise<Coleccion[]>;
  /** Solo categorías con al menos un producto, en el orden del panel. */
  listarCategorias(): Promise<Categoria[]>;
  listarFotosGaleria(): Promise<FotoGaleria<TImagen>[]>;
  /** Fotos de kits ya hechos (página de kits), en el orden del panel. */
  listarFotosKits(): Promise<FotoGaleria<TImagen>[]>;
  /** Colores y aromas disponibles para el jabón y la vela. */
  opcionesKit(): Promise<OpcionesKit>;
  /** Fotos de cómo se ve cada tipo de vela individual, en el orden del panel. */
  listarFotosVelas(): Promise<Record<TipoVela, FotoGaleria<TImagen>[]>>;
  /** Tipos con sus tamaños o moldes disponibles, y los colores y aromas para velas. */
  opcionesVela(): Promise<OpcionesVela>;
}
