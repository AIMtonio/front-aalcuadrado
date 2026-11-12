/**
 * Formulario "Arma tu kit": actualiza la vista previa y el resumen al elegir,
 * revisa el pedido y lo manda a la API, o por WhatsApp si no hay API o falla.
 */
import { CAMPOS_KIT, revisarPedido, type CampoKit, type PedidoKit } from '@/domain/kits';
import { ClienteEncargos, ErrorPedido } from '@/services/encargos';
import { sitio } from '@/config/sitio';
import { pedidos } from '@/services/pedidos';

function iniciarKit(formulario: HTMLFormElement) {
  const seccion = formulario.closest('section')!;
  const $ = <T extends Element>(selector: string) => seccion.querySelector<T>(selector)!;
  const cliente = formulario.dataset.api ? new ClienteEncargos(formulario.dataset.api, 'kit') : null;

  const vista = $<SVGElement>('[data-vista-kit]');
  const aviso = $<HTMLElement>('[data-aviso]');
  const enviar = $<HTMLButtonElement>('[data-enviar]');
  const textoEnviar = $<HTMLElement>('[data-enviar-texto]');
  const porWhatsApp = $<HTMLAnchorElement>('[data-whatsapp]');
  const listo = $<HTMLElement>('[data-listo]');
  const textoOriginal = textoEnviar.textContent ?? '';

  /** Colores y figuras de la vista previa, y el texto del resumen. */
  function actualizarVista(input: HTMLInputElement) {
    const campo = input.name as CampoKit;
    const resumen = seccion.querySelector(`[data-resumen="${campo}"]`);
    if (resumen) resumen.textContent = input.value;

    if (input.dataset.hex) {
      vista.style.setProperty(campo === 'jabonColor' ? '--jabon' : '--vela', input.dataset.hex);
    }
    if (input.dataset.figura) {
      const grupo = campo === 'jabonForma' ? 'forma' : 'topping';
      vista.querySelectorAll<SVGElement>(`[data-${grupo}]`).forEach((g) => {
        g.toggleAttribute('data-activa', g.dataset[grupo] === input.dataset.figura);
      });
    }
  }

  function sincronizarVista() {
    formulario.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked').forEach(actualizarVista);
  }

  function mostrarError(campo: CampoKit, mensaje?: string) {
    const error = seccion.querySelector<HTMLElement>(`[data-error="${campo}"]`);
    if (error) {
      error.textContent = mensaje ?? '';
      error.hidden = !mensaje;
    }
    const texto = formulario.querySelector<HTMLInputElement>(`input[type="text"][name="${campo}"]`);
    if (texto) texto.setAttribute('aria-invalid', String(Boolean(mensaje)));
  }

  function primerControl(campo: CampoKit) {
    return (
      formulario.querySelector<HTMLInputElement>(`[name="${campo}"]:checked`) ??
      formulario.querySelector<HTMLInputElement>(`[name="${campo}"]`)
    );
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

  async function mandar(pedido: PedidoKit) {
    if (!cliente) {
      const enlace = pedidos.kit(pedido);
      window.open(enlace, '_blank', 'noopener');
      terminar('¡Ya casi!', 'Te abrimos WhatsApp con tu pedido; solo envía el mensaje. Si no se abrió, toca el botón.', enlace);
      return;
    }

    ocupado(true);
    try {
      const { id } = await cliente.enviar(pedido);
      terminar(
        `¡Recibimos tu pedido #${id}!`,
        `Te escribimos pronto a ${pedido.clienteContacto} para confirmar el precio. Tu kit estará listo en ${sitio.kits.entrega}.`,
        pedidos.kit(pedido, id),
      );
    } catch (error) {
      aviso.textContent = error instanceof ErrorPedido ? error.message : 'Algo salió mal. Intenta de nuevo o mándanoslo por WhatsApp.';
      aviso.hidden = false;
      porWhatsApp.href = pedidos.kit(pedido);
      porWhatsApp.hidden = false;
    } finally {
      ocupado(false);
    }
  }

  formulario.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type === 'radio') {
      actualizarVista(input);
      mostrarError(input.name as CampoKit);
    }
  });

  formulario.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type === 'text' && input.getAttribute('aria-invalid') === 'true') mostrarError(input.name as CampoKit);
  });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviar.disabled) return;
    aviso.hidden = true;
    porWhatsApp.hidden = true;

    const datos = Object.fromEntries(new FormData(formulario)) as Partial<Record<CampoKit, unknown>>;
    const revision = revisarPedido(datos);
    for (const campo of CAMPOS_KIT) mostrarError(campo, revision.valido ? undefined : revision.errores[campo]);
    if (!revision.valido) {
      const primero = CAMPOS_KIT.find((c) => revision.errores[c]);
      if (primero) primerControl(primero)?.focus();
      return;
    }
    void mandar(revision.pedido);
  });

  $<HTMLButtonElement>('[data-otro]').addEventListener('click', () => {
    formulario.reset();
    sincronizarVista();
    listo.hidden = true;
    formulario.hidden = false;
    primerControl('jabonColor')?.focus();
  });

  // Al volver con "atrás", el navegador puede recordar otras opciones elegidas.
  sincronizarVista();
}

document.querySelectorAll<HTMLFormElement>('[data-kit]').forEach(iniciarKit);
