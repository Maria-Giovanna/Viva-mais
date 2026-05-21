/**
 * js/auth.js
 * Controla o fluxo de login.
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

  function bloquearSenha() {
    senhaInput.value = "";
    senhaInput.disabled = true;
    btnSubmit.disabled = true;
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
        "CPF inválido. Confira se você digitou corretamente.";
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
      cpfError.textContent = "Não encontramos uma conta ativa com este CPF.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearSenha();
      return;
    }

    cpfError.hidden = true;
    senhaInput.disabled = false;
    btnSubmit.disabled = false;
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
      cpfError.textContent = "Não encontramos uma conta ativa com este CPF.";
      cpfError.hidden = false;
      cpfInput.focus();
      return;
    }

    if (usuarioEncontrado.senha !== senhaDigitada) {
      senhaError.textContent =
        "A senha digitada não confere. Lembre-se que sua senha deve ter 8 números.";
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
      localStorage.setItem(
        "viva_theme",
        usuarioEncontrado.preferencias.tema || "light",
      );
      localStorage.setItem(
        "viva_fontsize",
        usuarioEncontrado.preferencias.tamanhoFonte || "standard",
      );
    }

    window.location.href = "home.html";
  });
});
