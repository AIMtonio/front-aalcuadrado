/**
 * Comportamiento de "Diseña tus aretes": revisa la idea, la manda a la
 * API, muestra la impresora mientras espera y luego la imagen con sus acciones.
 */
import { IDEA_MAX, revisarIdea } from '@/domain/disenos';
import { ClienteDisenos, ErrorDiseno } from '@/services/disenos';
import { pedidos } from '@/services/pedidos';

type Vista = 'vacio' | 'cargando' | 'resultado';

/** Se van turnando mientras la IA trabaja. */
const MENSAJES_ESPERA = [
  'Pensando tu diseño…',
  'Calentando la boquilla…',
  'Eligiendo los colores…',
  'Imprimiendo capa por capa…',
  'Recortando la silueta…',
  'Puliendo los detalles…',
  'Poniéndole los ganchos…',
  'Casi listo…',
];
const CADA_MENSAJE_MS = 5_000;
/** La barra llega al 95 % en este tiempo; el último tramo lo completa la respuesta. */
const DURACION_BARRA_MS = 60_000;
/** Desde cuántos diseños restantes se avisa al visitante. */
const AVISAR_RESTANTES = 10;

function iniciarDisenador(seccion: HTMLElement) {
  const cliente = new ClienteDisenos(seccion.dataset.api!);
  const $ = <T extends Element>(selector: string) => seccion.querySelector<T>(selector)!;

  const formulario = $<HTMLFormElement>('[data-formulario]');
  const idea = $<HTMLTextAreaElement>('[data-idea]');
  const contador = $<HTMLElement>('[data-contador]');
  const error = $<HTMLElement>('[data-error]');
  const generar = $<HTMLButtonElement>('[data-generar]');
  const generarTexto = $<HTMLElement>('[data-generar-texto]');
  const ejemplos = [...seccion.querySelectorAll<HTMLButtonElement>('[data-ejemplo]')];
  const restantes = $<HTMLElement>('[data-restantes]');
  const lienzo = $<HTMLElement>('[data-lienzo]');
  const vistas = [...seccion.querySelectorAll<HTMLElement>('[data-vista]')];
  const mensaje = $<HTMLElement>('[data-mensaje]');
  const progreso = $<HTMLElement>('[data-progreso]');
  const imagen = $<HTMLImageElement>('[data-imagen]');
  const pedir = $<HTMLAnchorElement>('[data-pedir]');
  const descargar = $<HTMLAnchorElement>('[data-descargar]');
  const anuncio = $<HTMLElement>('[data-anuncio]');

  let vistaActual: Vista = 'vacio';
  let generando = false;
  let agotado = false;
  let temporizador = 0;

  function mostrar(vista: Vista) {
    vistaActual = vista;
    for (const v of vistas) v.hidden = v.dataset.vista !== vista;
    lienzo.setAttribute('aria-busy', String(vista === 'cargando'));
  }

  function mostrarError(texto: string) {
    error.textContent = texto;
    error.hidden = false;
    idea.setAttribute('aria-invalid', 'true');
  }

  function limpiarError() {
    error.hidden = true;
    error.textContent = '';
    idea.removeAttribute('aria-invalid');
  }

  function actualizarContador() {
    contador.textContent = `${idea.value.length}/${IDEA_MAX}`;
  }

  function actualizarRestantes(n: number) {
    agotado = n <= 0;
    restantes.hidden = !agotado && n > AVISAR_RESTANTES;
    restantes.textContent = agotado
      ? 'Por hoy ya no hay diseños disponibles. Vuelve mañana o escríbenos por WhatsApp.'
      : `Quedan ${n} diseño${n === 1 ? '' : 's'} por hoy.`;
    bloquear(generando);
  }

  function bloquear(si: boolean) {
    idea.disabled = si || agotado;
    generar.disabled = si || agotado;
    for (const b of ejemplos) b.disabled = si || agotado;
    generarTexto.textContent = si ? 'Creando…' : 'Crear diseño';
  }

  function empezarEspera() {
    let i = 0;
    mensaje.textContent = MENSAJES_ESPERA[0]!;
    temporizador = window.setInterval(() => {
      i = Math.min(i + 1, MENSAJES_ESPERA.length - 1);
      mensaje.textContent = MENSAJES_ESPERA[i]!;
    }, CADA_MENSAJE_MS);

    // Reinicia la barra y la hace avanzar hasta el 95 %, cada vez más lento.
    progreso.style.transition = 'none';
    progreso.style.width = '0';
    void progreso.offsetWidth;
    progreso.style.transition = `width ${DURACION_BARRA_MS}ms cubic-bezier(0.1, 0.6, 0.3, 1)`;
    progreso.style.width = '95%';
  }

  function terminarEspera() {
    clearInterval(temporizador);
    progreso.style.transition = 'width 200ms ease-out';
    progreso.style.width = '100%';
  }

  idea.addEventListener('input', () => {
    actualizarContador();
    if (!error.hidden) limpiarError();
  });

  for (const boton of ejemplos) {
    boton.addEventListener('click', () => {
      idea.value = boton.textContent?.trim() ?? '';
      actualizarContador();
      limpiarError();
      idea.focus();
    });
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (generando || agotado) return;

    const revision = revisarIdea(idea.value);
    if (!revision.valida) {
      mostrarError(revision.motivo);
      idea.focus();
      return;
    }

    limpiarError();
    const vistaAnterior = vistaActual;
    generando = true;
    bloquear(true);
    mostrar('cargando');
    empezarEspera();
    anuncio.textContent = 'Creando tu diseño. Puede tardar hasta un minuto.';
    if (window.matchMedia('(max-width: 59.99rem)').matches) {
      lienzo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    try {
      const diseno = await cliente.generar(revision.texto);
      terminarEspera();
      imagen.src = diseno.imagen;
      imagen.alt = `Diseño de aretes a partir de la idea: ${revision.texto}`;
      pedir.href = pedidos.disenoIA(revision.texto);
      descargar.href = diseno.imagen;
      descargar.download = `aalcuadrado-diseno.${diseno.imagen.match(/^data:image\/(\w+)/)?.[1] ?? 'webp'}`;
      mostrar('resultado');
      anuncio.textContent = 'Tu diseño está listo.';
      actualizarRestantes(diseno.restantesHoy);
    } catch (e) {
      terminarEspera();
      mostrar(vistaAnterior);
      anuncio.textContent = '';
      mostrarError(e instanceof ErrorDiseno ? e.message : 'Algo salió mal al crear tu diseño. Intenta de nuevo.');
      if (e instanceof ErrorDiseno && e.estado === 429 && /mañana/i.test(e.message)) actualizarRestantes(0);
    } finally {
      generando = false;
      bloquear(false);
      if (!error.hidden) idea.focus();
    }
  });

  actualizarContador();
  mostrar('vacio');

  // La sección arranca oculta: solo aparece si la API dice que hay diseños disponibles.
  cliente
    .estado()
    .then((estado) => {
      if (!estado.disponible) return;
      actualizarRestantes(estado.restantesHoy);
      seccion.hidden = false;
    })
    .catch((e: unknown) => {
      console.info('[aalcuadrado] El diseñador no está disponible:', e);
    });
}

document.querySelectorAll<HTMLElement>('[data-disenador]').forEach(iniciarDisenador);
