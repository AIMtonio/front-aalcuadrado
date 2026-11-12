/**
 * Contacto de quien pide (kits y velas): un correo o un teléfono, con la misma
 * regla que `EsContacto` de la API. Puro para usarlo en el navegador y en Node.
 */

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Dígitos con algo de formato (espacios, +, (), -), de 7 a 20 caracteres. */
const REGEX_TELEFONO = /^\+?[\d\s()-]{7,20}$/;

export function esContacto(texto: string): boolean {
  const limpio = texto.trim();
  return REGEX_CORREO.test(limpio) || (REGEX_TELEFONO.test(limpio) && limpio.replace(/\D/g, '').length >= 7);
}

export const MENSAJE_CONTACTO = 'Escribe un correo (ana@correo.com) o un teléfono de al menos 7 dígitos.';

/** Junta espacios repetidos y recorta; lo que no es texto queda como "". */
export function limpiar(valor: unknown): string {
  return typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '';
}
