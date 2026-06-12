(function () {
  "use strict";

  const SIGNATURE_ID = "maria-giovanna-developer-signature";

  function criarAssinatura() {
    if (document.getElementById(SIGNATURE_ID)) return;

    const assinatura = document.createElement("aside");
    assinatura.id = SIGNATURE_ID;
    assinatura.className = "developer-signature";
    assinatura.setAttribute("role", "img");
    assinatura.setAttribute(
      "aria-label",
      "Assinatura visual de Maria Giovanna, front-end developer.",
    );
    assinatura.setAttribute("draggable", "false");
    assinatura.dataset.signature = "Maria-Giovanna-front-end-developer";
    assinatura.dataset.project = "Viva-mais";

    assinatura.addEventListener("dragstart", bloquearCopiaCasual);
    assinatura.addEventListener("contextmenu", bloquearCopiaCasual);
    assinatura.addEventListener("copy", bloquearCopiaCasual);

    document.body.appendChild(assinatura);
  }

  function bloquearCopiaCasual(evento) {
    evento.preventDefault();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", criarAssinatura);
  } else {
    criarAssinatura();
  }
})();
