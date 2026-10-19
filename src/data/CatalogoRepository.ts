import type { Coleccion, FotoGaleria, Producto } from '@/domain/catalogo';

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
  obtenerProducto(slug: string): Promise<Producto<TImagen> | undefined>;
  /** Solo colecciones con al menos un producto, en el orden de los filtros. */
  listarColecciones(): Promise<Coleccion[]>;
  listarFotosGaleria(): Promise<FotoGaleria<TImagen>[]>;
}
