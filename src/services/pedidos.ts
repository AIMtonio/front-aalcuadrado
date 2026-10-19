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

export interface PedidoProducto {
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
  mayoreo(): string;
  /** Contacto general (encabezado, botón flotante, pie de página). */
  general(): string;
}

export class CanalWhatsApp implements CanalPedidos {
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

  mayoreo() {
    return this.#enlace('Hola, me interesa comprar al mayoreo para mi tienda/negocio.');
  }

  general() {
    return this.#enlace('Hola, vi su página y me interesan sus aretes.');
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
