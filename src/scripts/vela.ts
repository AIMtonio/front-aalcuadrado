/**
 * Formulario "Arma tu vela": muestra los tamaños del tipo elegido, el marmoleado solo
 * donde se puede, actualiza la vista previa y el resumen, revisa el pedido y lo manda
 * a la API, o por WhatsApp si no hay API o falla.
 */
import { CAMPOS_VELA, MAX_CANTIDAD_VELAS, NOMBRES_TIPO_VELA, revisarPedidoVela, type CampoVela, type PedidoVela, type TipoVela } from '@/domain/velas';
import { ClienteEncargos, ErrorPedido } from '@/services/encargos';
import { sitio } from '@/config/sitio';
import { pedidos } from '@/services/pedidos';

function iniciarVela(formulario: HTMLFormElement) {
  const seccion = formulario.closest('section')!;
  const $ = <T extends Element>(selector: string) => seccion.querySelector<T>(selector)!;
  const $$ = <T extends Element>(selector: string) => [...seccion.querySelectorAll<T>(selector)];
  const cliente = formulario.dataset.api ? new ClienteEncargos(formulario.dataset.api, 'vela') : null;

  // La vista previa; las tarjetas de tipo sin foto también llevan un dibujo de vela.
  const vista = $<SVGElement>('.arma__lienzo [data-vista-vela]');
  /** Último tamaño elegido de cada tipo: al volver a un tipo, sigue elegido. */
  const tamanoPorTipo = new Map<string, string>();
  const campoMarmol = $<HTMLFieldSetElement>('[data-marmol-campo]');
  const sinMarmol = $<HTMLElement>('[data-marmol-no]');
  const casillaMarmol = $<HTMLInputElement>('[data-marmoleado]');
  const vetas = $<HTMLFieldSetElement>('[data-vetas]');
  const cantidad = $<HTMLInputElement>('input[name="cantidad"]');
  const aviso = $<HTMLElement>('[data-aviso]');
  const enviar = $<HTMLButtonElement>('[data-enviar]');
  const textoEnviar = $<HTMLElement>('[data-enviar-texto]');
  const porWhatsApp = $<HTMLAnchorElement>('[data-whatsapp]');
  const listo = $<HTMLElement>('[data-listo]');
  const textoOriginal = textoEnviar.textContent ?? '';

  const elegido = (nombre: string) => formulario.querySelector<HTMLInputElement>(`input[name="${nombre}"]:checked:not(:disabled)`);
  const tipoActual = () => (elegido('tipo')?.value ?? 'recipiente') as TipoVela;
  const resumen = (campo: string, texto: string) => {
    const dd = seccion.querySelector(`[data-resumen="${campo}"]`);
    if (dd) dd.textContent = texto;
  };

  /** Solo se manda (y se ve) la lista de tamaños del tipo elegido. */
  function mostrarTipo() {
    const tipo = tipoActual();
    for (const lista of $$<HTMLFieldSetElement>('[data-presentaciones]')) {
      const activa = lista.dataset.presentaciones === tipo;
      lista.hidden = !activa;
      lista.disabled = !activa;
      if (activa && !lista.querySelector('input:checked')) {
        const recordado = tamanoPorTipo.get(tipo);
        const opciones = [...lista.querySelectorAll<HTMLInputElement>('input')];
        (opciones.find((o) => o.value === recordado) ?? opciones[0]!).checked = true;
      }
    }
    for (const fotos of $$<HTMLElement>('[data-fotos-tipo]')) fotos.hidden = fotos.dataset.fotosTipo !== tipo;
    vista.querySelectorAll<SVGElement>('[data-tipo]').forEach((g) => g.toggleAttribute('data-activa', g.dataset.tipo === tipo));
    resumen('tipo', NOMBRES_TIPO_VELA[tipo]);
    const dt = seccion.querySelector('[data-resumen="presentacion"]')?.previousElementSibling;
    if (dt) dt.textContent = tipo === 'molde' ? 'Molde' : 'Tamaño';
    mostrarPresentacion();
  }

  /** Tamaño en la vista previa y el marmoleado, solo si esta presentación lo admite. */
  function mostrarPresentacion() {
    const presentacion = elegido('presentacion');
    if (!presentacion) return;
    tamanoPorTipo.set(tipoActual(), presentacion.value);
    resumen('presentacion', presentacion.dataset.texto ?? presentacion.value);
    vista.style.setProperty('--escala', presentacion.dataset.escala ?? '1');

    const marmoleable = presentacion.hasAttribute('data-marmoleable');
    campoMarmol.hidden = !marmoleable;
    sinMarmol.hidden = marmoleable;
    sinMarmol.textContent =
      tipoActual() === 'jicara' ? 'En jícara no se hace marmoleada: no se apreciaría.' : 'Esta vela no se hace marmoleada.';
    mostrarMarmol();
  }

  /** Las vetas no pueden ser del mismo color que la vela. */
  function mostrarMarmol() {
    const color = elegido('color');
    for (const veta of formulario.querySelectorAll<HTMLInputElement>('input[name="colorMarmoleado"]')) {
      veta.disabled = veta.value === color?.value;
      if (veta.disabled && veta.checked) {
        veta.checked = false;
        formulario.querySelector<HTMLInputElement>('input[name="colorMarmoleado"]:not(:disabled)')!.checked = true;
      }
    }
    const activo = !campoMarmol.hidden && casillaMarmol.checked;
    const veta = elegido('colorMarmoleado');
    vetas.hidden = !casillaMarmol.checked;
    vista.toggleAttribute('data-marmol', activo);
    if (veta?.dataset.hex) vista.style.setProperty('--veta', veta.dataset.hex);
    resumen('marmoleado', activo && veta ? `Sí, con ${veta.value.toLowerCase()}` : 'No');
  }

  function actualizarOpcion(input: HTMLInputElement) {
    if (input.name === 'tipo') return mostrarTipo();
    if (input.name === 'presentacion') return mostrarPresentacion();
    if (input.name === 'colorMarmoleado' || input.name === 'marmoleado') return mostrarMarmol();
    resumen(input.name, input.value);
    if (input.name === 'color' && input.dataset.hex) {
      vista.style.setProperty('--vela', input.dataset.hex);
      mostrarMarmol();
    }
    if (input.name === 'topping' && input.dataset.figura) {
      vista.querySelectorAll<SVGElement>('[data-topping]').forEach((g) => {
        g.toggleAttribute('data-activa', g.dataset.topping === input.dataset.figura);
      });
    }
  }

  function mostrarCantidad() {
    const n = Number(cantidad.value);
    resumen('cantidad', Number.isInteger(n) && n >= 1 ? String(n) : '—');
  }

  function sincronizarVista() {
    mostrarTipo();
    for (const nombre of ['color', 'aroma', 'topping']) {
      const input = elegido(nombre);
      if (input) actualizarOpcion(input);
    }
    mostrarCantidad();
  }

  function mostrarError(campo: CampoVela, mensaje?: string) {
    const error = seccion.querySelector<HTMLElement>(`[data-error="${campo}"]`);
    if (error) {
      error.textContent = mensaje ?? '';
      error.hidden = !mensaje;
    }
    const texto = formulario.querySelector<HTMLInputElement>(`[data-campo="${campo}"]:is(input:not([type="radio"]), textarea)`);
    if (texto) texto.setAttribute('aria-invalid', String(Boolean(mensaje)));
  }

  function primerControl(campo: CampoVela) {
    return elegido(campo) ?? formulario.querySelector<HTMLInputElement>(`[name="${campo}"]:not(:disabled)`);
  }

  function ocupado(si: boolean) {
    enviar.disabled = si;
    formulario.setAttribute('aria-busy', String(si));
    textoEnviar.textContent = si ? 'Mandando…' : textoOriginal;
  }

  function terminar(titulo: string, texto: string, enlaceWhatsApp: string) {
    $<HTMLElement>('[data-listo-titulo]').textContent = titulo;
    $<HTMLElement>('[data-listo-texto]').textContent = texto;
    $<HTMLAnchorElement>('[data-listo-whatsapp]').href = enlaceWhatsApp;
    formulario.hidden = true;
    listo.hidden = false;
    listo.focus();
  }

  async function mandar(pedido: PedidoVela) {
    if (!cliente) {
      const enlace = pedidos.vela(pedido);
      window.open(enlace, '_blank', 'noopener');
      terminar('¡Ya casi!', 'Te abrimos WhatsApp con tu pedido; solo envía el mensaje. Si no se abrió, toca el botón.', enlace);
      return;
    }

    ocupado(true);
    try {
      const { id } = await cliente.enviar(pedido);
      const cuales = pedido.cantidad === 1 ? 'Tu vela estará lista' : 'Tus velas estarán listas';
      terminar(
        `¡Recibimos tu pedido #${id}!`,
        `Te escribimos pronto a ${pedido.clienteContacto} para confirmar el precio. ${cuales} en ${sitio.velas.entrega}.`,
        pedidos.vela(pedido, id),
      );
    } catch (error) {
      aviso.textContent = error instanceof ErrorPedido ? error.message : 'Algo salió mal. Intenta de nuevo o mándanoslo por WhatsApp.';
      aviso.hidden = false;
      porWhatsApp.href = pedidos.vela(pedido);
      porWhatsApp.hidden = false;
    } finally {
      ocupado(false);
    }
  }

  formulario.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type === 'radio' || input.type === 'checkbox') {
      actualizarOpcion(input);
      mostrarError(input.name as CampoVela);
    }
    if (input.name === 'cantidad') mostrarCantidad();
  });

  formulario.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'cantidad') mostrarCantidad();
    if (input.getAttribute('aria-invalid') === 'true') mostrarError(input.name as CampoVela);
  });

  for (const boton of $$<HTMLButtonElement>('[data-cantidad]')) {
    boton.addEventListener('click', () => {
      const actual = Number.parseInt(cantidad.value, 10) || 1;
      cantidad.value = String(Math.min(MAX_CANTIDAD_VELAS, Math.max(1, actual + Number(boton.dataset.cantidad))));
      mostrarCantidad();
      mostrarError('cantidad');
    });
  }

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviar.disabled) return;
    aviso.hidden = true;
    porWhatsApp.hidden = true;

    const datos = Object.fromEntries(new FormData(formulario)) as Partial<Record<CampoVela | 'marmoleado', unknown>>;
    const marmoleable = Boolean(elegido('presentacion')?.hasAttribute('data-marmoleable'));
    const revision = revisarPedidoVela(datos, { marmoleable });
    for (const campo of CAMPOS_VELA) mostrarError(campo, revision.valido ? undefined : revision.errores[campo]);
    if (!revision.valido) {
      const primero = CAMPOS_VELA.find((c) => revision.errores[c]);
      if (primero) primerControl(primero)?.focus();
      return;
    }
    void mandar(revision.pedido);
  });

  $<HTMLButtonElement>('[data-otro]').addEventListener('click', () => {
    formulario.reset();
    tamanoPorTipo.clear();
    sincronizarVista();
    listo.hidden = true;
    formulario.hidden = false;
    primerControl('tipo')?.focus();
  });

  // Al volver con "atrás", el navegador puede recordar otras opciones elegidas.
  sincronizarVista();
}

document.querySelectorAll<HTMLFormElement>('[data-vela]').forEach(iniciarVela);
