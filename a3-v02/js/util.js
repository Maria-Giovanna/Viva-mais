/*
  util.js
  Funcoes globais usadas nas paginas de login, cadastro e perfil:
  validacao de CPF, mascaras de campos, distancia entre unidades e toggle de senha.
*/

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function ordenarUnidadesPorDistancia(unidades, latUsuario, lonUsuario) {
  return unidades
    .map((unidade) => ({
      ...unidade,
      distanciaKm: calcularDistancia(latUsuario, lonUsuario, unidade.lat, unidade.lon),
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

function validarCPF(cpf) {
  cpf = String(cpf).replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11), 10)) return false;

  return true;
}

function formatarCPF(valor) {
  const apenasNumeros = String(valor).replace(/\D/g, "").slice(0, 11);

  if (apenasNumeros.length > 9) {
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }

  if (apenasNumeros.length > 6) {
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  }

  if (apenasNumeros.length > 3) {
    return apenasNumeros.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  }

  return apenasNumeros;
}

function formatarDataBR(valor) {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 8);

  if (numeros.length > 4) {
    return numeros.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
  }

  if (numeros.length > 2) {
    return numeros.replace(/(\d{2})(\d{1,2})/, "$1/$2");
  }

  return numeros;
}

function ehSequenciaNumerica(senha) {
  if (!/^\d+$/.test(senha) || senha.length < 2) return false;

  let crescente = true;
  let decrescente = true;

  for (let i = 1; i < senha.length; i++) {
    const atual = Number(senha[i]);
    const anterior = Number(senha[i - 1]);

    if (atual !== anterior + 1 && !(anterior === 9 && atual === 0)) {
      crescente = false;
    }

    if (atual !== anterior - 1 && !(anterior === 0 && atual === 9)) {
      decrescente = false;
    }
  }

  return crescente || decrescente;
}

function validarSenhaNumerica(senha) {
  const senhaLimpa = String(senha).trim();

  if (!/^\d{8}$/.test(senhaLimpa)) {
    return {
      valida: false,
      mensagem: "A senha deve ter exatamente 8 números.",
    };
  }

  if (/^(\d)\1{7}$/.test(senhaLimpa) || ehSequenciaNumerica(senhaLimpa)) {
    return {
      valida: false,
      mensagem: "Por segurança, evite números repetidos ou em sequência.",
    };
  }

  return { valida: true, mensagem: "" };
}

function mostrarAvisoSomenteNumeros(inputElement) {
  const container = inputElement.closest(".form-group");
  const spanErro = container ? container.querySelector(".field-error") : null;

  if (!spanErro) return;

  const mensagemOriginal = spanErro.dataset.textoOriginal || spanErro.textContent;
  spanErro.dataset.textoOriginal = mensagemOriginal;
  spanErro.setAttribute("role", "alert");
  spanErro.setAttribute("aria-live", "assertive");
  spanErro.setAttribute("aria-atomic", "true");
  spanErro.textContent = "Digite apenas números. A pontuação será aplicada automaticamente.";
  spanErro.hidden = false;

  window.clearTimeout(spanErro._timerAvisoNumeros);
  spanErro._timerAvisoNumeros = window.setTimeout(() => {
    spanErro.hidden = true;
    spanErro.textContent = mensagemOriginal;
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest(".btn-toggle-password");
    if (!toggleBtn) return;

    e.preventDefault();

    const container = toggleBtn.closest(".input-container");
    const input = container ? container.querySelector("input") : null;
    if (!input) return;

    const senhaEstaOculta = input.type === "password";
    input.type = senhaEstaOculta ? "text" : "password";
    input.classList.add("has-password-toggle");
    toggleBtn.setAttribute("aria-pressed", senhaEstaOculta ? "true" : "false");
    toggleBtn.setAttribute(
      "aria-label",
      senhaEstaOculta ? "Ocultar senha" : "Mostrar senha escrita como texto"
    );
    input.focus();
  });

  document.addEventListener("input", (e) => {
    const campo = e.target;
    if (!(campo instanceof HTMLInputElement)) return;

    if (campo.name === "cpf" || campo.id.toLowerCase().includes("cpf")) {
      if (e.data && /[^0-9]/.test(e.data)) {
        mostrarAvisoSomenteNumeros(campo);
      }
      campo.value = formatarCPF(campo.value);
    }

    if (campo.dataset.mask === "date-br") {
      if (e.data && /[^0-9]/.test(e.data)) {
        mostrarAvisoSomenteNumeros(campo);
      }
      campo.value = formatarDataBR(campo.value);
    }

    if (campo.dataset.onlyNumbers === "true") {
      if (e.data && /[^0-9]/.test(e.data)) {
        mostrarAvisoSomenteNumeros(campo);
      }
      campo.value = campo.value.replace(/\D/g, "");
    }
  });
});
