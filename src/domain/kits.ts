/**
 * Pedido de un kit navideño (jabón + vela) que se manda a la API (`POST /api/pedidos`).
 *
 * Mismas reglas que `src/pedidos/dto/crear-pedido.dto.ts` del back: aquí se revisa
 * antes de mandarlo para mostrar los errores junto a cada campo. Puro (sin APIs del
 * navegador) para poder usarlo desde Node.
 */
import { MENSAJE_CONTACTO, esContacto, limpiar } from './contacto.ts';

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

const FIGURAS_TOPPING = [
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

/** Lo que acepta la API en `POST /api/pedidos`: solo texto, sin campos de más. */
export interface PedidoKitApi {
  clienteNombre: string;
  clienteContacto: string;
  jabonColor: string;
  jabonAroma: string;
  jabonForma: string;
  velaColor: string;
  velaAroma: string;
  velaTopping: string;
}

export interface PedidoKit extends PedidoKitApi {
  velaMarmoleado: boolean;
  /** Solo si la vela es marmoleada: el color de las vetas. */
  velaColorMarmoleado?: string;
}

type CampoTexto = keyof PedidoKitApi;
export type CampoKit = CampoTexto | 'velaColorMarmoleado';

/** Largo máximo de cada campo, igual que en la API. */
export const MAXIMOS: Record<CampoTexto, number> = {
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
const FALTA: Record<CampoTexto, string> = {
  jabonColor: 'Elige el color del jabón.',
  jabonAroma: 'Elige el aroma del jabón.',
  jabonForma: 'Elige la forma del jabón.',
  velaColor: 'Elige el color de la vela.',
  velaAroma: 'Elige el aroma de la vela.',
  velaTopping: 'Elige el topping de la vela.',
  clienteNombre: 'Dinos tu nombre.',
  clienteContacto: 'Déjanos un correo o un teléfono.',
};

const CAMPOS_TEXTO = Object.keys(FALTA) as CampoTexto[];

/** Todos los campos en el orden del formulario: el primero con error recibe el foco. */
export const CAMPOS_KIT: CampoKit[] = [...CAMPOS_TEXTO.slice(0, 6), 'velaColorMarmoleado', ...CAMPOS_TEXTO.slice(6)];

export type RevisionPedido =
  { valido: true; pedido: PedidoKit } | { valido: false; errores: Partial<Record<CampoKit, string>> };

/**
 * Revisa el pedido antes de mandarlo. Los textos se recortan y los espacios repetidos se
 * juntan. `velaMarmoleado` llega como "on" si se marcó la casilla.
 */
export function revisarPedido(datos: Partial<Record<CampoKit | 'velaMarmoleado', unknown>>): RevisionPedido {
  const pedido = { velaMarmoleado: Boolean(datos.velaMarmoleado) } as PedidoKit;
  const errores: Partial<Record<CampoKit, string>> = {};

  for (const campo of CAMPOS_TEXTO) {
    const valor = limpiar(datos[campo]);
    pedido[campo] = valor;
    if (!valor) errores[campo] = FALTA[campo];
    else if (valor.length > MAXIMOS[campo]) errores[campo] = `Usa como máximo ${MAXIMOS[campo]} caracteres.`;
  }
  if (!errores.clienteContacto && !esContacto(pedido.clienteContacto)) {
    errores.clienteContacto = MENSAJE_CONTACTO;
  }

  if (pedido.velaMarmoleado) {
    const veta = limpiar(datos.velaColorMarmoleado);
    if (!veta) errores.velaColorMarmoleado = 'Elige el segundo color para el marmoleado.';
    else if (veta === pedido.velaColor) errores.velaColorMarmoleado = 'Para el marmoleado elige un color distinto al de la vela.';
    else if (colorDeVelaParaApi(pedido.velaColor, veta).length > MAXIMOS.velaColor) {
      errores.velaColorMarmoleado = 'Estos colores no caben en el pedido; escríbenos por WhatsApp.';
    }
    pedido.velaColorMarmoleado = veta;
  }

  return Object.keys(errores).length > 0 ? { valido: false, errores } : { valido: true, pedido };
}

/** "Rojo navidad, marmoleada con Blanco": así llega el marmoleado al panel. */
function colorDeVelaParaApi(color: string, veta?: string): string {
  return veta ? `${color}, marmoleada con ${veta}` : color;
}

/**
 * El cuerpo de `POST /api/pedidos`. La API todavía no tiene un campo para el marmoleado
 * (y rechaza los que no conoce), así que va escrito en el color de la vela.
 */
export function pedidoKitParaApi({ velaMarmoleado, velaColorMarmoleado, ...pedido }: PedidoKit): PedidoKitApi {
  return { ...pedido, velaColor: colorDeVelaParaApi(pedido.velaColor, velaMarmoleado ? velaColorMarmoleado : undefined) };
}
