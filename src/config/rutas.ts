/**
 * Páginas del sitio. Puro (sin APIs de Astro) para usarlo también en el navegador.
 * `import.meta.env.BASE_URL` es `/` salvo que el sitio se publique en una subcarpeta.
 */
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export const rutas = {
  inicio: base,
  aretes: `${base}aretes/`,
  kits: `${base}kits-navidenos/`,
} as const;

/** Línea de producto de cada página: decide la pestaña activa y los enlaces del encabezado. */
export type Linea = keyof typeof rutas;
