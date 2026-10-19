/**
 * Estado compartido del color elegido por producto.
 * La tarjeta y el visor lo escuchan para mantenerse sincronizados.
 */
export interface CambioColor {
  slug: string;
  colorId: string | null;
}

const EVENTO = 'aa:color';
const elegidos = new Map<string, string | null>();

export function colorElegido(slug: string): string | null {
  return elegidos.get(slug) ?? null;
}

export function elegirColor(slug: string, colorId: string | null) {
  if (elegidos.get(slug) === colorId) return;
  elegidos.set(slug, colorId);
  document.dispatchEvent(new CustomEvent<CambioColor>(EVENTO, { detail: { slug, colorId } }));
}

export function alCambiarColor(fn: (cambio: CambioColor) => void) {
  document.addEventListener(EVENTO, (e) => fn((e as CustomEvent<CambioColor>).detail));
}

/** Índices de las fotos con las del color elegido primero (orden estable). */
export function ordenPorColor(colores: (string | undefined)[], colorId: string | null): number[] {
  const indices = colores.map((_, i) => i);
  if (!colorId) return indices;
  return [...indices.filter((i) => colores[i] === colorId), ...indices.filter((i) => colores[i] !== colorId)];
}
