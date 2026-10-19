import { CatalogoArchivosLocales } from './CatalogoArchivosLocales';
import type { CatalogoRepository } from './CatalogoRepository';
import type { ImageMetadata } from 'astro';

/**
 * Único punto donde se decide de dónde salen los datos.
 * Para usar un backend: crea `CatalogoApi` que implemente
 * `CatalogoRepository` y cámbialo aquí.
 */
export const catalogo: CatalogoRepository<ImageMetadata> = new CatalogoArchivosLocales();

export type { CatalogoRepository };
