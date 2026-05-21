(function () {
  "use strict";

  /*
    Arquivo responsável por aplicar as preferências de acessibilidade
    em todas as páginas do sistema Viva+.

    Ele controla:
    - tema claro, escuro e alto contraste;
    - tamanho da fonte;
    - botões grandes;
    - leitura assistida em voz alta;
    - salvamento das preferências no localStorage e no usuário logado.
  */

  let leitorAssistidoAtivo = false;
  let eventosLeitorConfigurados = false;
  let ultimaFala = "";
  let ultimoMomentoFala = 0;

  document.addEventListener("DOMContentLoaded", aplicarAcessibilidadeSalva);

  /*
    Aplica as preferências salvas assim que qualquer página do sistema carrega.
    Isso garante que o usuário mantenha suas configurações ao navegar.
  */
  function aplicarAcessibilidadeSalva() {
    const tema = localStorage.getItem("viva_theme") || "light";
    const tamanhoFonte = localStorage.getItem("viva_fontsize") || "standard";
    const botoesGrandes = localStorage.getItem("viva_large_buttons") || "false";
    const leitorTela = localStorage.getItem("viva_screen_reader") || "false";

    aplicarTema(tema, false);
    aplicarTamanhoFonte(tamanhoFonte, false);
    aplicarBotoesGrandes(botoesGrandes === "true", false);
    aplicarLeitorAssistido(leitorTela === "true", false, false);
  }

  /*
    Aplica o tema visual no elemento <html>.
    O CSS reage ao atributo data-theme.
  */
  function aplicarTema(tema, deveSalvarUsuario = true) {
    const temasPermitidos = ["light", "dark", "high-contrast"];
    const temaFinal = temasPermitidos.includes(tema) ? tema : "light";

    document.documentElement.setAttribute("data-theme", temaFinal);
    localStorage.setItem("viva_theme", temaFinal);

    if (deveSalvarUsuario) {
      salvarPreferenciasNoUsuario({
        tema: temaFinal,
      });
    }
  }

  /*
    Aplica o tamanho da fonte no elemento <html>.
    O CSS reage ao atributo data-fontsize.
  */
  function aplicarTamanhoFonte(tamanho, deveSalvarUsuario = true) {
    const tamanhosPermitidos = ["small", "standard", "medium", "large"];
    const tamanhoFinal = tamanhosPermitidos.includes(tamanho)
      ? tamanho
      : "standard";

    document.documentElement.setAttribute("data-fontsize", tamanhoFinal);
    localStorage.setItem("viva_fontsize", tamanhoFinal);

    if (deveSalvarUsuario) {
      salvarPreferenciasNoUsuario({
        tamanhoFonte: tamanhoFinal,
      });
    }
  }

  /*
    Ativa ou desativa botões grandes no sistema inteiro.
    O CSS reage ao atributo data-large-buttons.
  */
  function aplicarBotoesGrandes(ativo, deveSalvarUsuario = true) {
    document.documentElement.setAttribute(
      "data-large-buttons",
      ativo ? "true" : "false",
    );

    localStorage.setItem("viva_large_buttons", ativo ? "true" : "false");

    if (deveSalvarUsuario) {
      salvarPreferenciasNoUsuario({
        botoesGrandes: ativo,
      });
    }
  }

  /*
    Ativa ou desativa a leitura assistida em voz alta.
    Essa função usa a API speechSynthesis do navegador.
  */
  function aplicarLeitorAssistido(
    ativo,
    deveFalarConfirmacao = true,
    deveSalvarUsuario = true,
  ) {
    leitorAssistidoAtivo = ativo;

    document.documentElement.setAttribute(
      "data-screen-reader",
      ativo ? "true" : "false",
    );

    localStorage.setItem("viva_screen_reader", ativo ? "true" : "false");

    if (deveSalvarUsuario) {
      salvarPreferenciasNoUsuario({
        leitorTela: ativo,
      });
    }

    if (ativo) {
      configurarEventosLeitorAssistido();

      if (deveFalarConfirmacao) {
        falarTexto("Leitura em voz alta ativada.");
      }

      return;
    }

    pararLeitura();

    if (deveFalarConfirmacao) {
      falarTexto("Leitura em voz alta desativada.");
    }
  }

  /*
    Salva as preferências dentro do usuário logado.
    Isso mantém os dados consistentes entre sessionStorage e localStorage.
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

    const usuariosBD = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");

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
    Eles são adicionados apenas uma vez.
  */
  function configurarEventosLeitorAssistido() {
    if (eventosLeitorConfigurados) return;

    document.addEventListener("focusin", aoFocarElemento);
    document.addEventListener("click", aoClicarElemento);

    eventosLeitorConfigurados = true;
  }

  /*
    Lê o conteúdo de elementos quando recebem foco.
    Isso ajuda na navegação por teclado e leitores assistivos.
  */
  function aoFocarElemento(evento) {
    if (!leitorAssistidoAtivo) return;

    const elemento = encontrarElementoInterativo(evento.target);

    if (!elemento) return;

    const texto = obterTextoAcessivel(elemento);

    falarTexto(texto);
  }

  /*
    Lê o conteúdo de elementos quando são clicados ou tocados.
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
    Procura o elemento interativo mais próximo do alvo do clique/foco.
    Isso permite ler cards, botões, links, inputs e switches.
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
        ".date-card",
        ".time-card",
        ".profile-menu-card",
        ".accessibility-card",
        ".font-size-card",
      ].join(","),
    );
  }

  /*
    Obtém o melhor texto possível para leitura.
    Prioridade:
    1. aria-label;
    2. switches com estado ligado/desligado;
    3. labels de campos;
    4. texto visível do elemento.
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
    Busca o texto do card onde um switch está localizado.
    Remove o próprio botão de switch para evitar leitura duplicada.
  */
  function obterTextoDoCardPai(elemento) {
    const card = elemento.closest(
      ".accessibility-card, .profile-menu-card, .font-size-card",
    );

    if (!card) return "Opção";

    const clone = card.cloneNode(true);
    const switchDentro = clone.querySelector(".switch");

    if (switchDentro) {
      switchDentro.remove();
    }

    return limparTexto(clone.innerText || clone.textContent || "Opção");
  }

  /*
    Gera uma fala adequada para campos de formulário.
    Por segurança, campos de senha não têm o valor lido em voz alta.
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
    Limpa espaços duplicados para que a fala não fique estranha.
  */
  function limparTexto(texto) {
    return String(texto || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /*
    Usa a API speechSynthesis do navegador para falar um texto.
    Também evita repetir a mesma fala várias vezes em sequência.
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
    Tenta escolher uma voz em português.
    Se não encontrar, o navegador usa a voz padrão.
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
    Função antiga mantida para compatibilidade com telas anteriores.
    Ela altera tema e tamanho de fonte ao mesmo tempo.
  */
  window.changeAccessibilitySettings = function (theme, fontSize) {
    aplicarTema(theme);
    aplicarTamanhoFonte(fontSize);
  };

  /*
    Funções globais usadas pelo perfil.js.
    Elas permitem alterar preferências diretamente pela tela de Perfil.
  */
  window.setVivaTheme = aplicarTema;
  window.setVivaFontSize = aplicarTamanhoFonte;
  window.setVivaLargeButtons = aplicarBotoesGrandes;
  window.setVivaScreenReader = aplicarLeitorAssistido;
  window.stopVivaSpeech = pararLeitura;

  /*
    Retorna as preferências atuais.
    Útil para sincronizar toggles e estados visuais.
  */
  window.getVivaAccessibilitySettings = function () {
    return {
      theme: localStorage.getItem("viva_theme") || "light",
      fontSize: localStorage.getItem("viva_fontsize") || "standard",
      largeButtons: localStorage.getItem("viva_large_buttons") === "true",
      screenReader: localStorage.getItem("viva_screen_reader") === "true",
    };
  };
})();