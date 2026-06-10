/*
  recuperar-senha.js
  Controla a recuperacao de senha em etapas:
  - confirma CPF;
  - valida data de nascimento;
  - salva a nova senha do usuario no banco simulado.
*/
document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("etapa-1");
  const step2 = document.getElementById("etapa-2");
  const step3 = document.getElementById("etapa-3");
  const step4 = document.getElementById("etapa-4");

  const cpfInput = document.getElementById("cpf-recuperacao");
  const cpfError = document.getElementById("erro-cpf");
  const nascInput = document.getElementById("nascimento-recuperacao");
  const nascError = document.getElementById("erro-nascimento");
  const senhaInput = document.getElementById("nova-senha");
  const confirmaInput = document.getElementById("confirma-senha");
  const senhaError = document.getElementById("erro-senha");

  if (!step1 || !step2 || !step3 || !step4) return;

  let usuarioEncontrado = null;

  [step1, step2, step3, step4].forEach((etapa) => {
    const oculta = etapa.hidden || etapa.classList.contains("hidden");
    etapa.setAttribute("aria-hidden", oculta ? "true" : "false");
  });

  [cpfError, nascError, senhaError].forEach((erro) => {
    if (!erro) return;
    erro.setAttribute("role", "alert");
    erro.setAttribute("aria-live", "assertive");
    erro.setAttribute("aria-atomic", "true");
  });

  function trocarEtapa(etapaSaindo, etapaEntrando) {
    etapaSaindo.hidden = true;
    etapaSaindo.disabled = true;
    etapaSaindo.setAttribute("aria-hidden", "true");
    etapaEntrando.hidden = false;
    etapaEntrando.disabled = false;
    etapaEntrando.removeAttribute("disabled");
    etapaEntrando.setAttribute("aria-hidden", "false");

    window.vivaA11y?.ativarEtapa(etapaEntrando);
  }

  document.getElementById("btn-avancar-1").addEventListener("click", async () => {
    await (window.vivaDBReady || Promise.resolve());

    cpfError.hidden = true;
    cpfInput.setAttribute("aria-invalid", "false");

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");

    if (!validarCPF(cpfLimpo)) {
      cpfError.textContent =
        "Não conseguimos validar este CPF. Digite os 11 números e confira se não faltou nenhum dígito.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      cpfInput.focus();
      return;
    }

    const usuariosBD = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");
    usuarioEncontrado = usuariosBD.find((u) => u.cpf === cpfLimpo);

    if (!usuarioEncontrado) {
      cpfError.textContent =
        "Não encontramos uma conta ativa com este CPF. Confira os números digitados ou ative seu acesso se ainda não tiver cadastro.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      cpfInput.focus();
      return;
    }

    trocarEtapa(step1, step2);
  });

  document.getElementById("btn-avancar-2").addEventListener("click", () => {
    nascError.hidden = true;
    nascInput.setAttribute("aria-invalid", "false");

    const nascimentoDigitado = nascInput.value.trim();

    if (usuarioEncontrado && usuarioEncontrado.dataNascimento === nascimentoDigitado) {
      trocarEtapa(step2, step3);
      return;
    }

    nascError.textContent =
      "A data de nascimento não confere com este CPF. Digite no formato DD/MM/AAAA e confira dia, mês e ano.";
    nascError.hidden = false;
    nascInput.setAttribute("aria-invalid", "true");
    nascInput.focus();
  });

  document.getElementById("btn-finalizar").addEventListener("click", () => {
    senhaError.hidden = true;
    senhaInput.setAttribute("aria-invalid", "false");
    confirmaInput.setAttribute("aria-invalid", "false");

    const novaSenha = senhaInput.value.trim();
    const confirmaSenha = confirmaInput.value.trim();
    const validacao = validarSenhaNumerica(novaSenha);

    if (!validacao.valida) {
      senhaError.textContent = validacao.mensagem;
      senhaError.hidden = false;
      senhaInput.setAttribute("aria-invalid", "true");
      senhaInput.focus();
      return;
    }

    if (novaSenha !== confirmaSenha) {
      senhaError.textContent =
        "As senhas precisam ser iguais e ter 8 números. Evite sequências, como 12345678, ou números repetidos.";
      senhaError.hidden = false;
      confirmaInput.setAttribute("aria-invalid", "true");
      confirmaInput.focus();
      return;
    }

    const usuariosBD = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");
    const usuariosAtualizados = usuariosBD.map((u) =>
      u.cpf === usuarioEncontrado.cpf ? { ...u, senha: novaSenha } : u
    );

    localStorage.setItem("viva_usuarios", JSON.stringify(usuariosAtualizados));
    trocarEtapa(step3, step4);
  });

  document.querySelectorAll(".btn-voltar-etapa").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!step2.hidden) trocarEtapa(step2, step1);
      else if (!step3.hidden) trocarEtapa(step3, step2);
    });
  });
});
