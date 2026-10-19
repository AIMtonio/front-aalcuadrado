/**
 * Colecciones del catálogo. Archivo sin dependencias para poder
 * usarlo también en el navegador sin cargar Zod.
 */
export const COLECCIONES = ['dia-de-muertos', 'mexicanos', 'patrios', 'navidad', 'otros'] as const;

export type ColeccionId = (typeof COLECCIONES)[number];

/** Nombres visibles de cada colección, en el orden en que aparecen los filtros. */
export const NOMBRES_COLECCION: Record<ColeccionId, string> = {
  'dia-de-muertos': 'Día de Muertos',
  mexicanos: 'Mexicanos',
  patrios: 'Patrios',
  navidad: 'Navidad',
  otros: 'Otros',
};
