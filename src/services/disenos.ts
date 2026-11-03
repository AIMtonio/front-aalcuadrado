/**
 * Cliente del diseñador con IA de la API (`/api/disenos`).
 *
 * Los dos endpoints son públicos: los llama el navegador del visitante, sin
 * token. La llave de OpenAI vive solo en la API. Puro (solo `fetch`) para
 * poder usarlo en el navegador.
 */

export interface EstadoDisenos {
  /** `false` si la API no tiene llave de OpenAI o ya se acabó el cupo del día. */
  disponible: boolean;
  restantesHoy: number;
}

export interface Diseno {
  /** Data URL (`data:image/webp;base64,…`) listo para `<img src>`. */
  imagen: string;
  restantesHoy: number;
}

/** Error con un mensaje en español, listo para mostrarse al visitante. */
export class ErrorDiseno extends Error {
  constructor(
    message: string,
    readonly estado?: number,
  ) {
    super(message);
    this.name = 'ErrorDiseno';
  }
}

/** La API corta a los 90 s; se espera un poco más para recibir su mensaje de error. */
const TIEMPO_MAXIMO_MS = 100_000;

const MENSAJES: Record<number, string> = {
  422: 'No podemos diseñar esa idea. Prueba describiéndola de otra forma.',
  502: 'No pudimos crear tu diseño. Intenta de nuevo.',
  503: 'El diseñador no está disponible por ahora. Escríbenos por WhatsApp y lo diseñamos contigo.',
};
const MENSAJE_GENERICO = 'Algo salió mal al crear tu diseño. Intenta de nuevo.';

/** Saca el texto de `{ message }` de NestJS (texto o lista) sin prefijos como "texto: ". */
function mensajeDeApi(cuerpo: unknown): string | undefined {
  const message = (cuerpo as { message?: unknown } | null)?.message;
  const texto = Array.isArray(message) ? message.filter((m) => typeof m === 'string').join(' ') : message;
  if (typeof texto !== 'string' || !texto.trim()) return undefined;
  // El límite por IP de NestJS responde en inglés ("ThrottlerException: Too Many Requests").
  if (/^ThrottlerException/i.test(texto)) return 'Ya creaste varios diseños seguidos. Espera unos minutos y vuelve a intentarlo.';
  // El sitio no menciona a la IA: esos mensajes se cambian por uno genérico.
  if (/\bIA\b|\bAI\b|OpenAI/i.test(texto)) return undefined;
  const limpio = texto.replace(/^texto:\s*/i, '').trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export class ClienteDisenos {
  readonly #url: string;

  /** `baseUrl`: la URL pública de la API, sin `/api` (por ejemplo `https://api.tudominio.com`). */
  constructor(baseUrl: string) {
    this.#url = `${baseUrl.replace(/\/+$/, '')}/api/disenos`;
  }

  async estado(signal?: AbortSignal): Promise<EstadoDisenos> {
    const respuesta = await fetch(this.#url, { signal, headers: { Accept: 'application/json' } });
    if (!respuesta.ok) throw new ErrorDiseno(MENSAJE_GENERICO, respuesta.status);
    const cuerpo = (await respuesta.json()) as Partial<EstadoDisenos>;
    return {
      disponible: cuerpo.disponible === true,
      restantesHoy: typeof cuerpo.restantesHoy === 'number' ? cuerpo.restantesHoy : 0,
    };
  }

  async generar(texto: string, signal?: AbortSignal): Promise<Diseno> {
    const limite = AbortSignal.timeout(TIEMPO_MAXIMO_MS);
    let respuesta: Response;
    try {
      respuesta = await fetch(this.#url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ texto }),
        signal: signal ? AbortSignal.any([signal, limite]) : limite,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ErrorDiseno(
        limite.aborted
          ? 'Tu diseño tardó demasiado. Intenta de nuevo.'
          : 'No pudimos conectarnos con el diseñador. Revisa tu conexión e intenta de nuevo.',
      );
    }

    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      // Los mensajes propios van primero: los de la API mencionan a la IA y el sitio no la nombra.
      throw new ErrorDiseno(MENSAJES[respuesta.status] ?? mensajeDeApi(cuerpo) ?? MENSAJE_GENERICO, respuesta.status);
    }

    const { imagen, restantesHoy } = (cuerpo ?? {}) as Partial<Diseno>;
    if (typeof imagen !== 'string' || !imagen.startsWith('data:image/')) {
      throw new ErrorDiseno(MENSAJE_GENERICO, respuesta.status);
    }
    return { imagen, restantesHoy: typeof restantesHoy === 'number' ? restantesHoy : 0 };
  }
}
