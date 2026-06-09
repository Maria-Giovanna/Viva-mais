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
      standard: "fonte padrão",
      medium: "fonte média",
      large: "fonte grande",
    },
    colorMode: {
      default: "cores padrão do Viva+",
      deuteranopia: "ajuste para daltonismo vermelho e verde",
      tritanopia: "ajuste para daltonismo azul e amarelo",
      achromatopsia: "modo sem cores, em tons de cinza",
    },
  };
  let leitorAssistidoAtivo = false;
  let eventosLeitorConfigurados = false;
  let ultimaFala = "";
  let ultimoMomentoFala = 0;
  let observadorBotoesGrandes = null;

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
    melhorarAcessibilidadeARIA();
    sincronizarPainelRapidoAcessibilidade();
  }

  function obterConfiguracoesAtuais() {
    const salvas = lerJSONLocalStorage(STORAGE_KEY, null);
    const usuario = JSON.parse(
      sessionStorage.getItem("viva_usuario_logado") || "null",
    );
    const preferenciasUsuario = usuario?.preferencias || {};

    const legadas = {
      theme:
        localStorage.getItem("viva_theme") ||
        preferenciasUsuario.tema ||
        undefined,
      fontSize:
        localStorage.getItem("viva_fontsize") ||
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
    aplicarAreasDeContatoGrandes(configuracoesFinais.largeButtons);

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
      anunciarMudancaAcessibilidade(configuracoesFinais);
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
            <button type="button" class="quick-a11y-option" data-quick-font="standard">Padrão</button>
            <button type="button" class="quick-a11y-option" data-quick-font="medium">Médio</button>
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
              <span class="quick-a11y-support-main">
                <span class="quick-a11y-support-icon" aria-hidden="true">
                  <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
                    <path d="m161.876 434.037c27.772 48.089 79.523 77.963 135.055 77.963 85.996 0 155.959-69.963 155.959-155.959v-122.11c0-21.904-17.82-39.724-39.725-39.724-8.722 0-16.796 2.825-23.355 7.609-4.461-17.056-20.003-29.678-38.438-29.678-9.223 0-17.723 3.16-24.472 8.454-5.569-15.218-20.197-26.109-37.321-26.109-8.159 0-15.753 2.473-22.069 6.709v-77.33c0-21.904-17.82-39.724-39.725-39.724-21.904 0-39.724 17.82-39.724 39.724v210.602c0 2.708-1.587 5.195-4.042 6.338-3.307 1.537-7.177.316-9-2.843l-26.488-45.878c-15.819-27.4-50.978-36.821-78.38-21.002-5.105 2.948-8.757 7.707-10.283 13.402-1.525 5.695-.741 11.642 2.207 16.748zm-84.951-184.987c.177-.659.679-1.885 2.057-2.68 6.121-3.534 12.913-5.339 19.796-5.339 3.45 0 6.924.454 10.345 1.371 10.249 2.746 18.815 9.319 24.12 18.508l26.488 45.878c6.432 11.139 20.076 15.447 31.737 10.024 8.657-4.027 14.251-12.798 14.251-22.346v-210.604c0-12.169 9.9-22.069 22.069-22.069s22.069 9.9 22.069 22.069v163.31c0 4.875 3.952 8.828 8.828 8.828s8.828-3.952 8.828-8.828v-52.965c0-12.169 9.9-22.069 22.069-22.069s22.069 9.9 22.069 22.069v52.965c0 4.875 3.952 8.828 8.828 8.828 4.875 0 8.828-3.952 8.828-8.828v-35.31c0-12.169 9.9-22.069 22.069-22.069s22.069 9.9 22.069 22.069v39.724c0 4.875 3.952 8.828 8.828 8.828 4.875 0 8.828-3.952 8.828-8.828v-17.655c0-12.169 9.9-22.069 22.069-22.069s22.069 9.9 22.069 22.069v122.11c0 76.261-62.043 138.304-138.305 138.304-49.246 0-95.137-26.492-119.766-69.138l-99.802-172.808c-.796-1.377-.618-2.69-.441-3.349z"></path>
                    <path d="m167.556 129.479c4.202-2.473 5.602-7.884 3.129-12.085-5.956-10.119-9.105-21.714-9.105-33.532 0-36.507 29.7-66.207 66.207-66.207s66.207 29.7 66.207 66.207c0 11.862-3.172 23.497-9.172 33.645-2.481 4.197-1.091 9.611 3.106 12.092 1.41.834 2.957 1.23 4.485 1.23 3.018 0 5.959-1.549 7.607-4.336 7.609-12.867 11.63-27.609 11.63-42.631-.001-46.242-37.621-83.862-83.863-83.862s-83.862 37.62-83.862 83.862c0 14.965 3.992 29.657 11.545 42.488 2.475 4.202 7.887 5.602 12.086 3.129z"></path>
                  </svg>
                </span>
                <span class="quick-a11y-support-label">Botões grandes</span>
              </span>
              <strong>Desligado</strong>
            </button>

            <button type="button" class="quick-a11y-support" data-quick-toggle="screen-reader" role="switch" aria-checked="false">
              <span class="quick-a11y-support-label">Leitura em voz alta</span>
              <strong>Desligado</strong>
            </button>
          </div>
        </section>

        <section class="quick-a11y-section" aria-labelledby="quick-a11y-color-title">
          <h2 id="quick-a11y-color-title">Modo de cores</h2>

          <div class="quick-a11y-options quick-a11y-options-grid" role="group" aria-label="Modo de cores">
            <button type="button" class="quick-a11y-option" data-quick-color="default" aria-label="Usar cores padrão do Viva mais">Padrão Viva+</button>
            <button type="button" class="quick-a11y-option" data-quick-color="deuteranopia" aria-label="Usar ajuste para daltonismo vermelho e verde">Daltonismo vermelho/verde</button>
            <button type="button" class="quick-a11y-option" data-quick-color="tritanopia" aria-label="Usar ajuste para daltonismo azul e amarelo">Daltonismo azul/amarelo</button>
            <button type="button" class="quick-a11y-option" data-quick-color="achromatopsia" aria-label="Usar modo sem cores em tons de cinza">Sem cores</button>
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
        requestAnimationFrame(sincronizarPainelRapidoAcessibilidade);
      });
    });

    painel.querySelectorAll("[data-quick-theme]").forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarTema(botao.dataset.quickTheme);
        requestAnimationFrame(sincronizarPainelRapidoAcessibilidade);
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

        requestAnimationFrame(sincronizarPainelRapidoAcessibilidade);
      });
    });

    painel.querySelectorAll("[data-quick-color]").forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarModoCores(botao.dataset.quickColor);
        requestAnimationFrame(sincronizarPainelRapidoAcessibilidade);
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
      botao.dataset.selected = selecionado ? "true" : "false";
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    painel.querySelectorAll("[data-quick-theme]").forEach((botao) => {
      const selecionado = botao.dataset.quickTheme === configuracoes.theme;
      botao.classList.toggle("is-selected", selecionado);
      botao.dataset.selected = selecionado ? "true" : "false";
      botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    painel.querySelectorAll("[data-quick-color]").forEach((botao) => {
      const selecionado = botao.dataset.quickColor === configuracoes.colorMode;
      botao.classList.toggle("is-selected", selecionado);
      botao.dataset.selected = selecionado ? "true" : "false";
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
    botao.dataset.selected = ativo ? "true" : "false";
    botao.setAttribute("aria-checked", ativo ? "true" : "false");
    botao.setAttribute(
      "aria-label",
      `${tipo === "large-buttons" ? "Botões grandes" : "Leitura em voz alta"} ${ativo ? "ativado" : "desativado"}`,
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
        ? "botões grandes ativados"
        : "botões grandes desativados",
      configuracoes.screenReader
        ? "leitura em voz alta ativada"
        : "leitura em voz alta desativada",
    ];

    return `Acessibilidade. ${partes.join(", ")}.`;
  }

  function anunciarMudancaAcessibilidade(configuracoes) {
    const regiao = document.getElementById("viva-live-region");

    if (!regiao) return;

    regiao.textContent = montarResumoAcessibilidade(configuracoes);
  }

  function aplicarAreasDeContatoGrandes(ativo) {
    /*
      A opção "botões grandes" aumenta a área de contato de todos os
      elementos acionáveis do sistema, incluindo cards clicáveis.
      A função apenas marca os elementos; o tamanho visual fica no CSS,
      respeitando cascata, responsividade, box-sizing e estados existentes.
    */
    const seletoresAreaContato = [
      "a[href]",
      "button",
      "input",
      "textarea",
      "select",
      "summary",
      "label[for]",
      "[role='button']",
      "[role='tab']",
      "[role='switch']",
      "[tabindex]:not([tabindex='-1'])",

      /* Botões e links estilizados */
      ".btn",
      ".btn-primary",
      ".btn-secondary",
      ".btn-secondary-outline",
      ".btn-secondary-small",
      ".btn-text",
      ".btn-back",
      ".btn-toggle-password",
      ".profile-back",
      ".agenda-back",
      ".scheduling-back",
      ".nav-link",

      /* Cards e superfícies clicáveis do fluxo */
      ".profile-menu-card",
      ".accessibility-card",
      ".font-size-card",
      ".color-option-card",
      ".access-card",
      ".bubble-option",
      ".agenda-card",
      ".agenda-tab",
      ".choice-card",
      ".item-card",
      ".date-card",
      ".time-card",
      ".location-card",
      ".location-select-button",
      ".location-maps-button",
      ".professional-card",

      /* Painel rapido de acessibilidade */
      ".quick-a11y-toggle",
      ".quick-a11y-option",
      ".quick-a11y-support",
      ".switch",
    ].join(",");

    function atualizarMarcacaoAreaContato() {
      if (!ativo) {
        document
          .querySelectorAll('[data-viva-hit-target="large"]')
          .forEach((elemento) => {
            elemento.removeAttribute("data-viva-hit-target");
          });
        return;
      }

      document.querySelectorAll(seletoresAreaContato).forEach((elemento) => {
        elemento.setAttribute("data-viva-hit-target", "large");
      });
    }

    atualizarMarcacaoAreaContato();

    if (observadorBotoesGrandes) {
      observadorBotoesGrandes.disconnect();
      observadorBotoesGrandes = null;
    }

    if (!ativo) return;

    observadorBotoesGrandes = new MutationObserver(atualizarMarcacaoAreaContato);

    observadorBotoesGrandes.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "role", "tabindex", "href", "for"],
    });
  }

  function melhorarAcessibilidadeARIA() {
    garantirSkipLink();
    garantirRegiaoViva();
    marcarNavegacaoAtual();

    document.querySelectorAll("main").forEach((main) => {
      if (!main.id) main.id = "main-content";
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    });

    document.querySelectorAll("img:not([alt])").forEach((imagem) => {
      imagem.setAttribute("alt", "");
      imagem.setAttribute("aria-hidden", "true");
    });
  }

  function garantirSkipLink() {
    if (document.querySelector(".skip-link")) return;

    const main = document.querySelector("main");
    const destino = main?.id || "main-content";

    if (main && !main.id) {
      main.id = destino;
    }

    const link = document.createElement("a");
    link.className = "skip-link";
    link.href = `#${destino}`;
    link.textContent = "Pular para o conteúdo principal";

    document.body.insertBefore(link, document.body.firstChild);
  }

  function garantirRegiaoViva() {
    if (document.getElementById("viva-live-region")) return;

    const regiao = document.createElement("div");
    regiao.id = "viva-live-region";
    regiao.className = "sr-only";
    regiao.setAttribute("role", "status");
    regiao.setAttribute("aria-live", "polite");
    regiao.setAttribute("aria-atomic", "true");

    document.body.appendChild(regiao);
  }

  function marcarNavegacaoAtual() {
    const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("nav a[href]").forEach((link) => {
      const destino = link.getAttribute("href").split("?")[0].split("#")[0];
      const destinoArquivo = destino.split("/").pop();

      if (destinoArquivo === paginaAtual) {
        link.setAttribute("aria-current", "page");
      } else if (link.getAttribute("aria-current") === "page") {
        link.removeAttribute("aria-current");
      }
    });
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
      console.warn("Este navegador não possui suporte a speechSynthesis.");
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

