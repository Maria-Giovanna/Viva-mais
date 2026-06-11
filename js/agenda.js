(function () {
  ("use strict");

  /*
    agenda.js
    Controla a pagina Agenda:
    - separa agendamentos futuros e historico;
    - mostra detalhes do atendimento escolhido;
    - cancela agendamentos com confirmacao;
    - gera comprovante em arquivo de texto.
  */

  /*
  icone do calendario
    <span class="details-date-icon" aria-hidden="true">${iconeCalendario()}</span>
  */

  const estadoAgenda = {
    usuario: null,
    agendamentos: [],
    abaAtual: "proximos",
    agendamentoSelecionado: null,
  };

  document.addEventListener("DOMContentLoaded", iniciarAgenda);

  function iniciarAgenda() {
    try {
      const usuarioLogado = window.VivaAgendamentos.obterUsuarioLogado();

      if (!usuarioLogado) {
        window.location.href = "login.html";
        return;
      }

      estadoAgenda.usuario = usuarioLogado;
      estadoAgenda.agendamentos = obterAgendamentosDoUsuario(usuarioLogado.cpf);

      configurarEventos();
      atualizarTabs();
      renderizarAgenda();
      mostrarEtapa("step-agenda-lista");
    } catch (erro) {
      console.error("Erro ao carregar agenda:", erro);
      mostrarErroNaTela("Não conseguimos carregar sua agenda agora. Volte para o início e tente novamente em alguns instantes.");
    }
  }

  function obterAgendamentosDoUsuario(cpf) {
    return window.VivaAgendamentos.listarDoUsuario(cpf);
  }

  function configurarEventos() {
    document.querySelectorAll("[data-tab]").forEach((botao) => {
      botao.addEventListener("click", () => {
        estadoAgenda.abaAtual = botao.dataset.tab;
        atualizarTabs();
        renderizarAgenda();
      });

      botao.addEventListener("keydown", moverFocoEntreAbas);
    });

    escutarClique("btn-voltar", voltar);
    escutarClique("btn-continuar-aviso-agenda", continuarParaDetalhesAposAviso);
    escutarClique("btn-baixar-comprovante", baixarComprovanteSelecionado);
    escutarClique("btn-cancelar-agendamento", abrirConfirmacaoCancelamento);
    escutarClique("btn-manter-agendamento", () =>
      mostrarEtapa("step-detalhes"),
    );
    escutarClique("btn-confirmar-cancelamento", confirmarCancelamento);
    escutarClique("btn-ir-agenda", () => {
      estadoAgenda.abaAtual = "historico";
      atualizarTabs();
      estadoAgenda.agendamentos = obterAgendamentosDoUsuario(
        estadoAgenda.usuario.cpf,
      );
      renderizarAgenda();
      mostrarEtapa("step-agenda-lista");
    });
    escutarClique("btn-novo-agendamento", () => {
      window.location.href = "home.html";
    });
  }

  function escutarClique(id, acao) {
    const elemento = document.getElementById(id);

    if (!elemento) {
      console.warn(`Elemento não encontrado: #${id}`);
      return;
    }

    elemento.addEventListener("click", acao);
  }

  function atualizarTabs() {
    const lista = document.getElementById("lista-agendamentos");
    const tablist = document.querySelector(".agenda-tabs");

    tablist?.setAttribute("role", "tablist");

    document.querySelectorAll("[data-tab]").forEach((botao) => {
      const ativa = botao.dataset.tab === estadoAgenda.abaAtual;
      botao.classList.toggle("active", ativa);
      botao.setAttribute("role", "tab");
      botao.setAttribute("aria-selected", ativa ? "true" : "false");
      botao.setAttribute("tabindex", ativa ? "0" : "-1");
      botao.setAttribute("aria-controls", "lista-agendamentos");

      if (ativa && lista) {
        lista.setAttribute("aria-labelledby", botao.id);
      }
    });
  }

  function moverFocoEntreAbas(evento) {
    const teclas = ["ArrowLeft", "ArrowRight", "Home", "End"];

    if (!teclas.includes(evento.key)) return;

    const abas = Array.from(document.querySelectorAll("[data-tab]"));
    const indiceAtual = abas.indexOf(evento.currentTarget);
    let proximoIndice = indiceAtual;

    if (evento.key === "ArrowRight") proximoIndice = (indiceAtual + 1) % abas.length;
    if (evento.key === "ArrowLeft") proximoIndice = (indiceAtual - 1 + abas.length) % abas.length;
    if (evento.key === "Home") proximoIndice = 0;
    if (evento.key === "End") proximoIndice = abas.length - 1;

    evento.preventDefault();
    abas[proximoIndice]?.focus();
  }

  function renderizarAgenda() {
    const lista = document.getElementById("lista-agendamentos");

    if (!lista) {
      mostrarErroNaTela("Não conseguimos mostrar sua lista de agendamentos. Volte para o início e tente novamente.");
      return;
    }

    const agendamentos = filtrarAgendamentosPorAba();

    lista.innerHTML = "";
    lista.setAttribute("role", "tabpanel");
    lista.setAttribute("aria-live", "polite");
    lista.setAttribute("aria-busy", "true");
    lista.setAttribute(
      "aria-label",
      `${estadoAgenda.abaAtual === "proximos" ? "Próximos agendamentos" : "Histórico de agendamentos"}. ${agendamentos.length} item${agendamentos.length === 1 ? "" : "s"}.`,
    );

    if (agendamentos.length === 0) {
      lista.innerHTML = montarEstadoVazio();
      lista.setAttribute("aria-busy", "false");
      window.vivaA11y?.atualizar(lista);
      return;
    }

    agendamentos.forEach((agendamento, indice) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "agenda-card";
      card.setAttribute("aria-posinset", String(indice + 1));
      card.setAttribute("aria-setsize", String(agendamentos.length));
      card.setAttribute(
        "aria-label",
        `Abrir detalhes de ${obterTituloAgendamento(agendamento)} em ${formatarDataCompleta(agendamento.data)} às ${agendamento.hora}. ${agendamento.unidadeNome || "Unidade não informada"}.`,
      );

      card.innerHTML = montarCardAgendamento(agendamento);

      card.addEventListener("click", () => {
        estadoAgenda.agendamentoSelecionado = agendamento;
        renderizarDetalhes(agendamento);
        abrirAvisoAntesDosDetalhes(agendamento);
      });

      lista.appendChild(card);
    });

    lista.setAttribute("aria-busy", "false");
    window.vivaA11y?.atualizar(lista);
  }

  function filtrarAgendamentosPorAba() {
    if (estadoAgenda.abaAtual === "proximos") {
      return window.VivaAgendamentos.listarProximos(estadoAgenda.usuario.cpf);
    }

    return window.VivaAgendamentos.listarHistorico(estadoAgenda.usuario.cpf);
  }

  function montarCardAgendamento(agendamento) {
    const data = obterPartesData(agendamento.data);
    const status =
      agendamento.statusCalculado ||
      window.VivaAgendamentos.obterStatusCalculado(agendamento);
    const titulo = obterTituloAgendamento(agendamento);
    const local = agendamento.unidadeNome || "Unidade não informada";
    const profissional = agendamento.profissional || "Equipe da unidade";

    return `
      <div class="agenda-date-block">
        <span class="agenda-day">${data.dia}</span>
        <span class="agenda-month">${data.mesCurto}</span>
      </div>

      <div class="agenda-card-content">
        <h2 class="agenda-card-title">${titulo}</h2>

        <div class="agenda-card-line">
          ${iconeLocal()}
          <span>${local}</span>
        </div>

        <div class="agenda-card-divider"></div>

        <div class="agenda-card-line">
          ${iconeRelogio()}
          <span>${agendamento.hora} - ${profissional}</span>
        </div>

        <span class="status-badge ${obterClasseStatus(status)}">
          ${obterTextoStatus(status)}
        </span>
      </div>

      <span class="agenda-card-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M9 18L15 12L9 6" />
        </svg>
      </span>
    `;
  }

  function renderizarDetalhes(agendamento) {
    const container = document.getElementById("detalhes-agendamento");
    const btnCancelar = document.getElementById("btn-cancelar-agendamento");

    if (!container) {
      mostrarErroNaTela("Não conseguimos abrir os detalhes deste agendamento. Volte para a Agenda e tente novamente.");
      return;
    }

    const status = window.VivaAgendamentos.obterStatusCalculado(agendamento);
    const podeCancelar = status === "confirmado";
    const dataFormatada = formatarDataCompleta(agendamento.data);
    const servico =
      agendamento.servico || obterNomeServico(agendamento.categoria);
    const tipo =
      agendamento.item || agendamento.especialidade || "Não informado";
    const local = agendamento.unidadeNome || "Unidade não informada";
    const endereco = agendamento.endereco || "Endereço não informado";
    const profissional = agendamento.profissional || "Equipe da unidade";

    if (btnCancelar) {
      btnCancelar.hidden = !podeCancelar;
      btnCancelar.setAttribute("aria-hidden", podeCancelar ? "false" : "true");
    }

    container.innerHTML = `
      <article class="details-card appointment-receipt-card" aria-label="Comprovante de agendamento">
        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeServico()}</span>
          <div class="details-copy">
            <span class="details-label">Serviço</span>
            <span class="details-value">${servico}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeTipo()}</span>
          <div class="details-copy">
            <span class="details-label">Tipo</span>
            <span class="details-value">${tipo}</span>
          </div>
        </div>

        <div class="details-date-highlight">
          <span class="details-date-text">${dataFormatada}</span>
          <strong class="details-time-text">às ${agendamento.hora}</strong>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeLocal()}</span>
          <div class="details-copy">
            <span class="details-label">Local</span>
            <span class="details-value">${local}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeRota()}</span>
          <div class="details-copy">
            <span class="details-label">Endereço</span>
            <span class="details-value">${endereco}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeProfissional()}</span>
          <div class="details-copy">
            <span class="details-label">Profissional/Equipe</span>
            <span class="details-value">${profissional}</span>
          </div>
        </div>

        <div class="details-item details-item--status">
          <span class="details-icon details-icon--status" aria-hidden="true">!</span>
          <div class="details-copy">
            <span class="details-label">Status</span>
            <span class="details-value">${obterTextoStatus(status)}</span>
          </div>
        </div>
      </article>
    `;

    container.setAttribute("aria-live", "polite");
    container.querySelector(".appointment-receipt-card")?.setAttribute("role", "group");
    window.vivaA11y?.atualizar(container);
  }

  function abrirConfirmacaoCancelamento() {
    if (!estadoAgenda.agendamentoSelecionado) return;

    mostrarEtapa("step-confirmar-cancelamento");
  }

  function confirmarCancelamento() {
    const selecionado = estadoAgenda.agendamentoSelecionado;

    if (!selecionado) return;

    const agendamentos = JSON.parse(
      localStorage.getItem("viva_agendamentos") || "[]",
    );

    const atualizados = agendamentos.map((agendamento) => {
      if (agendamento.id === selecionado.id) {
        return {
          ...agendamento,
          status: "cancelado",
          canceladoEm: new Date().toISOString(),
        };
      }

      return agendamento;
    });

    localStorage.setItem("viva_agendamentos", JSON.stringify(atualizados));

    estadoAgenda.agendamentos = obterAgendamentosDoUsuario(
      estadoAgenda.usuario.cpf,
    );
    estadoAgenda.agendamentoSelecionado = {
      ...selecionado,
      status: "cancelado",
    };

    mostrarEtapa("step-cancelado");
  }

  function abrirAvisoAntesDosDetalhes(agendamento) {
    const overlay = document.getElementById("agenda-reminder-overlay");
    const encaminhamentoItem = document.getElementById(
      "agenda-reminder-referral",
    );
    const botaoContinuar = document.getElementById(
      "btn-continuar-aviso-agenda",
    );

    if (!overlay) {
      mostrarEtapa("step-detalhes");
      return;
    }

    if (encaminhamentoItem) {
      encaminhamentoItem.hidden = !ehConsultaComEspecialista(agendamento);
      encaminhamentoItem.setAttribute(
        "aria-hidden",
        encaminhamentoItem.hidden ? "true" : "false",
      );
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-appointment-reminder-overlay");

    window.vivaA11y?.ativarEtapa(
      overlay,
      "Antes do atendimento. Confira as orientações e avance para o comprovante.",
    );

    if (!window.vivaA11y && botaoContinuar) botaoContinuar.focus();
  }

  function continuarParaDetalhesAposAviso() {
    fecharAvisoAntesDosDetalhes();
    mostrarEtapa("step-detalhes");
  }

  function fecharAvisoAntesDosDetalhes() {
    const overlay = document.getElementById("agenda-reminder-overlay");

    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
    }

    document.body.classList.remove("has-appointment-reminder-overlay");
  }

  function ehConsultaComEspecialista(agendamento) {
    if (!agendamento || agendamento.categoria !== "consulta") {
      return false;
    }

    if (agendamento.exigeEncaminhamento === true) {
      return true;
    }

    if (
      String(agendamento.tipoConsulta || "").toLowerCase() === "especialista"
    ) {
      return true;
    }

    const tipo = normalizarTextoAgendamento(
      agendamento.item || agendamento.especialidade || agendamento.titulo || "",
    );

    return Boolean(tipo) && !tipo.includes("clinico geral");
  }

  function normalizarTextoAgendamento(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function baixarComprovanteSelecionado() {
    const agendamento = estadoAgenda.agendamentoSelecionado;

    if (!agendamento) return;

    if (!window.VivaPDF) {
      mostrarErroNaTela("Não conseguimos gerar o PDF agora. Seu agendamento continua salvo e pode ser consultado nesta Agenda.");
      return;
    }

    window.VivaPDF.baixarComprovanteAgendamento({
      usuario: estadoAgenda.usuario,
      agendamento,
      dataFormatada: formatarDataCompleta(agendamento.data),
      statusTexto: obterTextoStatus(
        window.VivaAgendamentos.obterStatusCalculado(agendamento),
      ),
    });
  }

  function voltar() {
    const etapaAtual = document.querySelector(".agenda-step:not([hidden])");

    if (!etapaAtual || etapaAtual.id === "step-agenda-lista") {
      window.location.href = "home.html";
      return;
    }

    if (etapaAtual.id === "step-confirmar-cancelamento") {
      mostrarEtapa("step-detalhes");
      return;
    }

    mostrarEtapa("step-agenda-lista");
  }

  function mostrarEtapa(idEtapa) {
    const etapa = document.getElementById(idEtapa);

    if (!etapa) {
      mostrarErroNaTela("Não conseguimos abrir a próxima tela. Volte para o início e tente novamente.");
      return;
    }

    document.querySelectorAll(".agenda-step").forEach((secao) => {
      secao.hidden = true;
      secao.setAttribute("aria-hidden", "true");
    });

    etapa.hidden = false;
    etapa.setAttribute("aria-hidden", "false");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    window.vivaA11y?.ativarEtapa(etapa);
  }

  function mostrarErroNaTela(mensagem) {
    const mensagemErro = document.getElementById("mensagem-erro");

    if (mensagemErro) {
      mensagemErro.textContent = mensagem;
    }

    mostrarEtapa("step-error");
  }

  function montarEstadoVazio() {
    const texto =
      estadoAgenda.abaAtual === "proximos"
        ? "Você ainda não possui agendamentos futuros confirmados. Quando marcar uma consulta, exame ou vacina, ela aparecerá aqui."
        : "Você ainda não possui agendamentos finalizados ou cancelados. Depois que um atendimento acontecer ou for cancelado, ele aparecerá aqui.";

    return `
      <div class="empty-state">
        <h2 class="agenda-card-title">Nenhum agendamento encontrado</h2>
        <p class="agenda-subtitle">${texto}</p>
      </div>
    `;
  }

  function obterPartesData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const meses = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];

    return {
      dia: String(dia).padStart(2, "0"),
      mesCurto: meses[mes - 1],
      ano,
    };
  }

  function formatarDataCompleta(dataISO) {
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);

    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];

    return `${diasSemana[data.getDay()]}, ${dia} de ${meses[mes - 1]} de ${ano}`;
  }

  function obterTituloAgendamento(agendamento) {
    if (agendamento.categoria === "consulta") {
      return "Consulta Médica";
    }

    if (agendamento.categoria === "exame") {
      return agendamento.item || agendamento.titulo || "Exame";
    }

    if (agendamento.categoria === "vacina") {
      return "Vacina";
    }

    return agendamento.titulo || "Agendamento";
  }

  function obterNomeServico(categoria) {
    const nomes = {
      consulta: "Consulta Médica",
      exame: "Exame",
      vacina: "Vacina",
    };

    return nomes[categoria] || "Agendamento";
  }

  function obterClasseStatus(status) {
    const classes = {
      confirmado: "status-confirmado",
      realizado: "status-realizado",
      cancelado: "status-cancelado",
      "nao-compareceu": "status-nao-compareceu",
    };

    return classes[status] || "status-confirmado";
  }

  function obterTextoStatus(status) {
    const textos = {
      confirmado: "Confirmado",
      realizado: "Realizado",
      cancelado: "Cancelado",
      "nao-compareceu": "Não Compareceu",
    };

    return textos[status] || "Confirmado";
  }

  function iconeLocal() {
    return `
      <svg viewBox="0 0 24 28" fill="currentColor" aria-hidden="true">
        <path d="M9.23096 11.9997C9.23096 11.2653 9.52271 10.5609 10.042 10.0416C10.5614 9.52223 11.2657 9.23047 12.0002 9.23047C12.7346 9.23047 13.439 9.52223 13.9583 10.0416C14.4777 10.5609 14.7694 11.2653 14.7694 11.9997C14.7694 12.7341 14.4777 13.4385 13.9583 13.9578C13.439 14.4772 12.7346 14.7689 12.0002 14.7689C11.2657 14.7689 10.5614 14.4772 10.042 13.9578C9.52271 13.4385 9.23096 12.7341 9.23096 11.9997Z"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 11.9926C0.00195773 8.8113 1.2671 5.76095 3.51733 3.51211C5.76755 1.26327 8.81868 -6.0238e-07 12 0C18.6258 0 24 5.37046 24 11.9926C24 16.9292 21.5298 20.8412 18.8825 23.4849C17.7105 24.6584 16.3992 25.6839 14.9778 26.5385C14.3834 26.8892 13.8277 27.1662 13.344 27.3545C12.888 27.5354 12.4098 27.6757 12 27.6757C11.5902 27.6757 11.112 27.5354 10.656 27.3545C10.0914 27.1244 9.54525 26.8516 9.02215 26.5385C7.60081 25.6839 6.28951 24.6584 5.11754 23.4849C2.47015 20.8412 0 16.9292 0 11.9926ZM12 7.37908C10.7759 7.37908 9.60198 7.86534 8.73643 8.73089C7.87088 9.59644 7.38462 10.7704 7.38462 11.9945C7.38462 13.2185 7.87088 14.3925 8.73643 15.258C9.60198 16.1236 10.7759 16.6098 12 16.6098C13.2241 16.6098 14.398 16.1236 15.2636 15.258C16.1291 14.3925 16.6154 13.2185 16.6154 11.9945C16.6154 10.7704 16.1291 9.59644 15.2636 8.73089C14.398 7.86534 13.2241 7.37908 12 7.37908Z"/>
      </svg>
    `;
  }

  function iconeRelogio() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function iconeCalendario() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M8 2v4M16 2v4M3 9h18" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }

  function iconeServico() {
    return `
      <svg viewBox="0 0 24 27" aria-hidden="true">
        <path d="M7.30434 12.4615C5.92061 12.4615 4.59354 11.9145 3.61509 10.9407C2.63664 9.967 2.08696 8.64632 2.08696 7.26923V3.11538C2.08696 2.83997 2.19689 2.57583 2.39258 2.38108C2.58827 2.18633 2.85369 2.07692 3.13043 2.07692H4.17391C4.45066 2.07692 4.71607 1.96751 4.91176 1.77276C5.10745 1.57802 5.21739 1.31388 5.21739 1.03846C5.21739 0.763044 5.10745 0.498908 4.91176 0.304158C4.71607 0.109409 4.45066 0 4.17391 0H3.13043C2.30019 0 1.50395 0.328227 0.916883 0.912475C0.329813 1.49672 0 2.28913 0 3.11538V7.26923C0.00134131 8.44242 0.288805 9.59775 0.837704 10.636C1.3866 11.6743 2.18053 12.5644 3.1513 13.23C4.08493 14.0476 4.84196 15.0453 5.37649 16.1628C5.91101 17.2802 6.21189 18.4941 6.26087 19.7308C6.26087 21.6587 7.03043 23.5076 8.40026 24.8709C9.77009 26.2341 11.628 27 13.5652 27C15.5024 27 17.3603 26.2341 18.7302 24.8709C20.1 23.5076 20.8696 21.6587 20.8696 19.7308V18.5469C21.8532 18.2942 22.7104 17.6931 23.2806 16.8563C23.8508 16.0195 24.0947 15.0045 23.9667 14.0016C23.8387 12.9986 23.3475 12.0765 22.5853 11.4082C21.823 10.7399 20.842 10.3711 19.8261 10.3711C18.8102 10.3711 17.8291 10.7399 17.0669 11.4082C16.3046 12.0765 15.8134 12.9986 15.6854 14.0016C15.5574 15.0045 15.8014 16.0195 16.3715 16.8563C16.9417 17.6931 17.799 18.2942 18.7826 18.5469V19.7308C18.7826 21.1079 18.2329 22.4285 17.2545 23.4023C16.276 24.376 14.9489 24.9231 13.5652 24.9231C12.1815 24.9231 10.8544 24.376 9.87596 23.4023C8.89751 22.4285 8.34782 21.1079 8.34782 19.7308C8.39944 18.4926 8.70357 17.2778 9.24173 16.1602C9.77988 15.0427 10.5408 14.0457 11.4783 13.23C12.4452 12.5621 13.235 11.6709 13.7802 10.6328C14.3254 9.59472 14.6097 8.44058 14.6087 7.26923V3.11538C14.6087 2.28913 14.2789 1.49672 13.6918 0.912475C13.1047 0.328227 12.3085 0 11.4783 0H10.4348C10.158 0 9.89262 0.109409 9.69693 0.304158C9.50124 0.498908 9.3913 0.763044 9.3913 1.03846C9.3913 1.31388 9.50124 1.57802 9.69693 1.77276C9.89262 1.96751 10.158 2.07692 10.4348 2.07692H11.4783C11.755 2.07692 12.0204 2.18633 12.2161 2.38108C12.4118 2.57583 12.5217 2.83997 12.5217 3.11538V7.26923C12.5217 7.95109 12.3868 8.62628 12.1246 9.25624C11.8624 9.8862 11.4781 10.4586 10.9936 10.9407C10.5091 11.4229 9.93396 11.8054 9.30095 12.0663C8.66795 12.3272 7.9895 12.4615 7.30434 12.4615ZM19.8261 16.6154C19.2726 16.6154 18.7418 16.3966 18.3504 16.0071C17.959 15.6176 17.7391 15.0893 17.7391 14.5385C17.7391 13.9876 17.959 13.4594 18.3504 13.0699C18.7418 12.6804 19.2726 12.4615 19.8261 12.4615C20.3796 12.4615 20.9104 12.6804 21.3018 13.0699C21.6932 13.4594 21.913 13.9876 21.913 14.5385C21.913 15.0893 21.6932 15.6176 21.3018 16.0071C20.9104 16.3966 20.3796 16.6154 19.8261 16.6154Z"/>
      </svg>
    `;
  }

  function iconeTipo() {
    return `
      <svg viewBox="0 0 48 55" aria-hidden="true">
        <path d="M24 27.5C27.6373 27.5 31.1255 26.0513 33.6975 23.4727C36.2694 20.8941 37.7143 17.3967 37.7143 13.75C37.7143 10.1033 36.2694 6.60591 33.6975 4.02728C31.1255 1.44866 27.6373 0 24 0C20.3627 0 16.8745 1.44866 14.3025 4.02728C11.7306 6.60591 10.2857 10.1033 10.2857 13.75C10.2857 17.3967 11.7306 20.8941 14.3025 23.4727C16.8745 26.0513 20.3627 27.5 24 27.5ZM13.7143 33.4297C5.78571 35.7607 0 43.1084 0 51.8096C0 53.5713 1.425 55 3.18214 55H44.8179C46.575 55 48 53.5713 48 51.8096C48 43.1084 42.2143 35.7607 34.2857 33.4297V38.8867C37.2429 39.6494 39.4286 42.3457 39.4286 45.5469V49.8438C39.4286 50.7891 38.6571 51.5625 37.7143 51.5625H36C35.0571 51.5625 34.2857 50.7891 34.2857 49.8438C34.2857 48.8984 35.0571 48.125 36 48.125V45.5469C36 43.6455 34.4679 42.1094 32.5714 42.1094C30.675 42.1094 29.1429 43.6455 29.1429 45.5469V48.125C30.0857 48.125 30.8571 48.8984 30.8571 49.8438C30.8571 50.7891 30.0857 51.5625 29.1429 51.5625H27.4286C26.4857 51.5625 25.7143 50.7891 25.7143 49.8438V45.5469C25.7143 42.3457 27.9 39.6494 30.8571 38.8867V32.7529C30.2143 32.6885 29.5607 32.6562 28.8964 32.6562H19.1036C18.4393 32.6562 17.7857 32.6885 17.1429 32.7529V39.7783C19.6179 40.5195 21.4286 42.8184 21.4286 45.5469C21.4286 48.8662 18.7393 51.5625 15.4286 51.5625C12.1179 51.5625 9.42857 48.8662 9.42857 45.5469C9.42857 42.8184 11.2393 40.5195 13.7143 39.7783V33.4297ZM15.4286 48.125C16.1106 48.125 16.7646 47.8534 17.2468 47.3699C17.7291 46.8864 18 46.2306 18 45.5469C18 44.8631 17.7291 44.2074 17.2468 43.7239C16.7646 43.2404 16.1106 42.9688 15.4286 42.9688C14.7466 42.9688 14.0925 43.2404 13.6103 43.7239C13.1281 44.2074 12.8571 44.8631 12.8571 45.5469C12.8571 46.2306 13.1281 46.8864 13.6103 47.3699C14.0925 47.8534 14.7466 48.125 15.4286 48.125Z"/>
      </svg>
    `;
  }

  function iconeRota() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.247 10.279C17.73 10.752 18.365 10.988 19 10.988C19.635 10.988 20.27 10.752 20.752 10.279L22.535 8.535C24.485 6.585 24.485 3.413 22.535 1.464C21.591 0.52 20.335 0 19 0C17.665 0 16.409 0.52 15.464 1.464C13.515 3.414 13.515 6.586 15.472 8.543L17.247 10.279ZM20.501 4.787C20.501 5.615 19.829 6.287 19.001 6.287C18.173 6.287 17.501 5.615 17.501 4.787C17.501 3.959 18.173 3.287 19.001 3.287C19.829 3.287 20.501 3.959 20.501 4.787ZM4 22C4 23.105 3.105 24 2 24C0.895 24 0 23.105 0 22C0 20.895 0.895 20 2 20C3.105 20 4 20.895 4 22ZM14.5 16C14.5 17.105 13.605 18 12.5 18C11.395 18 10.5 17.105 10.5 16C10.5 14.895 11.395 14 12.5 14C13.605 14 14.5 14.895 14.5 16ZM2 13C2 10.794 3.794 9 6 9H13C13.552 9 14 9.448 14 10C14 10.552 13.552 11 13 11H6C4.897 11 4 11.897 4 13C4 14.103 4.897 15 6 15H8C8.552 15 9 15.448 9 16C9 16.552 8.552 17 8 17H6C3.794 17 2 15.206 2 13ZM24 19C24 21.206 22.206 23 20 23H7C6.448 23 6 22.552 6 22C6 21.448 6.448 21 7 21H20C21.103 21 22 20.103 22 19C22 17.897 21.103 17 20 17H17C16.448 17 16 16.552 16 16C16 15.448 16.448 15 17 15H20C22.206 15 24 16.794 24 19Z"/>
      </svg>
    `;
  }

  function iconeProfissional() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9Zm0 2c-4.8 0-8.5 2.8-8.5 6.4c0 .9.7 1.6 1.6 1.6h13.8c.9 0 1.6-.7 1.6-1.6C20.5 16.8 16.8 14 12 14Z"/>
      </svg>
    `;
  }
})();
