/**
 * Visor de fotos (lightbox) sobre <dialog> nativo.
 *
 * - Enlace profundo: #producto/<slug>/<n> o #galeria/<n>. Abrir el visor
 *   agrega una entrada al historial, así que "atrás" lo cierra.
 * - Navegación con teclado, botones, miniaturas y deslizando el dedo.
 * - Zoom con doble clic / doble toque, pellizco y Ctrl + rueda; arrastre con zoom.
 */
import type { ElementoVisor } from '@/components/visor/datos';
import { pedidos } from '@/services/pedidos';
import { alCambiarColor, colorElegido, elegirColor, ordenPorColor } from './colores';

const ESCALA_MAX = 4;
const ESCALA_DOBLE_TOQUE = 2.5;
const UMBRAL_DESLIZAR = 50;

const REGEX_HASH = /^#(producto\/[a-z0-9-]+|galeria)(?:\/(\d+))?$/i;

export function iniciarVisor() {
  const dialogo = document.querySelector<HTMLDialogElement>('#visor');
  const fuente = document.querySelector('#datos-visor');
  if (!dialogo || !fuente?.textContent) return;

  const datos = JSON.parse(fuente.textContent) as Record<string, ElementoVisor>;
  const urlSitio = dialogo.dataset.urlSitio ?? location.origin + location.pathname;

  const $ = <T extends Element>(sel: string) => dialogo.querySelector<T>(sel)!;
  const escenario = $<HTMLElement>('[data-escenario]');
  const imagen = $<HTMLImageElement>('[data-imagen]');
  const contador = $<HTMLElement>('[data-contador]');
  const titulo = $<HTMLElement>('[data-titulo]');
  const precio = $<HTMLElement>('[data-precio]');
  const colores = $<HTMLFieldSetElement>('[data-colores]');
  const pedir = $<HTMLAnchorElement>('[data-pedir]');
  const pedirTexto = $<HTMLElement>('[data-pedir-texto]');
  const miniaturas = $<HTMLUListElement>('[data-miniaturas]');
  const anterior = $<HTMLButtonElement>('[data-anterior]');
  const siguiente = $<HTMLButtonElement>('[data-siguiente]');
  const pistaZoom = $<HTMLElement>('[data-pista-zoom]');

  let elemento: ElementoVisor | null = null;
  /** Índices de las fotos (orden original) en el orden en que se muestran. */
  let orden: number[] = [];
  let posicion = 0;
  let origen: HTMLElement | null = null;
  /** true si el visor agregó una entrada al historial (se cierra con history.back()). */
  let conHistorial = false;

  /* ---------------- Apertura, cierre y URL ---------------- */

  const slugDe = (clave: string) => (clave.startsWith('producto/') ? clave.slice(9) : null);
  const fotoActual = () => orden[posicion] ?? 0;
  const hashActual = () => `#${elemento!.clave}/${fotoActual() + 1}`;

  function leerHash() {
    const m = REGEX_HASH.exec(decodeURIComponent(location.hash));
    if (!m || !datos[m[1]!]) return null;
    return { clave: m[1]!, foto: Math.max(0, Number(m[2] ?? 1) - 1) };
  }

  function abrir(clave: string, foto: number) {
    const nuevo = datos[clave];
    if (!nuevo || nuevo.fotos.length === 0) return;
    const mismo = elemento?.clave === clave && dialogo!.open;
    elemento = nuevo;
    const slug = slugDe(clave);
    orden = ordenPorColor(
      nuevo.fotos.map((f) => f.colorId),
      slug ? colorElegido(slug) : null,
    );
    if (!mismo) pintarFicha();
    mostrar(Math.max(0, orden.indexOf(Math.min(foto, nuevo.fotos.length - 1))), false);

    if (!dialogo!.open) {
      dialogo!.showModal();
      document.documentElement.classList.add('sin-scroll');
      document.body.classList.add('sin-scroll');
      pistaZoom.classList.remove('oculta');
      setTimeout(() => pistaZoom.classList.add('oculta'), 2200);
    }
  }

  function cerrarInterfaz() {
    if (!dialogo!.open) return;
    dialogo!.close();
    document.documentElement.classList.remove('sin-scroll');
    document.body.classList.remove('sin-scroll');
    reiniciarZoom(false);
    elemento = null;
    origen?.focus({ preventScroll: true });
    origen = null;
  }

  function cerrar() {
    if (conHistorial) {
      conHistorial = false;
      history.back(); // dispara hashchange → cerrarInterfaz
    } else {
      history.replaceState(history.state, '', location.pathname + location.search);
      cerrarInterfaz();
    }
  }

  // Recordar qué abrió el visor para devolverle el foco al cerrar.
  document.addEventListener('click', (e) => {
    const enlace = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#producto/"], a[href^="#galeria/"]');
    if (!enlace) return;
    origen = enlace.closest<HTMLElement>('[data-tarjeta]')?.querySelector<HTMLElement>('[data-foto]:not([tabindex])') ?? enlace;
    conHistorial = true;
    // Si el hash ya es el mismo, el navegador no dispara hashchange.
    if (location.hash === enlace.hash) {
      e.preventDefault();
      const destino = leerHash();
      if (destino) abrir(destino.clave, destino.foto);
    }
  });

  window.addEventListener('hashchange', () => {
    const destino = leerHash();
    if (destino) abrir(destino.clave, destino.foto);
    else {
      conHistorial = false;
      cerrarInterfaz();
    }
  });

  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrar();
  });
  $<HTMLButtonElement>('[data-cerrar]').addEventListener('click', cerrar);

  // Mantener el foco dentro del visor.
  dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const enfocables = [...dialogo!.querySelectorAll<HTMLElement>('button:not([hidden]), a[href]:not([hidden])')].filter(
        (el) => el.offsetParent !== null,
      );
      const primero = enfocables[0];
      const ultimo = enfocables.at(-1);
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo?.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      mover(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      mover(-1);
    }
  });

  /* ---------------- Contenido ---------------- */

  function pintarFicha() {
    const el = elemento!;
    titulo.textContent = el.titulo;
    precio.textContent = el.clave === 'galeria' ? '' : (el.precio ?? 'Pregunta por WhatsApp');

    colores.querySelectorAll('button').forEach((b) => b.remove());
    const slug = slugDe(el.clave);
    for (const color of el.colores) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'cuadrito-color';
      boton.style.setProperty('--muestra', color.hex);
      boton.title = color.nombre;
      boton.dataset.colorId = color.id;
      boton.setAttribute('aria-pressed', String(colorElegido(slug!) === color.id));
      boton.innerHTML = `<span class="visualmente-oculto"></span>`;
      boton.firstElementChild!.textContent = color.nombre;
      boton.addEventListener('click', () =>
        elegirColor(slug!, boton.getAttribute('aria-pressed') === 'true' ? null : color.id),
      );
      colores.append(boton);
    }

    pedir.hidden = el.clave === 'galeria';
    pedirTexto.textContent = el.disponible ? 'Pedir por WhatsApp' : 'Avísame por WhatsApp';
    actualizarPedido();
    pintarMiniaturas();
  }

  function pintarMiniaturas() {
    const el = elemento!;
    miniaturas.replaceChildren(
      ...orden.map((indice, pos) => {
        const foto = el.fotos[indice]!;
        const li = document.createElement('li');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.setAttribute('aria-label', `Foto ${pos + 1} de ${orden.length}`);
        const img = document.createElement('img');
        img.src = foto.miniatura;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 64;
        img.height = 80;
        boton.append(img);
        boton.addEventListener('click', () => mostrar(pos));
        li.append(boton);
        return li;
      }),
    );
    miniaturas.hidden = orden.length < 2;
  }

  function actualizarPedido() {
    const el = elemento!;
    const slug = slugDe(el.clave);
    if (!slug) return;
    const color = el.colores.find((c) => c.id === colorElegido(slug));
    pedir.href = pedidos.pedirProducto({
      nombre: el.titulo,
      color: color?.nombre,
      enlace: `${urlSitio}${hashActual()}`,
      disponible: el.disponible,
    });
  }

  function mostrar(nuevaPosicion: number, animar = true) {
    const el = elemento!;
    const total = orden.length;
    posicion = (nuevaPosicion + total) % total;
    const foto = el.fotos[fotoActual()]!;

    reiniciarZoom(false);
    imagen.srcset = foto.srcset;
    imagen.src = foto.src;
    imagen.width = foto.ancho;
    imagen.height = foto.alto;
    imagen.alt = foto.alt;
    if (animar) {
      imagen.classList.remove('cambiando');
      void imagen.offsetWidth;
      imagen.classList.add('cambiando');
    }

    contador.textContent = `${posicion + 1} de ${total}`;
    anterior.hidden = siguiente.hidden = total < 2;
    miniaturas.querySelectorAll('button').forEach((b, i) => {
      b.setAttribute('aria-current', String(i === posicion));
      if (i === posicion) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });

    history.replaceState(history.state, '', hashActual());
    actualizarPedido();
    precargarVecinas();
  }

  function mover(paso: number) {
    if (!elemento || orden.length < 2) return;
    mostrar(posicion + paso);
  }

  function precargarVecinas() {
    for (const paso of [1, -1]) {
      const indice = orden[(posicion + paso + orden.length) % orden.length];
      const foto = indice === undefined ? undefined : elemento!.fotos[indice];
      if (!foto) continue;
      const img = new Image();
      img.sizes = '100vw';
      img.srcset = foto.srcset;
      img.src = foto.src;
    }
  }

  anterior.addEventListener('click', () => mover(-1));
  siguiente.addEventListener('click', () => mover(1));

  alCambiarColor(({ slug, colorId }) => {
    if (!elemento || slugDe(elemento.clave) !== slug) return;
    colores
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.colorId === colorId)));
    orden = ordenPorColor(
      elemento.fotos.map((f) => f.colorId),
      colorId,
    );
    pintarMiniaturas();
    mostrar(0);
  });

  /* ---------------- Zoom, arrastre y deslizamiento ---------------- */

  let escala = 1;
  let tx = 0;
  let ty = 0;
  let huboArrastre = false;

  const punteros = new Map<number, { x: number; y: number }>();
  let inicioGesto: {
    escala: number;
    tx: number;
    ty: number;
    distancia: number;
    centro: { x: number; y: number };
    x: number;
    y: number;
  } | null = null;
  let ultimoToque = { t: 0, x: 0, y: 0 };
  /** Dónde empezó el gesto (con la captura de puntero, `pointerup` siempre apunta al escenario). */
  let objetivoInicial: EventTarget | null = null;

  function aplicar(animar: boolean) {
    imagen.classList.toggle('animando', animar);
    imagen.classList.toggle('con-zoom', escala > 1);
    imagen.style.transform = escala === 1 && tx === 0 && ty === 0 ? '' : `translate(${tx}px, ${ty}px) scale(${escala})`;
  }

  function limitar() {
    const maxX = Math.max(0, (imagen.offsetWidth * escala - escenario.clientWidth) / 2);
    const maxY = Math.max(0, (imagen.offsetHeight * escala - escenario.clientHeight) / 2);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function reiniciarZoom(animar = true) {
    escala = 1;
    tx = 0;
    ty = 0;
    aplicar(animar);
  }

  /** Cambia la escala manteniendo fijo el punto (x, y) de la pantalla. */
  function zoomEn(nuevaEscala: number, x: number, y: number, animar: boolean) {
    const caja = escenario.getBoundingClientRect();
    const px = x - (caja.left + caja.width / 2);
    const py = y - (caja.top + caja.height / 2);
    const s = Math.min(ESCALA_MAX, Math.max(1, nuevaEscala));
    tx = px - ((px - tx) * s) / escala;
    ty = py - ((py - ty) * s) / escala;
    escala = s;
    if (escala === 1) tx = ty = 0;
    limitar();
    aplicar(animar);
  }

  function alternarZoom(x: number, y: number) {
    if (escala > 1) reiniciarZoom();
    else zoomEn(ESCALA_DOBLE_TOQUE, x, y, true);
  }

  escenario.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return; // pellizco en trackpad
      e.preventDefault();
      zoomEn(escala * Math.exp(-e.deltaY / 100), e.clientX, e.clientY, false);
    },
    { passive: false },
  );

  const distancia = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  function nuevoGesto() {
    const [a, b] = [...punteros.values()];
    inicioGesto = {
      escala,
      tx,
      ty,
      distancia: a && b ? distancia(a, b) : 0,
      centro: a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: a?.x ?? 0, y: a?.y ?? 0 },
      x: a?.x ?? 0,
      y: a?.y ?? 0,
    };
  }

  escenario.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (punteros.size === 0) objetivoInicial = e.target;
    escenario.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    huboArrastre = false;
    nuevoGesto();
  });

  escenario.addEventListener('pointermove', (e) => {
    if (!punteros.has(e.pointerId) || !inicioGesto) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a, b] = [...punteros.values()];

    if (a && b) {
      // Pellizco
      const centro = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      escala = inicioGesto.escala;
      tx = inicioGesto.tx + (centro.x - inicioGesto.centro.x);
      ty = inicioGesto.ty + (centro.y - inicioGesto.centro.y);
      zoomEn((inicioGesto.escala * distancia(a, b)) / Math.max(inicioGesto.distancia, 1), centro.x, centro.y, false);
      huboArrastre = true;
      return;
    }

    const dx = e.clientX - inicioGesto.x;
    const dy = e.clientY - inicioGesto.y;
    if (Math.hypot(dx, dy) > 6) huboArrastre = true;

    if (escala > 1) {
      // Arrastrar la foto ampliada
      tx = inicioGesto.tx + dx;
      ty = inicioGesto.ty + dy;
      limitar();
      aplicar(false);
    } else if (orden.length > 1 && Math.abs(dx) > Math.abs(dy)) {
      // Deslizar para cambiar de foto: la imagen sigue al dedo
      imagen.style.transform = `translateX(${dx}px)`;
    }
  });

  function terminar(e: PointerEvent) {
    if (!punteros.has(e.pointerId)) return;
    punteros.delete(e.pointerId);
    const gesto = inicioGesto;

    if (punteros.size > 0) {
      nuevoGesto(); // queda un dedo: seguir arrastrando desde ahí
      return;
    }
    inicioGesto = null;
    if (!gesto || e.type === 'pointercancel') return;

    const dx = e.clientX - gesto.x;
    const dy = e.clientY - gesto.y;

    if (escala === 1 && gesto.escala === 1 && huboArrastre) {
      if (Math.abs(dx) > UMBRAL_DESLIZAR && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1);
      else reiniciarZoom(true);
      return;
    }

    if (huboArrastre) return;

    // Tocar el fondo (fuera de la foto) cierra el visor.
    if (objetivoInicial !== imagen) {
      if (escala === 1) cerrar();
      return;
    }

    // Doble toque o doble clic sobre la foto: acercar o alejar.
    const ahora = performance.now();
    if (ahora - ultimoToque.t < 320 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 30) {
      alternarZoom(e.clientX, e.clientY);
      ultimoToque = { t: 0, x: 0, y: 0 };
    } else {
      ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
    }
  }

  escenario.addEventListener('pointerup', terminar);
  escenario.addEventListener('pointercancel', terminar);

  // Enlace compartido: abrir al cargar la página (al final, cuando todo está listo).
  const inicial = leerHash();
  if (inicial) {
    origen = document.querySelector<HTMLElement>(`[data-tarjeta][data-slug="${slugDe(inicial.clave)}"] [data-foto]`);
    abrir(inicial.clave, inicial.foto);
  }
}
