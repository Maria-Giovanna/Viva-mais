/*
  auth.js
  Controla o login:
  - valida o CPF;
  - libera o campo de senha apenas quando o CPF existe;
  - grava o usuario logado no sessionStorage.
*/
document.addEventListener("DOMContentLoaded", () => {
  const cpfInput = document.getElementById("cpf");
  const formLogin = document.getElementById("form-login");
  const senhaInput = document.getElementById("senha");
  const cpfError = document.getElementById("cpf-error");
  const senhaError = document.getElementById("senha-error");
  const btnSubmit = formLogin
    ? formLogin.querySelector('button[type="submit"]')
    : null;

  if (
    !cpfInput ||
    !formLogin ||
    !senhaInput ||
    !cpfError ||
    !senhaError ||
    !btnSubmit
  )
    return;

  senhaInput.disabled = true;
  btnSubmit.disabled = true;
  senhaInput.setAttribute("aria-disabled", "true");
  btnSubmit.setAttribute("aria-disabled", "true");

  [cpfError, senhaError].forEach((erro) => {
    erro.setAttribute("role", "alert");
    erro.setAttribute("aria-live", "assertive");
    erro.setAttribute("aria-atomic", "true");
  });

  function bloquearSenha() {
    senhaInput.value = "";
    senhaInput.disabled = true;
    btnSubmit.disabled = true;
    senhaInput.setAttribute("aria-disabled", "true");
    btnSubmit.setAttribute("aria-disabled", "true");
  }

  cpfInput.addEventListener("input", async () => {
    await (window.vivaDBReady || Promise.resolve());

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    cpfInput.setAttribute("aria-invalid", "false");
    senhaInput.setAttribute("aria-invalid", "false");
    senhaError.hidden = true;

    if (cpfLimpo.length < 11) {
      cpfError.hidden = true;
      bloquearSenha();
      return;
    }

    if (!validarCPF(cpfLimpo)) {
      cpfError.textContent =
        "Não conseguimos validar este CPF. Digite os 11 números e confira se não faltou nenhum dígito.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearSenha();
      return;
    }

    const usuariosBD = JSON.parse(
      localStorage.getItem("viva_usuarios") || "[]",
    );
    const usuarioEncontrado = usuariosBD.find((user) => user.cpf === cpfLimpo);

    if (!usuarioEncontrado) {
      cpfError.textContent =
        "Não encontramos uma conta ativa com este CPF. Confira os números digitados ou escolha “Ativar meu acesso” se ainda não tiver cadastro.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearSenha();
      return;
    }

    cpfError.hidden = true;
    senhaInput.disabled = false;
    btnSubmit.disabled = false;
    senhaInput.setAttribute("aria-disabled", "false");
    btnSubmit.setAttribute("aria-disabled", "false");
    window.vivaA11y?.anunciar("CPF encontrado. Digite sua senha para entrar.");
    senhaInput.focus();
  });

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    await (window.vivaDBReady || Promise.resolve());

    senhaError.hidden = true;
    senhaInput.setAttribute("aria-invalid", "false");

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    const senhaDigitada = senhaInput.value.trim();
    const usuariosBD = JSON.parse(
      localStorage.getItem("viva_usuarios") || "[]",
    );
    const usuarioEncontrado = usuariosBD.find((user) => user.cpf === cpfLimpo);

    if (!usuarioEncontrado) {
      cpfError.textContent =
        "Não encontramos uma conta ativa com este CPF. Confira os números digitados ou escolha “Ativar meu acesso” se ainda não tiver cadastro.";
      cpfError.hidden = false;
      cpfInput.focus();
      return;
    }

    if (usuarioEncontrado.senha !== senhaDigitada) {
      senhaError.textContent =
        "A senha digitada não confere. Digite novamente sua senha de 8 números ou use “Esqueci minha senha” para criar uma nova.";
      senhaError.hidden = false;
      senhaInput.setAttribute("aria-invalid", "true");
      senhaInput.focus();
      return;
    }

    sessionStorage.setItem(
      "viva_usuario_logado",
      JSON.stringify(usuarioEncontrado),
    );

    if (usuarioEncontrado.preferencias) {
      const preferenciasAcessibilidade = {
        theme: usuarioEncontrado.preferencias.tema || "light",
        fontSize: usuarioEncontrado.preferencias.tamanhoFonte || "standard",
        largeButtons: Boolean(usuarioEncontrado.preferencias.botoesGrandes),
        screenReader: Boolean(usuarioEncontrado.preferencias.leitorTela),
        colorMode: usuarioEncontrado.preferencias.modoCores || "default",
      };

      localStorage.setItem(
        "viva_accessibility_settings",
        JSON.stringify(preferenciasAcessibilidade),
      );
      localStorage.setItem("viva_theme", preferenciasAcessibilidade.theme);
      localStorage.setItem("viva_fontsize", preferenciasAcessibilidade.fontSize);
      localStorage.setItem(
        "viva_large_buttons",
        preferenciasAcessibilidade.largeButtons ? "true" : "false",
      );
      localStorage.setItem(
        "viva_screen_reader",
        preferenciasAcessibilidade.screenReader ? "true" : "false",
      );
      localStorage.setItem("viva_color_mode", preferenciasAcessibilidade.colorMode);
    }

    window.location.href = "home.html";
  });
});
