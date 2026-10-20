/**
 * Configuración general de aalcuadrado.
 *
 * Todo lo que cambia seguido (número de WhatsApp, redes, precios,
 * promoción de temporada, preguntas frecuentes) vive aquí.
 * Los valores entre [CORCHETES] están pendientes de confirmar.
 */

export const sitio = {
  /** Nombre de la marca. Siempre en minúsculas. */
  nombre: 'aalcuadrado',
  /** Cómo se lee el nombre; se usa en lectores de pantalla. */
  nombreLeido: 'A al cuadrado',
  creador: 'Antonio Alonso',
  descripcion:
    'Aretes y accesorios con motivos mexicanos, diseñados e impresos en 3D. Ligeros, resistentes y en los colores que elijas. Pide por WhatsApp.',
  /** Ciudad que aparece en "Hecho en …". */
  ciudad: '[Ciudad de México]',

  whatsapp: {
    /**
     * Número con lada de país y sin espacios ni signos.
     * Ejemplo para un celular de CDMX: 5215512345678.
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
    precio: 70, // [200]
  },

  /**
   * Precios fijos por ahora, en MXN. Mientras estén aquí, el catálogo
   * ignora el `precio` de cada producto.json.
   */
  precios: {
    /** Cualquier diseño ya listo del catálogo. */
    listo: 40,
    /** Diseño personalizado (colores, iniciales, nombre o evento). */
    personalizado: 60,
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

  /** Preguntas frecuentes, en el orden en que aparecen. */
  preguntas: [
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
} as const;

export type Sitio = typeof sitio;
