/**
 * Ayudantes compartidos por los clientes de la API (`disenos.ts`, `kits.ts`).
 * Puro (solo `fetch`) para poder usarlo en el navegador.
 */

/** `https://api.tudominio.com/` + `pedidos` → `https://api.tudominio.com/api/pedidos`. */
export function urlDeApi(baseUrl: string, recurso: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/api/${recurso}`;
}

/** Los textos de `{ message }` de NestJS (uno o una lista). */
export function mensajesDeError(cuerpo: unknown): string[] {
  const message = (cuerpo as { message?: unknown } | null)?.message;
  const lista: unknown[] = Array.isArray(message) ? message : [message];
  return lista.filter((m): m is string => typeof m === 'string' && m.trim() !== '').map((m) => m.trim());
}

/** Los mensajes de NestJS juntos en un texto, o `undefined` si no trae. */
export function textoDeError(cuerpo: unknown): string | undefined {
  return mensajesDeError(cuerpo).join(' ') || undefined;
}

/** El límite por IP de NestJS responde en inglés ("ThrottlerException: Too Many Requests"). */
export function esLimiteDeApi(texto: string): boolean {
  return /^ThrottlerException/i.test(texto);
}
