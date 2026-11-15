/**
 * Cuentas de la calculadora de insumos (página privada `/calculadora/`): cuánta cera y
 * cuánta esencia lleva una vela según los gramos de agua que le caben al molde.
 * Puro (sin APIs del navegador) para poder usarlo desde Node.
 */

/** La cera pesa menos que el agua: al molde le cabe el 90 % de su peso en agua. */
export const FACTOR_CERA = 0.9;

/** Porcentaje de esencia sobre la cera bruta. */
export const PORCENTAJE_ESENCIA = 9;

export interface Insumos {
  /** Cera que llena el molde, esencia incluida. */
  ceraBruta: number;
  esencia: number;
  /** Cera que hay que pesar: la bruta menos la esencia. */
  ceraNeta: number;
}

export function calcularInsumos(gramosAgua: number): Insumos {
  const ceraBruta = gramosAgua * FACTOR_CERA;
  const esencia = (ceraBruta * PORCENTAJE_ESENCIA) / 100;
  return { ceraBruta, esencia, ceraNeta: ceraBruta - esencia };
}
