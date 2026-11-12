# 0004. Los kits son un pedido a la medida

- **Estado:** Aceptada
- **Fecha:** 2026-11-07

## Contexto

Los kits navideños (1 vela de 100 g, 2 jabones y un nacimiento pequeño) se hacen a la medida: el cliente elige color, aroma y forma de los jabones, y color, aroma y topping de la vela. Las combinaciones son demasiadas para tratarlas como productos del catálogo, y el precio se cotiza a mano.

## Decisión

- El sitio ofrece un formulario, **Arma tu kit**, con vista previa dibujada en SVG.
- El pedido se manda a `POST /api/pedidos` (pública, sin token, 5 por minuto por IP). El dueño lo ve en el panel y cotiza.
- Las reglas del pedido viven en `src/domain/kits.ts` y repiten las del DTO del back, para mostrar errores junto a cada campo antes de mandar.
- **Colores y aromas** vienen del panel (solo los disponibles, por pieza). **Formas y toppings** son fijos en `src/config/sitio.ts`, porque cada uno tiene su dibujo en la vista previa.
- Si no hay API o falla, el mismo pedido se manda por WhatsApp.

## Alternativas consideradas

- **Un producto por combinación:** cientos de productos sin foto real.
- **Solo WhatsApp:** pedidos incompletos, sin registro y difíciles de ordenar en temporada alta.
- **Formas y toppings también en el panel:** obligaría a subir un dibujo por opción; se deja para cuando haya fotos reales de cada molde.

## Consecuencias

- Los pedidos llegan completos y validados, con folio.
- Agregar una forma o topping requiere un cambio de código (opción + dibujo).
- Los dos jabones de un kit comparten forma, color y aroma porque el pedido de la API guarda una sola combinación de jabón.
