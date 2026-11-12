/**
 * Pedido de una vela personalizada que se manda a la API (`POST /api/velas/pedidos`).
 *
 * Mismas reglas que `src/velas/dto/crear-pedido-vela.dto.ts` del back: aquí se revisa
 * antes de mandarlo para mostrar los errores junto a cada campo. Puro (sin APIs del
 * navegador) para poder usarlo desde Node.
 */
import { MENSAJE_CONTACTO, esContacto, limpiar } from './contacto.ts';

/** Los tres tipos de vela, en el orden en que salen en el sitio (el mismo de la API). */
export const TIPOS_VELA = ['recipiente', 'molde', 'jicara'] as const;
export type TipoVela = (typeof TIPOS_VELA)[number];

export const NOMBRES_TIPO_VELA: Record<TipoVela, string> = {
  recipiente: 'En recipiente',
  molde: 'De molde',
  jicara: 'En jícara',
};

/** En jícara el marmoleado no se aprecia: nunca se ofrece, aunque el panel diga otra cosa. */
export function admiteMarmoleado(tipo: TipoVela): boolean {
  return tipo !== 'jicara';
}

/** Un tamaño (Pequeña, Mediana, Grande) o un molde (Cupcake) de un tipo de vela. */
export interface PresentacionVela {
  tipo: TipoVela;
  nombre: string;
  /** Gramos de cera; `null` mientras el dueño no los defina en el panel. */
  gramos: number | null;
  marmoleable: boolean;
}

/** Colores y aromas que se pueden elegir para una vela (los de los kits marcados "para la vela"). */
export interface OpcionesVela {
  /** Solo los tipos con al menos una presentación disponible, en el orden de `TIPOS_VELA`. */
  tipos: { tipo: TipoVela; presentaciones: PresentacionVela[] }[];
  colores: { nombre: string; hex: string }[];
  aromas: string[];
}

/** "Mediana · 180 g", o solo "Mediana" si los gramos están pendientes. */
export function nombreConGramos(p: Pick<PresentacionVela, 'nombre' | 'gramos'>): string {
  return p.gramos ? `${p.nombre} · ${p.gramos} g` : p.nombre;
}

/** Máximo de velas iguales en un pedido, igual que en la API; para más, que escriban. */
export const MAX_CANTIDAD_VELAS = 20;

export interface PedidoVela {
  clienteNombre: string;
  clienteContacto: string;
  tipo: TipoVela;
  presentacion: string;
  color: string;
  aroma: string;
  topping: string;
  marmoleado: boolean;
  /** Solo si es marmoleada: el color de la veta. */
  colorMarmoleado?: string;
  cantidad: number;
  notas?: string;
}

export type CampoVela =
  | 'tipo'
  | 'presentacion'
  | 'color'
  | 'aroma'
  | 'topping'
  | 'colorMarmoleado'
  | 'cantidad'
  | 'notas'
  | 'clienteNombre'
  | 'clienteContacto';

/** Largo máximo de cada texto, igual que en la API. */
export const MAXIMOS_VELA = {
  clienteNombre: 100,
  clienteContacto: 150,
  presentacion: 40,
  color: 60,
  aroma: 60,
  topping: 60,
  colorMarmoleado: 60,
  notas: 500,
} as const;

/** Mensaje cuando falta cada campo obligatorio; en el orden en que aparecen en el formulario. */
const FALTA = {
  tipo: 'Elige el tipo de vela.',
  presentacion: 'Elige el tamaño o el molde.',
  color: 'Elige el color de la vela.',
  aroma: 'Elige el aroma de la vela.',
  topping: 'Elige el topping (o "Sin topping").',
  clienteNombre: 'Dinos tu nombre.',
  clienteContacto: 'Déjanos un correo o un teléfono.',
} as const;

/** Todos los campos en el orden del formulario: el primero con error recibe el foco. */
export const CAMPOS_VELA: CampoVela[] = [
  'tipo',
  'presentacion',
  'color',
  'aroma',
  'topping',
  'colorMarmoleado',
  'cantidad',
  'notas',
  'clienteNombre',
  'clienteContacto',
];

export type RevisionPedidoVela =
  { valido: true; pedido: PedidoVela } | { valido: false; errores: Partial<Record<CampoVela, string>> };

/**
 * Revisa el pedido antes de mandarlo. `datos` son los del formulario (`marmoleado`
 * llega como "on" si se marcó). `marmoleable` dice si la presentación elegida admite
 * marmoleado; si no, la casilla se ignora.
 */
export function revisarPedidoVela(
  datos: Partial<Record<CampoVela | 'marmoleado', unknown>>,
  { marmoleable }: { marmoleable: boolean },
): RevisionPedidoVela {
  const errores: Partial<Record<CampoVela, string>> = {};
  const texto = (campo: keyof typeof FALTA) => {
    const valor = limpiar(datos[campo]);
    if (!valor) errores[campo] = FALTA[campo];
    else if (campo in MAXIMOS_VELA && valor.length > MAXIMOS_VELA[campo as keyof typeof MAXIMOS_VELA]) {
      errores[campo] = `Usa como máximo ${MAXIMOS_VELA[campo as keyof typeof MAXIMOS_VELA]} caracteres.`;
    }
    return valor;
  };

  const tipo = limpiar(datos.tipo) as TipoVela;
  if (!TIPOS_VELA.includes(tipo)) errores.tipo = FALTA.tipo;

  const pedido: PedidoVela = {
    tipo,
    presentacion: texto('presentacion'),
    color: texto('color'),
    aroma: texto('aroma'),
    topping: texto('topping'),
    marmoleado: Boolean(datos.marmoleado) && marmoleable && admiteMarmoleado(tipo),
    cantidad: 1,
    clienteNombre: texto('clienteNombre'),
    clienteContacto: texto('clienteContacto'),
  };

  if (pedido.marmoleado) {
    const veta = limpiar(datos.colorMarmoleado);
    if (!veta) errores.colorMarmoleado = 'Elige el segundo color para el marmoleado.';
    else if (veta === pedido.color) errores.colorMarmoleado = 'Para el marmoleado elige un color distinto al de la vela.';
    pedido.colorMarmoleado = veta;
  }

  const cantidad = limpiar(datos.cantidad);
  if (cantidad) {
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1) errores.cantidad = 'Pon un número entero, desde 1.';
    else if (numero > MAX_CANTIDAD_VELAS) errores.cantidad = `Hasta ${MAX_CANTIDAD_VELAS} por pedido; para más, escríbenos.`;
    else pedido.cantidad = numero;
  }

  const notas = limpiar(datos.notas);
  if (notas.length > MAXIMOS_VELA.notas) errores.notas = `Usa como máximo ${MAXIMOS_VELA.notas} caracteres.`;
  if (notas) pedido.notas = notas;

  if (!errores.clienteContacto && !esContacto(pedido.clienteContacto)) errores.clienteContacto = MENSAJE_CONTACTO;

  return Object.keys(errores).length > 0 ? { valido: false, errores } : { valido: true, pedido };
}
