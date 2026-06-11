(function () {
  "use strict";

  /*
    perfil.js
    Controla toda a pagina de Perfil:
    - menu de perfil;
    - visualizacao e edicao de dados;
    - preferencias de acessibilidade;
    - alteracao de senha;
    - saida da conta.
  */
  const estadoPerfil = {
    usuario: null,
    usuarioEditado: null,
    tamanhoFonteSelecionado: "standard",
  };

  document.addEventListener("DOMContentLoaded", iniciarPerfil);

  function iniciarPerfil() {
    const usuarioLogado = obterUsuarioLogado();

    if (!usuarioLogado) {
      window.location.href = "login.html";
      return;
    }

    estadoPerfil.usuario = obterUsuarioCompleto(usuarioLogado);

    configurarEventos();
    prepararAlertasAcessiveis();
    renderizarUsuario();
    sincronizarPreferenciasNaTela();
    mostrarEtapa("step-menu");
  }

  function obterUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("viva_usuario_logado") || "null");
  }

  /*
    Junta os dados da sessão com os dados salvos no localStorage.
    Isso garante que alterações de perfil apareçam mesmo após navegar entre páginas.
  */
  function obterUsuarioCompleto(usuarioLogado) {
    const usuarios = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");

    const usuarioLocal = usuarios.find((usuario) => {
      return usuario.cpf === usuarioLogado.cpf;
    });

    const usuario = {
      ...usuarioLogado,
      ...(usuarioLocal || {}),
    };

    return normalizarUsuario(usuario);
  }

  /*
    Corrige/garante a estrutura esperada do usuario.
    O erro principal do arquivo anterior estava aqui:
    havia um trecho solto com "tamanhoFonte:" fora de qualquer funcao,
    causando erro de execucao e impedindo os cliques do perfil.
  */
  function normalizarUsuario(usuario) {
    const preferencias = usuario.preferencias || {};

    return {
      ...usuario,
      preferencias: {
        tema:
          preferencias.tema || localStorage.getItem("viva_theme") || "light",
        tamanhoFonte: normalizarTamanhoFonte(
          preferencias.tamanhoFonte ||
            localStorage.getItem("viva_fontsize") ||
            "standard",
        ),
        leitorTela:
          preferencias.leitorTela ??
          (localStorage.getItem("viva_screen_reader") === "true"),
        botoesGrandes:
          preferencias.botoesGrandes ??
          (localStorage.getItem("viva_large_buttons") === "true"),
        modoCores:
          preferencias.modoCores ||
          localStorage.getItem("viva_color_mode") ||
          "default",
      },
    };
  }

  /*
    Configura todos os eventos.
    A navegação por data-profile-target usa delegação de evento para ser mais resistente:
    mesmo clicando em ícones/textos internos do card, o clique funciona.
  */
  function configurarEventos() {
    document.addEventListener("click", (evento) => {
      const botaoComAlvo = evento.target.closest("[data-profile-target]");

      if (botaoComAlvo) {
        const idEtapa = botaoComAlvo.dataset.profileTarget;

        if (idEtapa) {
          mostrarEtapa(idEtapa);
        }
      }
    });

    escutarClique("btn-voltar", voltar);
    escutarClique("btn-sair", sair);

    escutarClique("btn-editar-dados", () => {
      preencherFormularioEdicao();
      mostrarEtapa("step-editar-dados");
    });

    escutarClique("btn-voltar-edicao", () => {
      mostrarEtapa("step-editar-dados");
    });

    escutarClique("btn-confirmar-dados", salvarDadosEditados);

    escutarClique("btn-voltar-dados", () => {
      renderizarUsuario();
      mostrarEtapa("step-dados");
    });

    escutarClique("btn-voltar-inicio-dados", () => {
      renderizarUsuario();
      mostrarEtapa("step-menu");
    });

    escutarClique("btn-voltar-perfil-senha", () => {
      mostrarEtapa("step-menu");
    });

    escutarClique("toggle-contraste", alternarAltoContraste);
    escutarClique("toggle-escuro", alternarTemaEscuro);
    escutarClique("toggle-leitor", alternarLeitorTela);
    escutarClique("toggle-botoes", alternarBotoesGrandes);

    document.querySelectorAll("[data-font-option]").forEach((botao) => {
      botao.addEventListener("click", () => {
        selecionarTamanhoFonte(botao.dataset.fontOption);
      });
    });

    document.querySelectorAll("[data-color-option]").forEach((botao) => {
      botao.addEventListener("click", () => {
        selecionarModoCores(botao.dataset.colorOption);
      });
    });

    document.addEventListener("viva:a11ychange", () => {
      sincronizarPreferenciasNaTela();
    });

    escutarClique("btn-salvar-fonte", salvarTamanhoFonte);

    const formDados = document.getElementById("form-dados");
    if (formDados) {
      formDados.addEventListener("submit", prepararAlteracaoDados);
    }

    const formSenha = document.getElementById("form-senha");
    if (formSenha) {
      formSenha.addEventListener("submit", alterarSenha);
    }
  }

  function escutarClique(id, acao) {
    const elemento = document.getElementById(id);

    if (!elemento) {
      console.warn(`Elemento não encontrado: #${id}`);
      return;
    }

    elemento.addEventListener("click", acao);
  }

  function prepararAlertasAcessiveis() {
    ["erro-dados", "erro-senha"].forEach((id) => {
      const erro = document.getElementById(id);

      if (!erro) return;

      erro.setAttribute("role", "alert");
      erro.setAttribute("aria-live", "assertive");
      erro.setAttribute("aria-atomic", "true");
    });
  }

  function renderizarUsuario() {
    const usuario = estadoPerfil.usuario;

    definirTexto("perfil-nome", usuario.nomeCompleto || "Usuário");
    definirTexto("perfil-cpf", formatarCPF(usuario.cpf));
    definirTexto("avatar-inicial", obterInicial(usuario.nomeCompleto));
    renderizarFotoPerfil(usuario);

    definirTexto("dados-nome", usuario.nomeCompleto || "Não informado");
    definirTexto("dados-cpf", formatarCPF(usuario.cpf));
    definirTexto(
      "dados-endereco",
      usuario.endereco || "Endereço não informado",
    );
    definirTexto("dados-telefone", formatarTelefone(usuario.telefone));
  }

  function renderizarFotoPerfil(usuario) {
    const imagem = document.getElementById("avatar-foto");
    const inicial = document.getElementById("avatar-inicial");
    const caminhoFoto = usuario.fotoPerfil || usuario.foto || "";

    if (!imagem || !inicial) return;

    if (caminhoFoto) {
      imagem.src = caminhoFoto;
      imagem.alt = "";
      imagem.hidden = false;
      imagem.setAttribute("aria-hidden", "true");
      inicial.hidden = true;
      inicial.setAttribute("aria-hidden", "true");
      return;
    }

    imagem.hidden = true;
    imagem.setAttribute("aria-hidden", "true");
    imagem.removeAttribute("src");
    inicial.hidden = false;
    inicial.setAttribute("aria-hidden", "false");
  }

  function definirTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor;
    }
  }

  function preencherFormularioEdicao() {
    const cpfInput = document.getElementById("edit-cpf");
    const nomeInput = document.getElementById("edit-nome");
    const enderecoInput = document.getElementById("edit-endereco");
    const telefoneInput = document.getElementById("edit-telefone");

    if (cpfInput) cpfInput.value = formatarCPF(estadoPerfil.usuario.cpf);
    if (nomeInput) nomeInput.value = estadoPerfil.usuario.nomeCompleto || "";
    if (enderecoInput)
      enderecoInput.value = estadoPerfil.usuario.endereco || "";
    if (telefoneInput)
      telefoneInput.value = estadoPerfil.usuario.telefone || "";
  }

  function prepararAlteracaoDados(evento) {
    evento.preventDefault();

    const endereco = document.getElementById("edit-endereco").value.trim();
    const telefone = document.getElementById("edit-telefone").value.trim();
    const erro = document.getElementById("erro-dados");

    erro.hidden = true;

    if (!endereco || !telefone) {
      erro.textContent =
        "Para salvar seus dados, preencha endereço e telefone. Esses campos ajudam a unidade a confirmar seu atendimento, se necessário.";
      erro.hidden = false;
      return;
    }

    estadoPerfil.usuarioEditado = {
      endereco,
      telefone: telefone.replace(/\D/g, ""),
    };

    mostrarEtapa("step-confirmar-dados");
  }

  function salvarDadosEditados() {
    if (!estadoPerfil.usuarioEditado) return;

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      ...estadoPerfil.usuarioEditado,
      atualizadoEm: new Date().toISOString(),
    };

    salvarUsuario(usuarioAtualizado);

    estadoPerfil.usuario = usuarioAtualizado;
    estadoPerfil.usuarioEditado = null;

    mostrarEtapa("step-dados-sucesso");
  }

  function alterarSenha(evento) {
    evento.preventDefault();

    const nascimento = document
      .getElementById("confirmar-nascimento")
      .value.trim();
    const novaSenha = document.getElementById("nova-senha").value.trim();
    const confirmaSenha = document
      .getElementById("confirma-senha")
      .value.trim();
    const erro = document.getElementById("erro-senha");
    const campoNascimento = document.getElementById("confirmar-nascimento");
    const campoNovaSenha = document.getElementById("nova-senha");
    const campoConfirmaSenha = document.getElementById("confirma-senha");

    erro.hidden = true;
    campoNascimento?.setAttribute("aria-invalid", "false");
    campoNovaSenha?.setAttribute("aria-invalid", "false");
    campoConfirmaSenha?.setAttribute("aria-invalid", "false");

    if (
      normalizarDataBR(nascimento) !==
      normalizarDataBR(estadoPerfil.usuario.dataNascimento)
    ) {
      erro.textContent =
        "A data de nascimento não confere com seu cadastro. Digite no formato DD/MM/AAAA e confira dia, mês e ano.";
      erro.hidden = false;
      campoNascimento?.setAttribute("aria-invalid", "true");
      campoNascimento?.focus();
      return;
    }

    if (!/^\d{8}$/.test(novaSenha)) {
      erro.textContent =
        "A nova senha precisa ter exatamente 8 números. Digite somente números, sem espaços.";
      erro.hidden = false;
      campoNovaSenha?.setAttribute("aria-invalid", "true");
      campoNovaSenha?.focus();
      return;
    }

    if (ehSenhaInsegura(novaSenha)) {
      erro.textContent =
        "Esta senha é muito fácil de adivinhar. Evite números repetidos ou sequências, como 12345678.";
      erro.hidden = false;
      campoNovaSenha?.setAttribute("aria-invalid", "true");
      campoNovaSenha?.focus();
      return;
    }

    if (novaSenha !== confirmaSenha) {
      erro.textContent =
        "As senhas digitadas não são iguais. Repita exatamente a mesma senha nos dois campos.";
      erro.hidden = false;
      campoConfirmaSenha?.setAttribute("aria-invalid", "true");
      campoConfirmaSenha?.focus();
      return;
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      senha: novaSenha,
      senhaAtualizadaEm: new Date().toISOString(),
    };

    salvarUsuario(usuarioAtualizado);

    estadoPerfil.usuario = usuarioAtualizado;

    evento.target.reset();

    mostrarEtapa("step-senha-sucesso");
  }

  function normalizarDataBR(data) {
    return String(data || "").replace(/\D/g, "");
  }

  function ehSenhaInsegura(senha) {
    if (/^(\d)\1{7}$/.test(senha)) {
      return true;
    }

    let crescente = true;
    let decrescente = true;

    for (let i = 1; i < senha.length; i++) {
      const atual = Number(senha[i]);
      const anterior = Number(senha[i - 1]);

      if (atual !== anterior + 1) {
        crescente = false;
      }

      if (atual !== anterior - 1) {
        decrescente = false;
      }
    }

    return crescente || decrescente;
  }

  function sincronizarPreferenciasNaTela() {
    const configuracoes = window.getVivaAccessibilitySettings
      ? window.getVivaAccessibilitySettings()
      : {
          theme: localStorage.getItem("viva_theme") || "light",
          fontSize:
            localStorage.getItem("viva_fontsize") ||
            estadoPerfil.usuario.preferencias?.tamanhoFonte ||
            "standard",
          screenReader:
            localStorage.getItem("viva_screen_reader") === "true" ||
            estadoPerfil.usuario.preferencias?.leitorTela ||
            false,
          largeButtons:
            localStorage.getItem("viva_large_buttons") === "true" ||
            estadoPerfil.usuario.preferencias?.botoesGrandes ||
            false,
          colorMode:
            localStorage.getItem("viva_color_mode") ||
            estadoPerfil.usuario.preferencias?.modoCores ||
            "default",
        };

    const tema = configuracoes.theme;
    const tamanhoFonte = normalizarTamanhoFonte(configuracoes.fontSize);
    const leitorTela = configuracoes.screenReader;
    const botoesGrandes = configuracoes.largeButtons;

    estadoPerfil.tamanhoFonteSelecionado = tamanhoFonte;

    atualizarSwitch("toggle-contraste", tema === "high-contrast");
    atualizarSwitch("toggle-escuro", tema === "dark");
    atualizarSwitch("toggle-leitor", leitorTela);
    atualizarSwitch("toggle-botoes", botoesGrandes);

    marcarTamanhoFonte(tamanhoFonte);
    marcarModoCores(configuracoes.colorMode || "default");
  }

  function alternarAltoContraste() {
    const temaAtual = localStorage.getItem("viva_theme") || "light";
    const novoTema = temaAtual === "high-contrast" ? "light" : "high-contrast";

    salvarPreferenciaTema(novoTema);
    sincronizarPreferenciasNaTela();
  }

  function alternarTemaEscuro() {
    const temaAtual = localStorage.getItem("viva_theme") || "light";
    const novoTema = temaAtual === "dark" ? "light" : "dark";

    salvarPreferenciaTema(novoTema);
    sincronizarPreferenciasNaTela();
  }

  function alternarLeitorTela() {
    const atual = window.getVivaAccessibilitySettings
      ? window.getVivaAccessibilitySettings().screenReader
      : localStorage.getItem("viva_screen_reader") === "true";
    const novoValor = !atual;

    if (window.setVivaScreenReader) {
      window.setVivaScreenReader(novoValor, true);
    } else {
      document.documentElement.setAttribute(
        "data-screen-reader",
        novoValor ? "true" : "false",
      );

      localStorage.setItem("viva_screen_reader", novoValor ? "true" : "false");
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      preferencias: {
        ...estadoPerfil.usuario.preferencias,
        leitorTela: novoValor,
      },
    };

    salvarUsuario(usuarioAtualizado);
    estadoPerfil.usuario = usuarioAtualizado;
    sincronizarPreferenciasNaTela();
  }

  function alternarBotoesGrandes() {
    const atual = window.getVivaAccessibilitySettings
      ? window.getVivaAccessibilitySettings().largeButtons
      : localStorage.getItem("viva_large_buttons") === "true";
    const novoValor = !atual;

    if (window.setVivaLargeButtons) {
      window.setVivaLargeButtons(novoValor);
    } else {
      document.documentElement.setAttribute(
        "data-large-buttons",
        novoValor ? "true" : "false",
      );
      localStorage.setItem("viva_large_buttons", novoValor ? "true" : "false");
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      preferencias: {
        ...estadoPerfil.usuario.preferencias,
        botoesGrandes: novoValor,
      },
    };

    salvarUsuario(usuarioAtualizado);
    estadoPerfil.usuario = usuarioAtualizado;
    sincronizarPreferenciasNaTela();
  }

  function salvarPreferenciaTema(tema) {
    if (window.setVivaTheme) {
      window.setVivaTheme(tema);
    } else {
      document.documentElement.setAttribute("data-theme", tema);
      localStorage.setItem("viva_theme", tema);
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      preferencias: {
        ...estadoPerfil.usuario.preferencias,
        tema,
      },
    };

    salvarUsuario(usuarioAtualizado);
    estadoPerfil.usuario = usuarioAtualizado;
  }

  function selecionarTamanhoFonte(tamanho) {
    estadoPerfil.tamanhoFonteSelecionado = normalizarTamanhoFonte(tamanho);
    marcarTamanhoFonte(estadoPerfil.tamanhoFonteSelecionado);
  }

  function marcarTamanhoFonte(tamanho) {
    const tamanhoNormalizado = normalizarTamanhoFonte(tamanho);

    document.querySelectorAll("[data-font-option]").forEach((botao) => {
      const selecionado = botao.dataset.fontOption === tamanhoNormalizado;
      botao.classList.toggle("selected", selecionado);
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });
  }

  function salvarTamanhoFonte() {
    const tamanho = normalizarTamanhoFonte(
      estadoPerfil.tamanhoFonteSelecionado || "standard",
    );

    if (window.setVivaFontSize) {
      window.setVivaFontSize(tamanho);
    } else {
      document.documentElement.setAttribute("data-fontsize", tamanho);
      localStorage.setItem("viva_fontsize", tamanho);
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      preferencias: {
        ...estadoPerfil.usuario.preferencias,
        tamanhoFonte: tamanho,
      },
    };

    salvarUsuario(usuarioAtualizado);
    estadoPerfil.usuario = usuarioAtualizado;
    sincronizarPreferenciasNaTela();
    mostrarEtapa("step-acessibilidade");
  }

  function selecionarModoCores(modo) {
    const modoNormalizado = normalizarModoCores(modo);

    if (window.setVivaColorMode) {
      window.setVivaColorMode(modoNormalizado);
    } else {
      document.documentElement.setAttribute("data-color-mode", modoNormalizado);
      localStorage.setItem("viva_color_mode", modoNormalizado);
    }

    const usuarioAtualizado = {
      ...estadoPerfil.usuario,
      preferencias: {
        ...estadoPerfil.usuario.preferencias,
        modoCores: modoNormalizado,
      },
    };

    salvarUsuario(usuarioAtualizado);
    estadoPerfil.usuario = usuarioAtualizado;
    sincronizarPreferenciasNaTela();
  }

  function marcarModoCores(modo) {
    const modoNormalizado = normalizarModoCores(modo);

    document.querySelectorAll("[data-color-option]").forEach((botao) => {
      const selecionado = botao.dataset.colorOption === modoNormalizado;
      botao.classList.toggle("selected", selecionado);
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });
  }

  function atualizarSwitch(id, ativo) {
    const botao = document.getElementById(id);

    if (!botao) return;

    if (!botao.dataset.switchLabel) {
      botao.dataset.switchLabel =
        botao
          .getAttribute("aria-label")
          ?.replace(/^(Ativar|Desativar)\s+/i, "") || "Opção";
    }

    botao.setAttribute("aria-checked", ativo ? "true" : "false");
    botao.setAttribute(
      "aria-label",
      `${botao.dataset.switchLabel} ${ativo ? "ativada" : "desativada"}`,
    );
  }

  function salvarUsuario(usuarioAtualizado) {
    const usuarios = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");

    const existe = usuarios.some((usuario) => {
      return usuario.cpf === usuarioAtualizado.cpf;
    });

    const atualizados = existe
      ? usuarios.map((usuario) => {
          if (usuario.cpf === usuarioAtualizado.cpf) {
            return usuarioAtualizado;
          }

          return usuario;
        })
      : [...usuarios, usuarioAtualizado];

    localStorage.setItem("viva_usuarios", JSON.stringify(atualizados));
    sessionStorage.setItem(
      "viva_usuario_logado",
      JSON.stringify(usuarioAtualizado),
    );
  }

  function voltar() {
    const etapaAtual = document.querySelector(".profile-step:not([hidden])");

    if (!etapaAtual || etapaAtual.id === "step-menu") {
      window.location.href = "home.html";
      return;
    }

    if (
      etapaAtual.id === "step-editar-dados" ||
      etapaAtual.id === "step-acessibilidade" ||
      etapaAtual.id === "step-senha"
    ) {
      mostrarEtapa("step-menu");
      return;
    }

    if (etapaAtual.id === "step-tamanho-texto") {
      mostrarEtapa("step-acessibilidade");
      return;
    }

    if (etapaAtual.id === "step-confirmar-dados") {
      mostrarEtapa("step-editar-dados");
      return;
    }

    mostrarEtapa("step-menu");
  }

  function mostrarEtapa(idEtapa) {
    const etapa = document.getElementById(idEtapa);

    if (!etapa) {
      console.error(`Etapa não encontrada: #${idEtapa}`);
      return;
    }

    document.querySelectorAll(".profile-step").forEach((secao) => {
      secao.hidden = true;
      secao.setAttribute("aria-hidden", "true");
    });

    etapa.hidden = false;
    etapa.setAttribute("aria-hidden", "false");

    const titulo = etapa.querySelector("h1, h2");

    if (titulo) {
      titulo.setAttribute("tabindex", "-1");
      titulo.focus();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    window.vivaA11y?.ativarEtapa(etapa);
  }

  function sair() {
    sessionStorage.removeItem("viva_usuario_logado");
    window.location.href = "login.html";
  }

  function obterInicial(nome) {
    return String(nome || "U")
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  function formatarTelefone(telefone) {
    const numeros = String(telefone || "").replace(/\D/g, "");

    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
    }

    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return telefone || "Telefone não informado";
  }

  function normalizarTamanhoFonte(tamanho) {
    if (["small", "standard", "medium", "large"].includes(tamanho)) {
      return tamanho;
    }

    return "standard";
  }

  function normalizarModoCores(modo) {
    const aliases = {
      "colorblind-safe": "deuteranopia",
      "blue-orange": "deuteranopia",
      "purple-green": "tritanopia",
    };
    const modoNormalizado = aliases[modo] || modo;

    if (["default", "deuteranopia", "tritanopia", "achromatopsia"].includes(modoNormalizado)) {
      return modoNormalizado;
    }

    return "default";
  }
})();
