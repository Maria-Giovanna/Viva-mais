/**
 * js/recuperar-senha.js
 * Controla o fluxo de recuperação de senha.
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

  function trocarEtapa(etapaSaindo, etapaEntrando) {
    etapaSaindo.hidden = true;
    etapaSaindo.disabled = true;
    etapaEntrando.hidden = false;
    etapaEntrando.disabled = false;

    const foco = etapaEntrando.querySelector("input, button, a");
    if (foco) foco.focus();
  }

  document.getElementById("btn-avancar-1").addEventListener("click", async () => {
    await (window.vivaDBReady || Promise.resolve());

    cpfError.hidden = true;
    cpfInput.setAttribute("aria-invalid", "false");

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");

    if (!validarCPF(cpfLimpo)) {
      cpfError.textContent = "CPF inválido. Confira se você digitou todos os números corretamente.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      cpfInput.focus();
      return;
    }

    const usuariosBD = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");
    usuarioEncontrado = usuariosBD.find((u) => u.cpf === cpfLimpo);

    if (!usuarioEncontrado) {
      cpfError.textContent = "Não encontramos um cadastro com este CPF no Viva+.";
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
      senhaError.textContent = "As senhas digitadas não são iguais.";
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
