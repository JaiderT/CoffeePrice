export function abrirGuiaKaffi(guideId, extra = {}) {
  window.dispatchEvent(
    new CustomEvent("kaffi-guide", {
      detail: { guideId, ...extra },
    })
  );
}

export function enviarMensajeKaffi(mensaje, extra = {}) {
  window.dispatchEvent(
    new CustomEvent("kaffi-message", {
      detail: { mensaje, ...extra },
    })
  );
}
