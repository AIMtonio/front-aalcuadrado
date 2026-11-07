/**
 * Cliente de pedidos de kits de la API (`POST /api/pedidos`).
 *
 * Es pública: la llama el navegador del visitante, sin token. La API solo guarda
 * el pedido; el dueño lo cotiza desde la pestaña Pedidos del panel. Puro (solo
 * `fetch`) para poder usarlo en el navegador.
 */
import type { PedidoKit } from '@/domain/kits';
import { esLimiteDeApi, mensajesDeError, textoDeError, urlDeApi } from './api';

export interface PedidoRecibido {
  /** Folio del pedido en la API. */
  id: number;
}

/** Error con un mensaje en español, listo para mostrarse al visitante. */
export class ErrorPedido extends Error {
  constructor(
    message: string,
    readonly estado?: number,
  ) {
    super(message);
    this.name = 'ErrorPedido';
  }
}

const TIEMPO_MAXIMO_MS = 20_000;
const MENSAJE_LIMITE = 'Ya mandaste varios pedidos seguidos. Espera un minuto y vuelve a intentarlo.';
const MENSAJE_GENERICO = 'No pudimos guardar tu pedido. Intenta de nuevo o mándanoslo por WhatsApp.';

export class ClienteKits {
  readonly #url: string;

  /** `baseUrl`: la URL pública de la API, sin `/api` (por ejemplo `https://api.tudominio.com`). */
  constructor(baseUrl: string) {
    this.#url = urlDeApi(baseUrl, 'pedidos');
  }

  async enviar(pedido: PedidoKit): Promise<PedidoRecibido> {
    const limite = AbortSignal.timeout(TIEMPO_MAXIMO_MS);
    let respuesta: Response;
    try {
      respuesta = await fetch(this.#url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(pedido),
        signal: limite,
      });
    } catch {
      throw new ErrorPedido(
        limite.aborted
          ? 'Tu pedido tardó demasiado en enviarse. Intenta de nuevo o mándanoslo por WhatsApp.'
          : 'No pudimos conectarnos. Revisa tu conexión o mándanos tu pedido por WhatsApp.',
      );
    }

    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      const texto = textoDeError(cuerpo);
      if (respuesta.status === 429 || (texto && esLimiteDeApi(texto))) throw new ErrorPedido(MENSAJE_LIMITE, 429);
      // Los 400 traen los mensajes en español del DTO ("Dinos tu nombre", …) mezclados con
      // los de class-validator en inglés ("… must be a string"); solo se muestran los primeros.
      const enEspanol = mensajesDeError(cuerpo).filter((m) => !/\b(must|should)\b/.test(m));
      const mensaje = respuesta.status === 400 && enEspanol.length ? `${[...new Set(enEspanol)].join('. ')}.` : MENSAJE_GENERICO;
      throw new ErrorPedido(mensaje, respuesta.status);
    }

    const id = (cuerpo as { id?: unknown } | null)?.id;
    if (typeof id !== 'number') throw new ErrorPedido(MENSAJE_GENERICO, respuesta.status);
    return { id };
  }
}
