/**
 * Reglas de la idea que se manda al diseñador con IA (`POST /api/disenos`).
 *
 * La API valida el largo y arma el prompt; aquí se revisa antes de mandarla,
 * para no gastar una imagen en una idea que no se va a aceptar. Puro (sin APIs
 * del navegador) para poder probarlo desde Node.
 */
import { FRASES, PALABRAS, RAICES } from './palabras-prohibidas.ts';

/** Mismos límites que la API (`src/disenos/prompt.ts` del back). */
const IDEA_MIN = 3;
export const IDEA_MAX = 500;

export type RevisionIdea = { valida: true; texto: string } | { valida: false; motivo: string };

/** Números y signos que se usan en lugar de letras ("p3n3", "$exo"). */
const EN_LUGAR_DE_LETRAS: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i', '|': 'i',
};

/** Minúsculas y sin acentos, pero conserva la ñ ("coño" no es "cono"). */
function sinAcentos(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, '')
    .normalize('NFC');
}

/** "peeeene" → "pene". */
const sinRepetidas = (palabra: string) => palabra.replace(/(.)\1+/g, '$1');

/**
 * Palabras de la idea, ya normalizadas. Las letras sueltas seguidas se juntan
 * ("p e n e", "p.e.n.e" → "pene").
 */
function palabrasDe(texto: string): string[] {
  const tokens = sinAcentos(texto)
    .replace(/[013457@$!|]/g, (c) => EN_LUGAR_DE_LETRAS[c] ?? c)
    .split(/[^a-zñ]+/)
    .filter(Boolean);

  const palabras: string[] = [];
  let sueltas = '';
  for (const token of tokens) {
    if (token.length === 1) {
      sueltas += token;
      continue;
    }
    if (sueltas.length > 1) palabras.push(sueltas);
    sueltas = '';
    palabras.push(token);
  }
  if (sueltas.length > 1) palabras.push(sueltas);
  return palabras;
}

const palabrasExactas = new Set(PALABRAS);
// Sin letras repetidas también, para atrapar "peeene"; salvo las que quedarían de una letra ("xxx").
const palabrasSinRepetidas = new Set(PALABRAS.map(sinRepetidas).filter((p) => p.length > 2));
const raicesSinRepetidas = RAICES.map(sinRepetidas);

function esProhibida(palabra: string): boolean {
  if (palabrasExactas.has(palabra)) return true;
  const corta = sinRepetidas(palabra);
  return palabrasSinRepetidas.has(corta) || raicesSinRepetidas.some((r) => corta.startsWith(r));
}

/** Revisa la idea antes de mandarla a la API. */
export function revisarIdea(texto: string): RevisionIdea {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length < IDEA_MIN) {
    return { valida: false, motivo: `Describe tu idea con al menos ${IDEA_MIN} letras.` };
  }
  if (limpio.length > IDEA_MAX) {
    return { valida: false, motivo: `Usa como máximo ${IDEA_MAX} caracteres.` };
  }

  const palabras = palabrasDe(limpio);
  const frase = ` ${palabras.join(' ')} `;
  if (palabras.some(esProhibida) || FRASES.some((f) => frase.includes(` ${f} `))) {
    return {
      valida: false,
      motivo: 'Tu idea tiene palabras que no podemos usar. Descríbela de otra forma, pensando en unos aretes.',
    };
  }
  return { valida: true, texto: limpio };
}
