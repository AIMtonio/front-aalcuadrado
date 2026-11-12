# Registro de decisiones de arquitectura (ADR)

Cada archivo documenta una decisión que cambia la forma del sistema: por qué se tomó, qué otras opciones había y qué consecuencias trae. Una decisión no se borra: si cambia, se escribe un ADR nuevo que la **reemplaza** y el anterior se marca así.

| # | Decisión | Estado |
| --- | --- | --- |
| [0001](0001-sitio-estatico-con-astro.md) | Sitio estático con Astro | Aceptada |
| [0002](0002-catalogo-desde-la-api-al-compilar.md) | El catálogo se lee de la API al compilar | Aceptada |
| [0003](0003-ventas-por-whatsapp-detras-de-una-interfaz.md) | Ventas por WhatsApp, detrás de una interfaz | Aceptada |
| [0004](0004-kits-como-pedido-a-la-medida.md) | Los kits son un pedido a la medida | Aceptada |
| [0005](0005-una-pagina-por-linea-de-producto.md) | Una página por línea de producto | Aceptada |
| [0006](0006-velas-personalizadas-como-pedido-a-la-medida.md) | Las velas personalizadas siguen el modelo de pedido a la medida | Aceptada |

## Plantilla

```markdown
# NNNN. Título en una frase

- **Estado:** Propuesta | Aceptada | Reemplazada por NNNN
- **Fecha:** AAAA-MM-DD

## Contexto
## Decisión
## Alternativas consideradas
## Consecuencias
```
