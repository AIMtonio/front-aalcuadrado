/**
 * Comportamiento de las tarjetas del catálogo:
 * deslizar fotos, cambiar de foto al pasar el cursor y elegir color.
 */
import { pedidos } from '@/services/pedidos';
import { alCambiarColor, elegirColor, ordenPorColor } from './colores';

const conCursor = window.matchMedia('(hover: hover) and (pointer: fine)');

function iniciarTarjeta(tarjeta: HTMLElement) {
  const slug = tarjeta.dataset.slug!;
  const nombre = tarjeta.dataset.nombre!;
  const enlace = tarjeta.dataset.enlace!;
  const disponible = tarjeta.dataset.disponible === 'true';
  const pista = tarjeta.querySelector<HTMLElement>('[data-pista]')!;
  const fotos = [...pista.querySelectorAll<HTMLAnchorElement>('[data-foto]')];
  const indicadores = [...tarjeta.querySelectorAll<HTMLElement>('[data-indicadores] > *')];
  const botonesColor = [...tarjeta.querySelectorAll<HTMLButtonElement>('[data-color-id]')];
  const textoColor = tarjeta.querySelector<HTMLElement>('[data-color-elegido]');
  const botonPedido = tarjeta.querySelector<HTMLAnchorElement>('[data-boton-pedido]');

  const posicionActual = () => Math.round(pista.scrollLeft / Math.max(pista.clientWidth, 1));

  const irA = (posicion: number) => {
    pista.scrollTo({ left: posicion * pista.clientWidth, behavior: 'instant' });
    actualizarIndicadores();
  };

  function actualizarIndicadores() {
    const actual = posicionActual();
    const enOrden = [...pista.children] as HTMLElement[];
    enOrden.forEach((foto, i) => (i === actual ? foto.removeAttribute('tabindex') : foto.setAttribute('tabindex', '-1')));
    indicadores.forEach((ind, i) => ind.classList.toggle('activo', i === actual));
  }

  let pendiente = 0;
  pista.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(actualizarIndicadores);
    },
    { passive: true },
  );

  // Escritorio: al pasar el cursor se ve la segunda foto.
  if (fotos.length > 1) {
    tarjeta.querySelector('.tarjeta__media')?.addEventListener('mouseenter', () => {
      if (conCursor.matches && posicionActual() === 0) irA(1);
    });
    tarjeta.querySelector('.tarjeta__media')?.addEventListener('mouseleave', () => {
      if (conCursor.matches) irA(0);
    });
  }

  botonesColor.forEach((boton) =>
    boton.addEventListener('click', () => {
      const id = boton.dataset.colorId!;
      // Tocar el color ya elegido lo desmarca.
      elegirColor(slug, boton.getAttribute('aria-pressed') === 'true' ? null : id);
    }),
  );

  alCambiarColor(({ slug: s, colorId }) => {
    if (s !== slug) return;
    const color = botonesColor.find((b) => b.dataset.colorId === colorId);
    botonesColor.forEach((b) => b.setAttribute('aria-pressed', String(b === color)));
    if (textoColor) textoColor.textContent = color?.dataset.colorNombre ?? '';

    // Las fotos del color elegido pasan al frente.
    const orden = ordenPorColor(
      fotos.map((f) => f.dataset.color),
      colorId,
    );
    orden.forEach((i) => pista.append(fotos[i]!));
    irA(0);

    if (botonPedido) {
      botonPedido.href = pedidos.pedirProducto({
        nombre,
        color: color?.dataset.colorNombre,
        enlace,
        disponible,
      });
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-tarjeta]').forEach(iniciarTarjeta);
