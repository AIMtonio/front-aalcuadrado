/**
 * Servicio de pedidos.
 *
 * Hoy todos los pedidos se hacen por WhatsApp. La UI pide enlaces a
 * `CanalPedidos` y no sabe nada de WhatsApp; cuando exista un carrito o
 * checkout, basta con otra implementación de esta interfaz.
 *
 * Este módulo es puro (sin APIs de Astro) para poder usarlo también en
 * el navegador, por ejemplo al cambiar de color en una tarjeta.
 */
import { sitio } from '@/config/sitio';
import type { Linea } from '@/config/rutas';
import type { PedidoKit } from '@/domain/kits';

interface PedidoProducto {
  nombre: string;
  color?: string;
  /** Enlace profundo al producto, para que quien atiende sepa de cuál se habla. */
  enlace?: string;
  disponible?: boolean;
}

export interface CanalPedidos {
  /** Enlace para pedir (o pedir aviso de) un producto concreto. */
  pedirProducto(pedido: PedidoProducto): string;
  personalizado(): string;
  /** Pedir un diseño hecho en el diseñador del sitio; la imagen la manda el cliente en el chat. */
  disenoIA(idea: string): string;
  mayoreo(): string;
  /** Mandar (o completar) un pedido de kit navideño; `folio` es el id que regresó la API. */
  kit(pedido: PedidoKit, folio?: number): string;
  /** Contacto general (encabezado, botón flotante, pie de página), según la página. */
  general(linea?: Linea): string;
}

const SALUDO: Record<Linea, string> = {
  inicio: 'Hola, vi su página y me gustaría hacer un pedido.',
  aretes: 'Hola, vi su página y me interesan sus aretes.',
  kits: 'Hola, vi su página y me interesan los kits navideños.',
};

class CanalWhatsApp implements CanalPedidos {
  constructor(private readonly numero: string) {}

  #enlace(mensaje: string) {
    return `https://wa.me/${this.numero}?text=${encodeURIComponent(mensaje)}`;
  }

  pedirProducto({ nombre, color, enlace, disponible = true }: PedidoProducto) {
    const enColor = color ? ` en color ${color.toLowerCase()}` : '';
    const pregunta = disponible
      ? '¿Están disponibles?'
      : 'Vi que están agotados, ¿me avisas cuando vuelvan?';
    const mensaje = `Hola, me interesan los aretes ${nombre}${enColor}. ${pregunta}`;
    return this.#enlace(enlace ? `${mensaje}\n${enlace}` : mensaje);
  }

  personalizado() {
    return this.#enlace('Hola, quiero unos aretes personalizados. Mi idea es: ');
  }

  disenoIA(idea: string) {
    return this.#enlace(
      `Hola, diseñé unos aretes en su página y me gustaría pedirlos. Mi idea fue: "${idea}". Les mando la imagen.`,
    );
  }

  mayoreo() {
    return this.#enlace('Hola, me interesa comprar al mayoreo para mi tienda/negocio.');
  }

  kit(p: PedidoKit, folio?: number) {
    const lineas = [
      folio ? `Hola, acabo de mandar el pedido #${folio} de un kit navideño:` : 'Hola, quiero pedir un kit navideño:',
      `• 2 jabones: ${p.jabonColor.toLowerCase()}, aroma ${p.jabonAroma.toLowerCase()}, forma ${p.jabonForma.toLowerCase()}`,
      `• 1 vela: ${p.velaColor.toLowerCase()}, aroma ${p.velaAroma.toLowerCase()}, ${p.velaTopping.toLowerCase()}`,
      '• 1 nacimiento pequeño',
      `A nombre de ${p.clienteNombre} (${p.clienteContacto}). ¿Me pasan el precio?`,
    ];
    return this.#enlace(lineas.join('\n'));
  }

  general(linea: Linea = 'inicio') {
    return this.#enlace(SALUDO[linea]);
  }
}

export const pedidos: CanalPedidos = new CanalWhatsApp(sitio.whatsapp.numero);

/** Formato de precio en pesos mexicanos: $120. */
export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: precio % 1 === 0 ? 0 : 2,
  }).format(precio);
}
