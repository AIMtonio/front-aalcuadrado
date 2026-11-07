/**
 * Pedido de un kit navideño (jabón + vela) que se manda a la API (`POST /api/pedidos`).
 *
 * Mismas reglas que `src/pedidos/dto/crear-pedido.dto.ts` del back: aquí se revisa
 * antes de mandarlo para mostrar los errores junto a cada campo. Puro (sin APIs del
 * navegador) para poder usarlo desde Node.
 */

/** Dibujos de la vista previa. Las opciones de `sitio.kits` eligen uno. */
export const FIGURAS_JABON = [
  'copo',
  'arbol',
  'santa',
  'jengibre',
  'regalo',
  'estrella',
  'cuadrado',
  'ovalo',
  'ovalo-cavidad',
] as const;
export type FiguraJabon = (typeof FIGURAS_JABON)[number];

export const FIGURAS_TOPPING = [
  'naranja',
  'canela',
  'anis',
  'flores',
  'rosas',
  'manzanilla',
  'cafe',
  'piedras',
  'ninguno',
] as const;
export type FiguraTopping = (typeof FIGURAS_TOPPING)[number];

/** Colores y aromas que se pueden elegir para cada pieza del kit. */
export interface OpcionesKit {
  jabon: { colores: { nombre: string; hex: string }[]; aromas: string[] };
  vela: { colores: { nombre: string; hex: string }[]; aromas: string[] };
}

export interface PedidoKit {
  clienteNombre: string;
  clienteContacto: string;
  jabonColor: string;
  jabonAroma: string;
  jabonForma: string;
  velaColor: string;
  velaAroma: string;
  velaTopping: string;
}

export type CampoKit = keyof PedidoKit;

/** Largo máximo de cada campo, igual que en la API. */
export const MAXIMOS: Record<CampoKit, number> = {
  clienteNombre: 100,
  clienteContacto: 150,
  jabonColor: 60,
  jabonAroma: 60,
  jabonForma: 60,
  velaColor: 60,
  velaAroma: 60,
  velaTopping: 60,
};

/** Mensaje cuando falta cada campo; en el orden en que aparecen en el formulario. */
const FALTA: Record<CampoKit, string> = {
  jabonColor: 'Elige el color del jabón.',
  jabonAroma: 'Elige el aroma del jabón.',
  jabonForma: 'Elige la forma del jabón.',
  velaColor: 'Elige el color de la vela.',
  velaAroma: 'Elige el aroma de la vela.',
  velaTopping: 'Elige el topping de la vela.',
  clienteNombre: 'Dinos tu nombre.',
  clienteContacto: 'Déjanos un correo o un teléfono.',
};

export const CAMPOS_KIT = Object.keys(FALTA) as CampoKit[];

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Dígitos con algo de formato (espacios, +, (), -), de 7 a 20 caracteres. */
const REGEX_TELEFONO = /^\+?[\d\s()-]{7,20}$/;

/** Un correo o un teléfono, con la misma regla que la API. */
function esContacto(texto: string): boolean {
  const limpio = texto.trim();
  return REGEX_CORREO.test(limpio) || (REGEX_TELEFONO.test(limpio) && limpio.replace(/\D/g, '').length >= 7);
}

export type RevisionPedido =
  { valido: true; pedido: PedidoKit } | { valido: false; errores: Partial<Record<CampoKit, string>> };

/** Revisa el pedido antes de mandarlo. Los textos se recortan y los espacios repetidos se juntan. */
export function revisarPedido(datos: Partial<Record<CampoKit, unknown>>): RevisionPedido {
  const pedido = {} as PedidoKit;
  const errores: Partial<Record<CampoKit, string>> = {};

  for (const campo of CAMPOS_KIT) {
    const valor = typeof datos[campo] === 'string' ? datos[campo].replace(/\s+/g, ' ').trim() : '';
    pedido[campo] = valor;
    if (!valor) errores[campo] = FALTA[campo];
    else if (valor.length > MAXIMOS[campo]) errores[campo] = `Usa como máximo ${MAXIMOS[campo]} caracteres.`;
  }
  if (!errores.clienteContacto && !esContacto(pedido.clienteContacto)) {
    errores.clienteContacto = 'Escribe un correo (ana@correo.com) o un teléfono de al menos 7 dígitos.';
  }

  return Object.keys(errores).length > 0 ? { valido: false, errores } : { valido: true, pedido };
}
