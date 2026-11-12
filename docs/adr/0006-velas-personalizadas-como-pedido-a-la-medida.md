# 0006. Las velas personalizadas siguen el modelo de pedido a la medida

- **Estado:** Aceptada
- **Fecha:** 2026-11-12

## Contexto

Además de los kits, el taller vende velas individuales personalizadas de tres tipos: **en recipiente** (Pequeña, Mediana, Grande), **de molde** (por ahora solo Cupcake) y **en jícara** (Pequeña, Mediana, Grande). Cada una lleva color, aroma y topping, y las de recipiente pueden ser **marmoleadas** con un segundo color; en jícara nunca, porque no se apreciaría. Los gramos de cada tamaño todavía no están definidos. El back (rama `feature/add-new-products`) agregó el módulo `velas`: presentaciones administradas en el panel, fotos por tipo (`velas-recipiente`, `velas-molde`, `velas-jicara`) y `POST /api/velas/pedidos`.

## Decisión

- Una página propia, `/velas/`, con su pestaña en el encabezado y su tarjeta en la portada ([0005](0005-una-pagina-por-linea-de-producto.md)).
- Mismo modelo que los kits ([0004](0004-kits-como-pedido-a-la-medida.md)): formulario **Arma tu vela** con vista previa en SVG, reglas en `src/domain/velas.ts` copiadas del DTO del back y respaldo por WhatsApp (`CanalPedidos.vela()`).
- **Tamaños y moldes** salen del panel al compilar (`/api/velas/presentaciones`, solo los disponibles). Los gramos se muestran solo si existen ("Mediana · 180 g"). Sin el módulo en la API se usan los de `sitio.velas`.
- **Colores y aromas** son los de los kits marcados "para la vela"; **toppings**, la misma lista fija de los kits (`TOPPINGS` en `sitio.ts`).
- El marmoleado se ofrece solo cuando la presentación es `marmoleable`; el front además lo bloquea en jícara aunque el panel dijera otra cosa.
- Las fotos de cada tipo ilustran la tarjeta del tipo, la vista previa y la sección "Así se ven"; se abren en el visor con `#velas-<tipo>/<n>`.
- Un solo cliente HTTP para los dos encargos: `ClienteEncargos` (`'kit'` → `/api/pedidos`, `'vela'` → `/api/velas/pedidos`).

## Alternativas consideradas

- **Agregar las velas a la página de kits:** mezcla dos productos con reglas distintas y alarga un formulario que ya es largo.
- **Colores y aromas propios de las velas en el panel:** duplicaría la administración; el back ya reutiliza los de los kits.
- **Un formulario por tipo:** tres veces el mismo código; las diferencias (tamaños, marmoleado) caben en un solo formulario que se adapta al tipo.

## Consecuencias

- Agregar un tamaño o molde no requiere código: se da de alta en el panel y se vuelve a publicar. Un molde con forma distinta a cupcake sí necesitaría su dibujo en `VistaVela.astro`.
- Si el dueño apaga todas las presentaciones de un tipo, ese tipo desaparece del sitio.
- La vista previa es una idea de cómo quedará; las fotos del panel son la referencia real.
