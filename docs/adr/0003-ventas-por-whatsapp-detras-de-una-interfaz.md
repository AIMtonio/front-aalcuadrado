# 0003. Ventas por WhatsApp, detrás de una interfaz

- **Estado:** Aceptada
- **Fecha:** 2026-10-21

## Contexto

Los clientes del taller ya compran por WhatsApp: preguntan, negocian colores y acuerdan la entrega en el chat. Un carrito con pagos en línea agrega costo, comisiones y soporte que hoy no se justifican.

## Decisión

Todo botón de compra pide su enlace a la interfaz `CanalPedidos` (`src/services/pedidos.ts`). La implementación actual, `CanalWhatsApp`, arma enlaces `wa.me` con el mensaje ya escrito: producto, color, enlace profundo a la foto o el detalle del kit. La UI no sabe que existe WhatsApp.

## Alternativas consideradas

- **Carrito y checkout (Stripe, Mercado Pago):** útil con más volumen o envíos nacionales; hoy no se necesita.
- **Formulario de contacto genérico:** pierde la inmediatez del chat y obliga a responder por otro canal.

## Consecuencias

- Cero costo y cero fricción para el cliente.
- La venta se cierra fuera del sistema: no hay registro de aretes vendidos.
- Pasar a un carrito es escribir otra implementación de `CanalPedidos` y cambiar una línea; los componentes no cambian.
- WhatsApp también es el **respaldo** de los pedidos de kits cuando la API falla (ver [0004](0004-kits-como-pedido-a-la-medida.md)).
