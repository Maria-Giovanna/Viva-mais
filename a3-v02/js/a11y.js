(function () {
  "use strict";

  /*
    a11y.js
    Aplica as preferencias de acessibilidade em todas as paginas:
    - tema claro, escuro e alto contraste;
    - tamanho da fonte;
    - botoes grandes;
    - leitura assistida em voz alta;
    - modos de cor para diferentes tipos de daltonismo.

    As escolhas ficam no localStorage e tambem podem ser copiadas
    para o usuario logado no banco simulado.
  */

  const STORAGE_KEY = "viva_accessibility_settings";
  const DEFAULT_SETTINGS = {
    theme: "light",
    fontSize: "standard",
    largeButtons: false,
    screenReader: false,
    colorMode: "default",
  };

  const LABELS = {
    theme: {
      light: "tema claro",
      dark: "tema escuro",
      "high-contrast": "tema alto contraste",
    },
    fontSize: {
      small: "fonte pequena",
      standard: "fonte padrao",
      medium: "fonte media",
      large: "fonte grande",
    },
    colorMode: {
      default: "cores padrao",
      deuteranopia: "vermelho e verde parecidos",
      tritanopia: "azul e amarelo parecidos",
      achromatopsia: "pouca ou nenhuma cor",
    },
  };
  let leitorAssistidoAtivo = false;
  let eventosLeitorConfigurados = false;
  let ultimaFala = "";
  let ultimoMomentoFala = 0;

  document.addEventListener("DOMContentLoaded", aplicarAcessibilidadeSalva);

  /*
    Aplica as preferencias salvas assim que qualquer pagina do sistema carrega.
    Isso garante que o usuario mantenha suas configuracoes ao navegar.
  */
  function aplicarAcessibilidadeSalva() {
    const configuracoes = obterConfiguracoesAtuais();

    aplicarConfiguracoes(configuracoes, {
      deveSalvarUsuario: false,
      deveFalarLeitor: false,
      deveDispararEvento: false,
    });

    criarPainelRapidoAcessibilidade();
    sincronizarPainelRapidoAcessibilidade();
  }

  function obterConfiguracoesAtuais() {
    const salvas = lerJSONLocalStorage(STORAGE_KEY, null);
    const usuario = JSON.parse(
      sessionStorage.getItem("viva_usuario_logado") || "null",
    );
    const preferenciasUsuario = usuario?.preferencias || {};
    const deveIniciarComFontePadrao = !usuario;

    const legadas = {
      theme:
        localStorage.getItem("viva_theme") ||
        preferenciasUsuario.tema ||
        undefined,
      fontSize: deveIniciarComFontePadrao
        ? DEFAULT_SETTINGS.fontSize
        : localStorage.getItem("viva_fontsize") ||
          preferenciasUsuario.tamanhoFonte ||
          undefined,
      largeButtons:
        localStorage.getItem("viva_large_buttons") !== null
          ? localStorage.getItem("viva_large_buttons") === "true"
          : preferenciasUsuario.botoesGrandes,
      screenReader:
        localStorage.getItem("viva_screen_reader") !== null
          ? localStorage.getItem("viva_screen_reader") === "true"
          : preferenciasUsuario.leitorTela,
      colorMode:
        localStorage.getItem("viva_color_mode") ||
        preferenciasUsuario.modoCores ||
        undefined,
    };

    const configuracoesCombinadas = {
      ...DEFAULT_SETTINGS,
      ...legadas,
      ...(salvas || {}),
    };

    if (deveIniciarComFontePadrao) {
      configuracoesCombinadas.fontSize = DEFAULT_SETTINGS.fontSize;
    }

    return normalizarConfiguracoes(configuracoesCombinadas);
  }

  function lerJSONLocalStorage(chave, fallback) {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : fallback;
    } catch (erro) {
      console.warn(`Nao foi possivel ler ${chave}.`, erro);
      return fallback;
    }
  }

  function normalizarConfiguracoes(configuracoes) {
    const temasPermitidos = ["light", "dark", "high-contrast"];
    const tamanhosPermitidos = ["small", "standard", "medium", "large"];
    const modosPermitidos = [
      "default",
      "deuteranopia",
      "tritanopia",
      "achromatopsia",
    ];
    const aliasesModoCores = {
      "colorblind-safe": "deuteranopia",
      "blue-orange": "deuteranopia",
      "purple-green": "tritanopia",
    };
    const modoRecebido =
      aliasesModoCores[configuracoes.colorMode] || configuracoes.colorMode;

    return {
      theme: temasPermitidos.includes(configuracoes.theme)
        ? configuracoes.theme
        : DEFAULT_SETTINGS.theme,
      fontSize: tamanhosPermitidos.includes(configuracoes.fontSize)
        ? configuracoes.fontSize
        : DEFAULT_SETTINGS.fontSize,
      largeButtons: Boolean(configuracoes.largeButtons),
      screenReader: Boolean(configuracoes.screenReader),
      colorMode: modosPermitidos.includes(modoRecebido)
        ? modoRecebido
        : DEFAULT_SETTINGS.colorMode,
    };
  }

  function atualizarConfiguracoes(
    alteracoes,
    deveSalvarUsuario = true,
    deveFalarLeitor = true,
  ) {
    const configuracoes = normalizarConfiguracoes({
      ...obterConfiguracoesAtuais(),
      ...alteracoes,
    });

    aplicarConfiguracoes(configuracoes, {
      deveSalvarUsuario,
      deveFalarLeitor,
      deveDispararEvento: true,
    });
  }

  function aplicarConfiguracoes(
    configuracoes,
    { deveSalvarUsuario, deveFalarLeitor, deveDispararEvento },
  ) {
    const configuracoesFinais = normalizarConfiguracoes(configuracoes);
    const leitorAnterior = leitorAssistidoAtivo;

    leitorAssistidoAtivo = configuracoesFinais.screenReader;

    document.documentElement.setAttribute("data-theme", configuracoesFinais.theme);
    document.documentElement.setAttribute(
      "data-fontsize",
      configuracoesFinais.fontSize,
    );
    document.documentElement.setAttribute(
      "data-large-buttons",
      configuracoesFinais.largeButtons ? "true" : "false",
    );
    document.documentElement.setAttribute(
      "data-screen-reader",
      configuracoesFinais.screenReader ? "true" : "false",
    );
    document.documentElement.setAttribute(
      "data-color-mode",
      configuracoesFinais.colorMode,
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(configuracoesFinais));
    localStorage.setItem("viva_theme", configuracoesFinais.theme);
    localStorage.setItem("viva_fontsize", configuracoesFinais.fontSize);
    localStorage.setItem(
      "viva_large_buttons",
      configuracoesFinais.largeButtons ? "true" : "false",
    );
    localStorage.setItem(
      "viva_screen_reader",
      configuracoesFinais.screenReader ? "true" : "false",
    );
    localStorage.setItem("viva_color_mode", configuracoesFinais.colorMode);

    if (deveSalvarUsuario) {
      salvarPreferenciasNoUsuario({
        tema: configuracoesFinais.theme,
        tamanhoFonte: configuracoesFinais.fontSize,
        botoesGrandes: configuracoesFinais.largeButtons,
        leitorTela: configuracoesFinais.screenReader,
        modoCores: configuracoesFinais.colorMode,
      });
    }

    if (configuracoesFinais.screenReader) {
      configurarEventosLeitorAssistido();

      if (deveFalarLeitor && !leitorAnterior) {
        falarTexto("Leitura em voz alta ativada.");
      }
    } else {
      pararLeitura();

      if (deveFalarLeitor && leitorAnterior) {
        falarTexto("Leitura em voz alta desativada.");
      }
    }

    sincronizarPainelRapidoAcessibilidade();

    if (deveDispararEvento) {
      document.dispatchEvent(
        new CustomEvent("viva:a11ychange", { detail: configuracoesFinais }),
      );
    }
  }

  /*
    Aplica o tema visual no elemento <html>.
    O CSS reage ao atributo data-theme.
  */
  function aplicarTema(tema, deveSalvarUsuario = true) {
    atualizarConfiguracoes({ theme: tema }, deveSalvarUsuario);
  }

  /*
    Aplica o tamanho da fonte no elemento <html>.
    O CSS reage ao atributo data-fontsize.
  */
  function aplicarTamanhoFonte(tamanho, deveSalvarUsuario = true) {
    atualizarConfiguracoes({ fontSize: tamanho }, deveSalvarUsuario);
  }

  /*
    Ativa ou desativa botoes grandes no sistema inteiro.
    O CSS reage ao atributo data-large-buttons.
  */
  function aplicarBotoesGrandes(ativo, deveSalvarUsuario = true) {
    atualizarConfiguracoes({ largeButtons: ativo }, deveSalvarUsuario);
  }

  /*
    Ativa ou desativa a leitura assistida em voz alta.
    Essa funcao usa a API speechSynthesis do navegador.
  */
  function aplicarLeitorAssistido(
    ativo,
    deveFalarConfirmacao = true,
    deveSalvarUsuario = true,
  ) {
    atualizarConfiguracoes(
      { screenReader: ativo },
      deveSalvarUsuario,
      deveFalarConfirmacao,
    );
  }

  function aplicarModoCores(modo, deveSalvarUsuario = true) {
    atualizarConfiguracoes({ colorMode: modo }, deveSalvarUsuario);
  }

  /*
    Cria um atalho visivel de acessibilidade no desktop.
    Ele evita que o usuario precise entrar em Perfil para ajustar fonte,
    tema, contraste, botoes grandes ou leitura assistida.
  */
  function criarPainelRapidoAcessibilidade() {
    if (document.getElementById("quick-a11y")) return;

    const painel = document.createElement("aside");
    painel.id = "quick-a11y";
    painel.className = "quick-a11y";
    painel.setAttribute("aria-label", "Atalho de acessibilidade");

    painel.innerHTML = `
      <button
        type="button"
        class="quick-a11y-toggle"
        id="quick-a11y-toggle"
        aria-label="Acessibilidade"
        aria-expanded="false"
        aria-controls="quick-a11y-panel"
      >
        <span class="quick-a11y-toggle-icon" aria-hidden="true">Aa</span>
        <span class="quick-a11y-toggle-text">Acessibilidade</span>
      </button>

      <div class="quick-a11y-panel" id="quick-a11y-panel" role="dialog" aria-modal="false" aria-labelledby="quick-a11y-title" aria-describedby="quick-a11y-desc" hidden>
        <div class="quick-a11y-header">
          <div>
            <strong id="quick-a11y-title">Ajustar tela</strong>
            <small id="quick-a11y-desc">Escolha como prefere visualizar o sistema.</small>
          </div>

          <button
            type="button"
            class="quick-a11y-close"
            id="quick-a11y-close"
            aria-label="Fechar painel de acessibilidade"
          >
            X
          </button>
        </div>

        <section class="quick-a11y-section" aria-labelledby="quick-a11y-font-title">
          <h2 id="quick-a11y-font-title">Tamanho do texto</h2>

          <div class="quick-a11y-options quick-a11y-options-grid" role="group" aria-label="Tamanho do texto">
            <button type="button" class="quick-a11y-option" data-quick-font="small">Pequeno</button>
            <button type="button" class="quick-a11y-option" data-quick-font="standard">Padrao</button>
            <button type="button" class="quick-a11y-option" data-quick-font="medium">Medio</button>
            <button type="button" class="quick-a11y-option" data-quick-font="large">Grande</button>
          </div>
        </section>

        <section class="quick-a11y-section" aria-labelledby="quick-a11y-theme-title">
          <h2 id="quick-a11y-theme-title">Tema</h2>

          <div class="quick-a11y-options" role="group" aria-label="Tema visual">
            <button type="button" class="quick-a11y-option" data-quick-theme="light">Claro</button>
            <button type="button" class="quick-a11y-option" data-quick-theme="dark">Escuro</button>
            <button type="button" class="quick-a11y-option" data-quick-theme="high-contrast">Alto contraste</button>
          </div>
        </section>

        <section class="quick-a11y-section" aria-labelledby="quick-a11y-support-title">
          <h2 id="quick-a11y-support-title">Apoio</h2>

          <div class="quick-a11y-support-list">
            <button type="button" class="quick-a11y-support" data-quick-toggle="large-buttons" role="switch" aria-checked="false">
              <span>Botoes grandes</span>
              <strong>Desligado</strong>
            </button>

            <button type="button" class="quick-a11y-support" data-quick-toggle="screen-reader" role="switch" aria-checked="false">
              <span>Leitura em voz alta</span>
              <strong>Desligado</strong>
            </button>
          </div>
        </section>

        <section class="quick-a11y-section" aria-labelledby="quick-a11y-color-title">
          <h2 id="quick-a11y-color-title">Modo de cores</h2>

          <div class="quick-a11y-options quick-a11y-options-grid" role="group" aria-label="Modo de cores">
            <button type="button" class="quick-a11y-option" data-quick-color="default">Padrao</button>
            <button type="button" class="quick-a11y-option" data-quick-color="deuteranopia">Vermelho/verde</button>
            <button type="button" class="quick-a11y-option" data-quick-color="tritanopia">Azul/amarelo</button>
            <button type="button" class="quick-a11y-option" data-quick-color="achromatopsia">Tons de cinza</button>
          </div>
        </section>
      </div>
    `;

    /*
      Coloca o atalho de acessibilidade no slot do cabecalho quando ele existir.
      Assim, em telas como a Home, os botoes "Sair" e "Acessibilidade"
      ficam no mesmo grupo visual e se ajustam juntos.

      Nas paginas que nao possuem esse slot, o painel continua funcionando
      como botao flutuante no canto superior direito.
    */
    const slotAcessibilidade = document.getElementById("a11y-shortcut-slot");

    if (slotAcessibilidade) {
      painel.classList.add("quick-a11y--header");
      slotAcessibilidade.appendChild(painel);
    } else {
      painel.classList.add("quick-a11y--floating");
      document.body.appendChild(painel);
    }

    const botaoAbrir = painel.querySelector("#quick-a11y-toggle");
    const botaoFechar = painel.querySelector("#quick-a11y-close");
    const painelConteudo = painel.querySelector("#quick-a11y-panel");

    botaoAbrir.addEventListener("click", () => {
      const estaAberto = !painelConteudo.hidden;
      alternarPainelRapidoAcessibilidade(!estaAberto);
    });

    botaoFechar.addEventListener("click", () => {
      alternarPainelRapidoAcessibilidade(false);
      botaoAbrir.focus();
    });

    painel.querySelectorAll("[data-quick-font]").forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarTamanhoFonte(botao.dataset.quickFont);
        sincronizarPainelRapidoAcessibilidade();
      });
    });

    painel.querySelectorAll("[data-quick-theme]").forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarTema(botao.dataset.quickTheme);
        sincronizarPainelRapidoAcessibilidade();
      });
    });

    painel.querySelectorAll("[data-quick-toggle]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const tipo = botao.dataset.quickToggle;
        const ativoAtual = botao.getAttribute("aria-checked") === "true";

        if (tipo === "large-buttons") {
          aplicarBotoesGrandes(!ativoAtual);
        }

        if (tipo === "screen-reader") {
          aplicarLeitorAssistido(!ativoAtual);
        }

        sincronizarPainelRapidoAcessibilidade();
      });
    });

    painel.querySelectorAll("[data-quick-color]").forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarModoCores(botao.dataset.quickColor);
        sincronizarPainelRapidoAcessibilidade();
      });
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") {
        alternarPainelRapidoAcessibilidade(false);
      }
    });

    document.addEventListener("click", (evento) => {
      const painelAtual = document.getElementById("quick-a11y");

      if (!painelAtual || painelAtual.contains(evento.target)) return;

      alternarPainelRapidoAcessibilidade(false);
    });
  }

  function alternarPainelRapidoAcessibilidade(deveAbrir) {
    const painel = document.getElementById("quick-a11y-panel");
    const botao = document.getElementById("quick-a11y-toggle");

    if (!painel || !botao) return;

    painel.hidden = !deveAbrir;
    botao.setAttribute("aria-expanded", deveAbrir ? "true" : "false");
    painel.setAttribute("aria-modal", deveAbrir ? "true" : "false");
  }

  function sincronizarPainelRapidoAcessibilidade() {
    const painel = document.getElementById("quick-a11y");

    if (!painel) return;

    const configuracoes = window.getVivaAccessibilitySettings
      ? window.getVivaAccessibilitySettings()
      : obterConfiguracoesAtuais();

    const botaoToggle = painel.querySelector("#quick-a11y-toggle");

    if (botaoToggle) {
      botaoToggle.setAttribute("aria-label", montarResumoAcessibilidade(configuracoes));
    }

    painel.querySelectorAll("[data-quick-font]").forEach((botao) => {
      const selecionado = botao.dataset.quickFont === configuracoes.fontSize;
      botao.classList.toggle("is-selected", selecionado);
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    painel.querySelectorAll("[data-quick-theme]").forEach((botao) => {
      const selecionado = botao.dataset.quickTheme === configuracoes.theme;
      botao.classList.toggle("is-selected", selecionado);
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    painel.querySelectorAll("[data-quick-color]").forEach((botao) => {
      const selecionado = botao.dataset.quickColor === configuracoes.colorMode;
      botao.classList.toggle("is-selected", selecionado);
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    sincronizarBotaoApoio(painel, "large-buttons", configuracoes.largeButtons);

    sincronizarBotaoApoio(painel, "screen-reader", configuracoes.screenReader);
  }

  function sincronizarBotaoApoio(painel, tipo, ativo) {
    const botao = painel.querySelector(`[data-quick-toggle="${tipo}"]`);

    if (!botao) return;

    const status = botao.querySelector("strong");

    botao.classList.toggle("is-selected", ativo);
    botao.setAttribute("aria-checked", ativo ? "true" : "false");
    botao.setAttribute(
      "aria-label",
      `${tipo === "large-buttons" ? "Botoes grandes" : "Leitura em voz alta"} ${ativo ? "ativado" : "desativado"}`,
    );

    if (status) {
      status.textContent = ativo ? "Ligado" : "Desligado";
    }
  }

  function montarResumoAcessibilidade(configuracoes) {
    const partes = [
      LABELS.fontSize[configuracoes.fontSize],
      LABELS.theme[configuracoes.theme],
      LABELS.colorMode[configuracoes.colorMode],
      configuracoes.largeButtons
        ? "botoes grandes ativados"
        : "botoes grandes desativados",
      configuracoes.screenReader
        ? "leitura em voz alta ativada"
        : "leitura em voz alta desativada",
    ];

    return `Acessibilidade. ${partes.join(", ")}.`;
  }

  /*
    Salva as preferencias dentro do usuario logado.
    Isso mantem os dados consistentes entre sessionStorage e localStorage.
  */
  function salvarPreferenciasNoUsuario(preferenciasNovas) {
    const usuarioLogado = JSON.parse(
      sessionStorage.getItem("viva_usuario_logado") || "null",
    );

    if (!usuarioLogado) return;

    const usuarioAtualizado = {
      ...usuarioLogado,
      preferencias: {
        ...(usuarioLogado.preferencias || {}),
        ...preferenciasNovas,
      },
    };

    sessionStorage.setItem(
      "viva_usuario_logado",
      JSON.stringify(usuarioAtualizado),
    );

    const usuariosBD = JSON.parse(
      localStorage.getItem("viva_usuarios") || "[]",
    );

    const usuarioExiste = usuariosBD.some((usuario) => {
      return usuario.cpf === usuarioAtualizado.cpf;
    });

    const usuariosAtualizados = usuarioExiste
      ? usuariosBD.map((usuario) => {
          if (usuario.cpf === usuarioAtualizado.cpf) {
            return usuarioAtualizado;
          }

          return usuario;
        })
      : [...usuariosBD, usuarioAtualizado];

    localStorage.setItem("viva_usuarios", JSON.stringify(usuariosAtualizados));
  }

  /*
    Configura os eventos globais da leitura assistida.
    Eles sao adicionados apenas uma vez.
  */
  function configurarEventosLeitorAssistido() {
    if (eventosLeitorConfigurados) return;

    document.addEventListener("focusin", aoFocarElemento);
    document.addEventListener("click", aoClicarElemento);

    eventosLeitorConfigurados = true;
  }

  /*
    Le o conteudo de elementos quando recebem foco.
    Isso ajuda na navegacao por teclado e leitores assistivos.
  */
  function aoFocarElemento(evento) {
    if (!leitorAssistidoAtivo) return;

    const elemento = encontrarElementoInterativo(evento.target);

    if (!elemento) return;

    const texto = obterTextoAcessivel(elemento);

    falarTexto(texto);
  }

  /*
    Le o conteudo de elementos quando sao clicados ou tocados.
    Isso ajuda principalmente no uso mobile.
  */
  function aoClicarElemento(evento) {
    if (!leitorAssistidoAtivo) return;

    const elemento = encontrarElementoInterativo(evento.target);

    if (!elemento) return;

    const texto = obterTextoAcessivel(elemento);

    falarTexto(texto);
  }

  /*
    Procura o elemento interativo mais proximo do alvo do clique/foco.
    Isso permite ler cards, botoes, links, inputs e switches.
  */
  function encontrarElementoInterativo(alvo) {
    if (!alvo || !alvo.closest) return null;

    return alvo.closest(
      [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "[role='button']",
        "[role='switch']",
        "[tabindex]",
        ".service-card",
        ".agenda-card",
        ".item-card",
        ".location-card",
        ".choice-card",
        ".professional-card",
        ".date-card",
        ".time-card",
        ".profile-menu-card",
        ".accessibility-card",
        ".font-size-card",
      ].join(","),
    );
  }

  /*
    Obtem o melhor texto possivel para leitura.
    Prioridade:
    1. aria-label;
    2. switches com estado ligado/desligado;
    3. labels de campos;
    4. texto visivel do elemento.
  */
  function obterTextoAcessivel(elemento) {
    if (!elemento) return "";

    const ariaLabel = elemento.getAttribute("aria-label");

    if (ariaLabel) {
      return limparTexto(ariaLabel);
    }

    if (elemento.getAttribute("role") === "switch") {
      const ligado = elemento.getAttribute("aria-checked") === "true";
      const textoCard = obterTextoDoCardPai(elemento);

      return `${textoCard}. ${ligado ? "Ligado" : "Desligado"}`;
    }

    if (
      elemento.tagName === "INPUT" ||
      elemento.tagName === "TEXTAREA" ||
      elemento.tagName === "SELECT"
    ) {
      return obterTextoDeCampo(elemento);
    }

    const texto = elemento.innerText || elemento.textContent || "";

    return limparTexto(texto);
  }

  /*
    Busca o texto do card onde um switch esta localizado.
    Remove o proprio botao de switch para evitar leitura duplicada.
  */
  function obterTextoDoCardPai(elemento) {
    const card = elemento.closest(
      ".accessibility-card, .profile-menu-card, .font-size-card",
    );

    if (!card) return "Opcao";

    const clone = card.cloneNode(true);
    const switchDentro = clone.querySelector(".switch");

    if (switchDentro) {
      switchDentro.remove();
    }

    return limparTexto(clone.innerText || clone.textContent || "Opcao");
  }

  /*
    Gera uma fala adequada para campos de formulario.
    Por seguranca, campos de senha nao tem o valor lido em voz alta.
  */
  function obterTextoDeCampo(campo) {
    const id = campo.id;
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    const nomeCampo = label ? label.textContent : campo.placeholder || "Campo";

    if (campo.type === "password") {
      return `${nomeCampo}. Campo de senha.`;
    }

    if (campo.value) {
      return `${nomeCampo}. ${campo.value}`;
    }

    return `${nomeCampo}. Campo vazio.`;
  }

  /*
    Limpa espacos duplicados para que a fala nao fique estranha.
  */
  function limparTexto(texto) {
    return String(texto || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /*
    Usa a API speechSynthesis do navegador para falar um texto.
    Tambem evita repetir a mesma fala varias vezes em sequencia.
  */
  function falarTexto(texto) {
    const textoLimpo = limparTexto(texto);

    if (!textoLimpo) return;

    if (!("speechSynthesis" in window)) {
      console.warn("Este navegador nao possui suporte a speechSynthesis.");
      return;
    }

    const agora = Date.now();

    if (textoLimpo === ultimaFala && agora - ultimoMomentoFala < 900) {
      return;
    }

    ultimaFala = textoLimpo;
    ultimoMomentoFala = agora;

    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(textoLimpo);

    fala.lang = "pt-BR";
    fala.rate = 0.95;
    fala.pitch = 1;
    fala.volume = 1;

    const voz = escolherVozPortugues();

    if (voz) {
      fala.voice = voz;
    }

    window.speechSynthesis.speak(fala);
  }

  /*
    Tenta escolher uma voz em portugues.
    Se nao encontrar, o navegador usa a voz padrao.
  */
  function escolherVozPortugues() {
    if (!("speechSynthesis" in window)) return null;

    const vozes = window.speechSynthesis.getVoices();

    return (
      vozes.find((voz) => voz.lang === "pt-BR") ||
      vozes.find((voz) => voz.lang && voz.lang.startsWith("pt")) ||
      null
    );
  }

  /*
    Interrompe qualquer leitura em andamento.
  */
  function pararLeitura() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  /*
    Funcao antiga mantida para compatibilidade com telas anteriores.
    Ela altera tema e tamanho de fonte ao mesmo tempo.
  */
  window.changeAccessibilitySettings = function (theme, fontSize) {
    aplicarTema(theme);
    aplicarTamanhoFonte(fontSize);
  };

  /*
    Funcoes globais usadas pelo perfil.js.
    Elas permitem alterar preferencias diretamente pela tela de Perfil.
  */
  window.setVivaTheme = aplicarTema;
  window.setVivaFontSize = aplicarTamanhoFonte;
  window.setVivaLargeButtons = aplicarBotoesGrandes;
  window.setVivaScreenReader = aplicarLeitorAssistido;
  window.setVivaColorMode = aplicarModoCores;
  window.stopVivaSpeech = pararLeitura;

  /*
    Retorna as preferencias atuais.
    Util para sincronizar toggles e estados visuais.
  */
  window.getVivaAccessibilitySettings = function () {
    return obterConfiguracoesAtuais();
  };
})();

