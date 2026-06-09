/*
  cadastro.js
  Controla o cadastro em etapas:
  - valida CPF e convenio;
  - coleta dados pessoais e senha;
  - revisa as informacoes;
  - salva o novo usuario no banco simulado.
*/
document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("etapa-1");
  const step2 = document.getElementById("etapa-2");
  const step3 = document.getElementById("etapa-3");
  const step4 = document.getElementById("etapa-4");

  const cpfInput = document.getElementById("cpf-cadastro");
  const cpfError = document.getElementById("cpf-cadastro-error");
  const fieldsetDados = document.getElementById("dados-convenio");
  const inputNome = document.getElementById("nome");
  const inputDataNasc = document.getElementById("data-nascimento");
  const inputEndereco = document.getElementById("endereco");
  const inputNovaSenha = document.getElementById("nova-senha");
  const inputConfirmaSenha = document.getElementById("confirma-senha");
  const senhaMatchError = document.getElementById("senha-match-error");
  const btnProximaEtapa = document.getElementById("btn-proxima-etapa");
  const btnVoltarEtapa1 = document.getElementById("btn-voltar-1");
  const btnIrRevisao = document.getElementById("btn-ir-revisao");
  const btnVoltarEtapa2 = document.getElementById("btn-voltar-2");
  const btnFinalizar = document.getElementById("btn-finalizar");

  if (
    !step1 ||
    !step2 ||
    !step3 ||
    !step4 ||
    !cpfInput ||
    !fieldsetDados ||
    !btnProximaEtapa
  )
    return;

  let tempUserData = null;
  btnProximaEtapa.disabled = true;

  function mostrarEtapa(etapaAtual, proximaEtapa) {
    if (!etapaAtual || !proximaEtapa) return;

    etapaAtual.classList.add("hidden");
    etapaAtual.setAttribute("aria-hidden", "true");

    proximaEtapa.classList.remove("hidden");
    proximaEtapa.setAttribute("aria-hidden", "false");

    const foco = proximaEtapa.querySelector("button, input, a");
    if (foco) foco.focus();
  }

  function bloquearDados() {
    tempUserData = null;
    fieldsetDados.setAttribute("disabled", "true");
    fieldsetDados.setAttribute("aria-hidden", "true");
    btnProximaEtapa.disabled = true;

    inputNome.value = "";
    inputDataNasc.value = "";
    inputEndereco.value = "";
    inputNovaSenha.value = "";
    inputConfirmaSenha.value = "";
  }

  function salvarRascunhoCadastro() {
    if (!tempUserData) return;

    sessionStorage.setItem(
      "viva_cadastro_temp",
      JSON.stringify({
        ...tempUserData,
        senha: inputNovaSenha.value.trim(),
      }),
    );
  }

  function recuperarRascunhoCadastro() {
    if (tempUserData) return tempUserData;

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");

    const rascunho = JSON.parse(
      sessionStorage.getItem("viva_cadastro_temp") || "null",
    );

    if (rascunho && rascunho.cpf === cpfLimpo) {
      tempUserData = rascunho;
      return tempUserData;
    }

    const conveniosBD = JSON.parse(
      localStorage.getItem("viva_convenios") || "[]",
    );
    const dadosConvenio = conveniosBD.find((conv) => {
      return conv.cpf === cpfLimpo && conv.planoAtivo;
    });

    if (!dadosConvenio) return null;

    tempUserData = { ...dadosConvenio };
    delete tempUserData.planoAtivo;
    tempUserData.senha = inputNovaSenha.value.trim();

    return tempUserData;
  }

  function preencherRevisao() {
    const usuarioTemporario = recuperarRascunhoCadastro();

    if (!usuarioTemporario) {
      mostrarEtapa(step2, step1);
      cpfError.textContent =
        "Não foi possivel recuperar os dados do cadastro. Confira o CPF informado e tente novamente.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      cpfInput.focus();
      return false;
    }

    const opcaoSelecionada = document.querySelector(
      'input[name="acessibilidade"]:checked',
    );

    const acessibilidadeEscolhida = opcaoSelecionada
      ? opcaoSelecionada.value
      : "standard";

    tempUserData = {
      ...usuarioTemporario,
      preferencias: {
        ...(usuarioTemporario.preferencias || {}),
        tema: localStorage.getItem("viva_theme") || "light",
        tamanhoFonte: acessibilidadeEscolhida,
        botoesGrandes: localStorage.getItem("viva_large_buttons") === "true",
        leitorTela: localStorage.getItem("viva_screen_reader") === "true",
        modoCores: localStorage.getItem("viva_color_mode") || "default",
      },
    };

    document.getElementById("rev-cpf").textContent = cpfInput.value;
    document.getElementById("rev-nome").textContent =
      tempUserData.nomeCompleto || "";
    document.getElementById("rev-data").textContent =
      tempUserData.dataNascimento || "";
    document.getElementById("rev-endereco").textContent =
      tempUserData.endereco || "";

    salvarRascunhoCadastro();
    return true;
  }

  function irParaRevisao(evento) {
    if (evento) {
      evento.preventDefault();
    }

    if (!preencherRevisao()) return;

    mostrarEtapa(step2, step3);
  }

  function validarSenhasRealTime() {
    const s1 = inputNovaSenha.value.trim();
    const s2 = inputConfirmaSenha.value.trim();

    senhaMatchError.hidden = true;
    inputNovaSenha.setAttribute("aria-invalid", "false");
    inputConfirmaSenha.setAttribute("aria-invalid", "false");
    btnProximaEtapa.disabled = true;

    if (!tempUserData) return false;
    if (s1.length === 0 && s2.length === 0) return false;

    const validacao = validarSenhaNumerica(s1);
    if (!validacao.valida) {
      senhaMatchError.textContent = validacao.mensagem;
      senhaMatchError.hidden = false;
      inputNovaSenha.setAttribute("aria-invalid", "true");
      return false;
    }

    if (s2.length > 0 && s1 !== s2) {
      senhaMatchError.textContent =
        "A senha precisa ter 8 números e os dois campos devem ser iguais. Não use sequencias ou números repetidos.";
      senhaMatchError.hidden = false;
      inputConfirmaSenha.setAttribute("aria-invalid", "true");
      return false;
    }

    if (s1 === s2 && s2.length === 8) {
      btnProximaEtapa.disabled = false;
      return true;
    }

    return false;
  }

  inputNovaSenha.addEventListener("input", validarSenhasRealTime);
  inputConfirmaSenha.addEventListener("input", validarSenhasRealTime);

  cpfInput.addEventListener("blur", async () => {
    await (window.vivaDBReady || Promise.resolve());

    const cpfLimpo = cpfInput.value.replace(/\D/g, "");
    cpfError.hidden = true;
    cpfInput.setAttribute("aria-invalid", "false");

    if (cpfLimpo.length === 0) {
      bloquearDados();
      return;
    }

    if (!validarCPF(cpfLimpo)) {
      cpfError.textContent =
        "Nao conseguimos validar este CPF. Confira se digitou os 11 numeros corretamente, sem pontos ou tracos.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearDados();
      return;
    }

    const usuariosBD = JSON.parse(
      localStorage.getItem("viva_usuarios") || "[]",
    );
    if (usuariosBD.find((user) => user.cpf === cpfLimpo)) {
      cpfError.innerHTML =
        "Este CPF ja possui uma conta no Viva+. Use a tela de login ou <a href='recuperar-senha.html'>recupere sua senha</a> se nao lembrar o acesso.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearDados();
      return;
    }

    const conveniosBD = JSON.parse(
      localStorage.getItem("viva_convenios") || "[]",
    );
    const dadosConvenio = conveniosBD.find(
      (conv) => conv.cpf === cpfLimpo && conv.planoAtivo,
    );

    if (!dadosConvenio) {
      cpfError.textContent =
        "Nao encontramos um plano ativo para este CPF. Confira se o CPF esta correto ou fale com o atendimento do seu convenio antes de continuar.";
      cpfError.hidden = false;
      cpfInput.setAttribute("aria-invalid", "true");
      bloquearDados();
      return;
    }

    inputNome.value = dadosConvenio.nomeCompleto;
    inputDataNasc.value = dadosConvenio.dataNascimento;
    inputEndereco.value = dadosConvenio.endereco;

    fieldsetDados.removeAttribute("disabled");
    fieldsetDados.setAttribute("aria-hidden", "false");

    tempUserData = { ...dadosConvenio };
    delete tempUserData.planoAtivo;

    btnProximaEtapa.disabled = true;
    inputNovaSenha.focus();
  });

  btnProximaEtapa.addEventListener("click", () => {
    if (!validarSenhasRealTime() || !tempUserData) return;

    tempUserData.senha = inputNovaSenha.value.trim();
    salvarRascunhoCadastro();
    mostrarEtapa(step1, step2);
  });

  if (btnVoltarEtapa1) {
    btnVoltarEtapa1.addEventListener("click", () => {
      mostrarEtapa(step2, step1);
    });
  }

  if (btnIrRevisao) {
    btnIrRevisao.addEventListener("click", irParaRevisao);
  }

  /*
    Fallback em captura: garante que o botão de próxima etapa funcione
    mesmo se outro script interferir na etapa de acessibilidade.
  */
  document.addEventListener(
    "click",
    (evento) => {
      const botao =
        evento.target.closest && evento.target.closest("#btn-ir-revisao");

      if (!botao) return;

      evento.stopPropagation();

      irParaRevisao(evento);
    },
    true,
  );

  window.vivaCadastroIrRevisao = irParaRevisao;

  if (btnVoltarEtapa2) {
    btnVoltarEtapa2.addEventListener("click", () => {
      mostrarEtapa(step3, step2);
    });
  }

  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
      const usuariosBD = JSON.parse(
        localStorage.getItem("viva_usuarios") || "[]",
      );

      if (usuariosBD.some((user) => user.cpf === tempUserData.cpf)) {
        window.location.href = "login.html";
        return;
      }

      usuariosBD.push(tempUserData);
      localStorage.setItem("viva_usuarios", JSON.stringify(usuariosBD));

      localStorage.setItem("viva_theme", tempUserData.preferencias.tema);
      localStorage.setItem(
        "viva_fontsize",
        tempUserData.preferencias.tamanhoFonte,
      );
      localStorage.setItem(
        "viva_accessibility_settings",
        JSON.stringify({
          theme: tempUserData.preferencias.tema,
          fontSize: tempUserData.preferencias.tamanhoFonte,
          largeButtons: tempUserData.preferencias.botoesGrandes,
          screenReader: tempUserData.preferencias.leitorTela,
          colorMode: tempUserData.preferencias.modoCores || "default",
        }),
      );
      localStorage.setItem(
        "viva_large_buttons",
        tempUserData.preferencias.botoesGrandes ? "true" : "false",
      );
      localStorage.setItem(
        "viva_screen_reader",
        tempUserData.preferencias.leitorTela ? "true" : "false",
      );
      localStorage.setItem(
        "viva_color_mode",
        tempUserData.preferencias.modoCores || "default",
      );

      mostrarEtapa(step3, step4);

      const sidebar = document.querySelector(".auth-sidebar");
      if (sidebar) sidebar.classList.add("hidden");
    });
  }
});
