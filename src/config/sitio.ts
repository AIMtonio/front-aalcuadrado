/**
 * Configuración general de aalcuadrado.
 *
 * Todo lo que cambia seguido (número de WhatsApp, redes, precios,
 * promoción de temporada, opciones de los kits y las velas, preguntas frecuentes) vive aquí.
 * Los valores entre [CORCHETES] están pendientes de confirmar.
 */
import type { FiguraJabon, FiguraTopping } from '@/domain/kits';
import type { PresentacionVela, TipoVela } from '@/domain/velas';

/** Datos de la vela de los kits; se repiten en varios textos del sitio. */
const vela = {
  gramos: 100,
  /** Horas aproximadas que dura encendida. */
  duracionHoras: '20 a 25',
};
/** Cuánto tarda un kit desde que se confirma el pedido. */
const ENTREGA_KITS = 'una semana';
/** Cuánto tarda una vela personalizada desde que se confirma el pedido. */
const ENTREGA_VELAS = 'una semana'; // [CONFIRMAR]

/**
 * Toppings de las velas (de los kits y las individuales). Cada `figura` tiene su
 * dibujo en las vistas previas (src/components/velas/Toppings.astro). La API guarda el texto tal cual.
 */
const TOPPINGS = [
  { nombre: 'Naranja deshidratada', figura: 'naranja' },
  { nombre: 'Canela en raja', figura: 'canela' },
  { nombre: 'Anís estrella', figura: 'anis' },
  { nombre: 'Flores secas', figura: 'flores' },
  { nombre: 'Rosas secas', figura: 'rosas' },
  { nombre: 'Manzanilla', figura: 'manzanilla' },
  { nombre: 'Granos de café', figura: 'cafe' },
  { nombre: 'Piedras de río', figura: 'piedras' },
  { nombre: 'Sin topping', figura: 'ninguno' },
] as const satisfies readonly { nombre: string; figura: FiguraTopping }[];

export const sitio = {
  /** Nombre de la marca. Siempre en minúsculas. */
  nombre: 'aalcuadrado',
  /** Cómo se lee el nombre; se usa en lectores de pantalla. */
  nombreLeido: 'A al cuadrado',
  creador: 'Antonio Alonso',
  descripcion:
    'Manualidades hechas a mano en Mérida: aretes con motivos mexicanos impresos en 3D, kits navideños de jabón y vela y velas personalizadas, en los colores y aromas que elijas.',
  /** Ciudad que aparece en "Hecho en …". */
  ciudad: 'Mérida',

  whatsapp: {
    /**
     * Número con lada de país y sin espacios ni signos.
     * Para un celular de México: 52 + los 10 dígitos.
     */
    numero: '525510727166',
  },

  redes: {
    instagram: { usuario: '@aalcuadrado', url: 'https://www.instagram.com/aalcuadrado' }, // [@aalcuadrado]
    facebook: { usuario: 'aalcuadrado', url: 'https://www.facebook.com/aalcuadrado' }, // [página]
    tiktok: { usuario: '@aalcuadrado', url: 'https://www.tiktok.com/@aalcuadrado' }, // [@aalcuadrado]
  },

  /** Franja de temporada. Cambia `activa` a false para ocultarla. */
  temporada: {
    activa: true,
    /** Colección que se promociona; el botón lleva al catálogo filtrado. */
    coleccion: 'dia-de-muertos' as const,
    titulo: 'Temporada de Día de Muertos',
    texto: 'Llévate 2 pares por',
    precio: 40, // [200]
  },

  /**
   * Precios fijos por ahora, en MXN. Mientras estén aquí, el catálogo
   * ignora el `precio` de cada producto.json.
   */
  precios: {
    /** Cualquier diseño ya listo del catálogo. */
    listo: 20,
    /** Diseño personalizado (colores, iniciales, nombre o evento). */
    personalizado: 50,
  },

  mayoreo: {
    /** Pedido mínimo en pares para precio de mayoreo. */
    minimoPares: 12, // [12]
  },

  producto: {
    /** Peso aproximado por arete, en gramos. */
    pesoGramos: '5 a 7', // [5–7]
    /** Tipo de gancho. CONFIRMAR ANTES DE PUBLICAR. */
    gancho: 'de acero inoxidable', // [TIPO DE GANCHO: CONFIRMAR ANTES DE PUBLICAR]
  },

  /**
   * Kits navideños a la medida. No tienen catálogo: quien visita el sitio arma su
   * kit y el pedido llega a la API (`POST /api/pedidos`), que guarda el texto tal cual.
   * - Colores y aromas salen de la pestaña Kits del panel; los de aquí solo se usan
   *   si la API no tiene ninguno disponible para esa pieza.
   * - Formas y toppings son fijos aquí: cada `figura` tiene su dibujo en la vista previa
   *   (src/components/kits/VistaKit.astro).
   */
  kits: {
    nombre: 'Kits navideños',
    descripcion: 'Una vela aromática, dos jabones artesanales y un nacimiento pequeño, hechos a mano con los colores y aromas que elijas.',
    /** Desde que confirmamos el pedido hasta que el kit está listo. */
    entrega: ENTREGA_KITS,
    /** Lo que trae cada kit. Los dos jabones salen iguales: misma forma, color y aroma. */
    contenido: [
      { cantidad: 1, nombre: `vela aromática de ${vela.gramos} g en frasco` },
      { cantidad: 2, nombre: 'jabones artesanales' },
      { cantidad: 1, nombre: 'nacimiento pequeño' },
    ],
    jabon: {
      colores: [
        { nombre: 'Rojo navidad', hex: '#B3202A' },
        { nombre: 'Verde pino', hex: '#1F5E3B' },
        { nombre: 'Blanco nieve', hex: '#F4EFE6' },
        { nombre: 'Dorado', hex: '#C9A227' },
        { nombre: 'Rosa mexicano', hex: '#E4007C' },
      ],
      aromas: ['Canela', 'Vainilla', 'Pino', 'Naranja y clavo', 'Lavanda'],
      formas: [
        { nombre: 'Copo de nieve', figura: 'copo' },
        { nombre: 'Árbol de navidad', figura: 'arbol' },
        { nombre: 'Santa Claus', figura: 'santa' },
        { nombre: 'Jengibre', figura: 'jengibre' },
        { nombre: 'Regalo', figura: 'regalo' },
        { nombre: 'Estrella', figura: 'estrella' },
        { nombre: 'Cuadrado', figura: 'cuadrado' },
        { nombre: 'Óvalo', figura: 'ovalo' },
        { nombre: 'Óvalo con cavidad', figura: 'ovalo-cavidad' },
      ] satisfies { nombre: string; figura: FiguraJabon }[],
    },
    vela: {
      ...vela,
      colores: [
        { nombre: 'Blanco', hex: '#F4EFE6' },
        { nombre: 'Rojo navidad', hex: '#B3202A' },
        { nombre: 'Verde pino', hex: '#1F5E3B' },
        { nombre: 'Dorado', hex: '#C9A227' },
      ],
      aromas: ['Vainilla', 'Canela', 'Manzana con canela', 'Galleta de jengibre', 'Pino'],
      toppings: TOPPINGS,
    },
  },

  /**
   * Velas personalizadas. Tampoco tienen catálogo: quien visita elige tipo, tamaño o
   * molde, color, aroma y topping, y el pedido llega a la API (`POST /api/velas/pedidos`).
   * - Tamaños y moldes salen de la pestaña Velas del panel (con sus gramos); los de
   *   aquí solo se usan si la API todavía no tiene el módulo de velas.
   * - Colores y aromas son los de los kits marcados "para la vela".
   */
  velas: {
    nombre: 'Velas personalizadas',
    descripcion: 'Velas aromáticas hechas a mano en recipiente, en jícara o de molde, en el tamaño, color, aroma y topping que elijas.',
    entrega: ENTREGA_VELAS,
    /** Cómo se presenta cada tipo en el formulario. */
    tipos: {
      recipiente: { descripcion: 'En frasco de vidrio, en tres tamaños. Se puede marmolear.' },
      molde: { descripcion: 'Con forma, sin recipiente. Por ahora, tipo cupcake.' },
      jicara: { descripcion: 'En media jícara natural, en tres tamaños.' },
    } satisfies Record<TipoVela, { descripcion: string }>,
    presentaciones: [
      { tipo: 'recipiente', nombre: 'Pequeña', gramos: null, marmoleable: true },
      { tipo: 'recipiente', nombre: 'Mediana', gramos: null, marmoleable: true },
      { tipo: 'recipiente', nombre: 'Grande', gramos: null, marmoleable: true },
      { tipo: 'molde', nombre: 'Cupcake', gramos: null, marmoleable: false },
      { tipo: 'jicara', nombre: 'Pequeña', gramos: null, marmoleable: false },
      { tipo: 'jicara', nombre: 'Mediana', gramos: null, marmoleable: false },
      { tipo: 'jicara', nombre: 'Grande', gramos: null, marmoleable: false },
    ] satisfies PresentacionVela[],
    toppings: TOPPINGS,
  },

  /** Preguntas frecuentes de cada página, en el orden en que aparecen. */
  preguntas: {
    aretes: [
      {
        pregunta: '¿De qué material están hechos?',
        respuesta:
          'De PLA, un plástico de origen vegetal (se hace con almidón de maíz o caña). Es ligero, rígido y no se arruga como el papel.',
      },
      {
        pregunta: '¿Cómo los cuido?',
        respuesta:
          'Guárdalos en su caja, lejos del sol directo y del calor (por ejemplo, dentro de un coche estacionado). Si se ensucian, límpialos con un trapo apenas húmedo. Evita perfumes y cremas directo sobre ellos.',
      },
      {
        pregunta: '¿Cuánto tarda mi pedido?',
        respuesta:
          'Si el modelo está disponible, lo enviamos en 2 días hábiles. Los personalizados tardan un poco más porque se imprimen a tu medida; te confirmamos la fecha al cotizar.',
      },
      {
        pregunta: '¿Hacen envíos?',
        respuesta: 'De momento puedes recoger en punto de entrega dentro de Mérida.',
      },
      {
        pregunta: '¿Cómo puedo pagar?',
        respuesta: '[Métodos de pago: transferencia, depósito, efectivo al recoger…]. Te pasamos los datos por WhatsApp.',
      },
      {
        pregunta: '¿Puedo cambiar mis aretes?',
        respuesta:
          'Si llegan dañados, te los reponemos sin costo; avísanos por WhatsApp en los primeros 3 días con una foto. Por higiene, no hacemos cambios de aretes ya usados. Los personalizados no tienen cambio.',
      },
    ],
    kits: [
      {
        pregunta: '¿Qué trae cada kit?',
        respuesta:
          'Una vela aromática en frasco, dos jabones artesanales y un nacimiento pequeño. Los dos jabones salen iguales, con la forma, el color y el aroma que elijas.',
      },
      {
        pregunta: '¿Cuánto cuesta un kit?',
        respuesta:
          'Depende del tamaño y de lo que elijas. Al recibir tu pedido te escribimos con el precio y la fecha de entrega; no pagas nada hasta confirmarlo.',
      },
      {
        pregunta: '¿De qué están hechos?',
        respuesta:
          '[El jabón es de glicerina con aceites aromáticos y la vela es de cera de soya con pabilo de algodón.] Cada pieza se hace a mano, así que puede variar un poco de la vista previa.',
      },
      {
        pregunta: '¿Cuánto tarda mi kit?',
        respuesta: `Se hace a tu medida: está listo en ${ENTREGA_KITS} desde que confirmamos tu pedido.`,
      },
      {
        pregunta: '¿Cuánto dura la vela?',
        respuesta: `Pesa ${vela.gramos} g y dura aproximadamente de ${vela.duracionHoras} horas encendida, según el aroma y cómo la cuides.`,
      },
      {
        pregunta: '¿Cómo uso la vela?',
        respuesta:
          'La primera vez déjala encendida hasta que se derrita toda la superficie (1 a 2 horas); así se consume pareja. Corta el pabilo a medio centímetro antes de cada uso y nunca la dejes encendida sin vigilar.',
      },
      {
        pregunta: '¿Hacen kits para regalar en mi empresa o evento?',
        respuesta: 'Sí. Escríbenos por WhatsApp con cuántos necesitas y los colores de tu evento, y te mandamos la cotización.',
      },
      {
        pregunta: '¿Dónde lo recojo?',
        respuesta: 'De momento puedes recoger en punto de entrega dentro de Mérida.',
      },
    ],
    velas: [
      {
        pregunta: '¿Cuánto cuesta una vela?',
        respuesta:
          'Depende del tipo, el tamaño y lo que elijas. Al recibir tu pedido te escribimos con el precio y la fecha de entrega; no pagas nada hasta confirmarlo.',
      },
      {
        pregunta: '¿Qué diferencia hay entre los tipos?',
        respuesta:
          'La de recipiente va en un frasco de vidrio que puedes reusar; la de jícara, en media jícara natural; y la de molde no lleva recipiente: es la vela con forma (por ahora, tipo cupcake).',
      },
      {
        pregunta: '¿Qué es una vela marmoleada?',
        respuesta:
          'Una vela con vetas de un segundo color, como mármol. Se puede pedir en las velas de recipiente; en jícara no se hace porque no se apreciaría.',
      },
      {
        pregunta: '¿Cuánto tarda mi vela?',
        respuesta: `Se hace a tu medida: está lista en ${ENTREGA_VELAS} desde que confirmamos tu pedido.`,
      },
      {
        pregunta: '¿Puedo pedir varias para un evento?',
        respuesta:
          'Sí. En el formulario puedes pedir hasta 20 velas iguales; si necesitas más o de varios estilos, escríbenos por WhatsApp y te cotizamos.',
      },
      {
        pregunta: '¿Cómo uso la vela?',
        respuesta:
          'La primera vez déjala encendida hasta que se derrita toda la superficie (1 a 2 horas); así se consume pareja. Corta el pabilo a medio centímetro antes de cada uso y nunca la dejes encendida sin vigilar.',
      },
      {
        pregunta: '¿Dónde la recojo?',
        respuesta: 'De momento puedes recoger en punto de entrega dentro de Mérida.',
      },
    ],
  },
} as const;
