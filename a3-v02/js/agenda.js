(function () {
  "use strict";

  const estadoAgenda = {
    usuario: null,
    agendamentos: [],
    abaAtual: "proximos",
    agendamentoSelecionado: null,
  };

  document.addEventListener("DOMContentLoaded", iniciarAgenda);

  function iniciarAgenda() {
    try {
      const usuarioLogado = obterUsuarioLogado();

      if (!usuarioLogado) {
        window.location.href = "login.html";
        return;
      }

      estadoAgenda.usuario = usuarioLogado;
      estadoAgenda.agendamentos = obterAgendamentosDoUsuario(usuarioLogado.cpf);

      configurarEventos();
      renderizarAgenda();
      mostrarEtapa("step-agenda-lista");
    } catch (erro) {
      console.error("Erro ao carregar agenda:", erro);
      mostrarErroNaTela("Não foi possível carregar sua agenda.");
    }
  }

  function obterUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("viva_usuario_logado") || "null");
  }

  function obterAgendamentosDoUsuario(cpf) {
    const agendamentos = JSON.parse(
      localStorage.getItem("viva_agendamentos") || "[]",
    );

    return agendamentos.filter((agendamento) => {
      return agendamento.cpf === cpf;
    });
  }

  function configurarEventos() {
    document.querySelectorAll("[data-tab]").forEach((botao) => {
      botao.addEventListener("click", () => {
        estadoAgenda.abaAtual = botao.dataset.tab;
        atualizarTabs();
        renderizarAgenda();
      });
    });

    escutarClique("btn-voltar", voltar);
    escutarClique("btn-baixar-comprovante", baixarComprovanteSelecionado);
    escutarClique("btn-cancelar-agendamento", abrirConfirmacaoCancelamento);
    escutarClique("btn-manter-agendamento", () => mostrarEtapa("step-detalhes"));
    escutarClique("btn-confirmar-cancelamento", confirmarCancelamento);
    escutarClique("btn-ir-agenda", () => {
      estadoAgenda.abaAtual = "historico";
      atualizarTabs();
      estadoAgenda.agendamentos = obterAgendamentosDoUsuario(estadoAgenda.usuario.cpf);
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
    document.querySelectorAll("[data-tab]").forEach((botao) => {
      const ativa = botao.dataset.tab === estadoAgenda.abaAtual;
      botao.classList.toggle("active", ativa);
    });
  }

  function renderizarAgenda() {
    const lista = document.getElementById("lista-agendamentos");

    if (!lista) {
      mostrarErroNaTela("Lista de agendamentos não encontrada.");
      return;
    }

    const agendamentos = filtrarAgendamentosPorAba();

    lista.innerHTML = "";

    if (agendamentos.length === 0) {
      lista.innerHTML = montarEstadoVazio();
      return;
    }

    agendamentos.forEach((agendamento) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "agenda-card";

      card.innerHTML = montarCardAgendamento(agendamento);

      card.addEventListener("click", () => {
        estadoAgenda.agendamentoSelecionado = agendamento;
        renderizarDetalhes(agendamento);
        mostrarEtapa("step-detalhes");
      });

      lista.appendChild(card);
    });
  }

  function filtrarAgendamentosPorAba() {
    const agora = new Date();

    const agendamentos = estadoAgenda.agendamentos.map((agendamento) => {
      return {
        ...agendamento,
        statusCalculado: obterStatusCalculado(agendamento),
      };
    });

    if (estadoAgenda.abaAtual === "proximos") {
      return agendamentos
        .filter((agendamento) => {
          return (
            agendamento.statusCalculado === "confirmado" &&
            criarDataHora(agendamento.data, agendamento.hora) >= agora
          );
        })
        .sort((a, b) => {
          return criarDataHora(a.data, a.hora) - criarDataHora(b.data, b.hora);
        });
    }

    return agendamentos
      .filter((agendamento) => {
        return agendamento.statusCalculado !== "confirmado";
      })
      .sort((a, b) => {
        const dataA = criarDataHora(a.data, a.hora);
        const dataB = criarDataHora(b.data, b.hora);

        return Math.abs(dataA - agora) - Math.abs(dataB - agora);
      });
  }

  function obterStatusCalculado(agendamento) {
    const statusOriginal = normalizarStatus(agendamento.status);
    const dataHora = criarDataHora(agendamento.data, agendamento.hora);
    const agora = new Date();

    if (statusOriginal === "confirmado" && dataHora < agora) {
      return "realizado";
    }

    return statusOriginal;
  }

  function normalizarStatus(status) {
    const valor = String(status || "confirmado")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (valor.includes("cancel")) return "cancelado";
    if (valor.includes("nao") || valor.includes("no-show")) return "nao-compareceu";
    if (valor.includes("realiz")) return "realizado";

    return "confirmado";
  }

  function montarCardAgendamento(agendamento) {
    const data = obterPartesData(agendamento.data);
    const status = agendamento.statusCalculado || obterStatusCalculado(agendamento);
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
      mostrarErroNaTela("Área de detalhes não encontrada.");
      return;
    }

    const status = obterStatusCalculado(agendamento);
    const podeCancelar = status === "confirmado";
    const dataFormatada = formatarDataCompleta(agendamento.data);

    if (btnCancelar) {
      btnCancelar.hidden = !podeCancelar;
    }

    container.innerHTML = `
      <div class="details-card">
        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeServico()}</span>
          <div>
            <span class="details-label">Serviço</span>
            <span class="details-value">${agendamento.servico || obterNomeServico(agendamento.categoria)}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconePessoa()}</span>
          <div>
            <span class="details-label">Tipo</span>
            <span class="details-value">${agendamento.item || agendamento.especialidade || "Não informado"}</span>
          </div>
        </div>

        <div class="details-date-highlight">
          ${iconeCalendario()}
          <span>${dataFormatada}</span>
          <strong>às ${agendamento.hora}</strong>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeLocal()}</span>
          <div>
            <span class="details-label">Local</span>
            <span class="details-value">${agendamento.unidadeNome || "Unidade não informada"}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconeRota()}</span>
          <div>
            <span class="details-label">Endereço</span>
            <span class="details-value">${agendamento.endereco || "Endereço não informado"}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">${iconePessoa()}</span>
          <div>
            <span class="details-label">Profissional/Equipe</span>
            <span class="details-value">${agendamento.profissional || "Equipe da unidade"}</span>
          </div>
        </div>

        <div class="details-item">
          <span class="details-icon" aria-hidden="true">!</span>
          <div>
            <span class="details-label">Status</span>
            <span class="details-value">${obterTextoStatus(status)}</span>
          </div>
        </div>
      </div>
    `;
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

    estadoAgenda.agendamentos = obterAgendamentosDoUsuario(estadoAgenda.usuario.cpf);
    estadoAgenda.agendamentoSelecionado = {
      ...selecionado,
      status: "cancelado",
    };

    mostrarEtapa("step-cancelado");
  }

  function baixarComprovanteSelecionado() {
    const agendamento = estadoAgenda.agendamentoSelecionado;

    if (!agendamento) return;

    const conteudo = `
VIVA+ — COMPROVANTE DE AGENDAMENTO

Paciente: ${estadoAgenda.usuario.nomeCompleto || "Paciente"}
CPF: ${estadoAgenda.usuario.cpf}

Serviço: ${agendamento.servico || obterNomeServico(agendamento.categoria)}
Tipo: ${agendamento.item || agendamento.especialidade || "Não informado"}
Data: ${formatarDataCompleta(agendamento.data)}
Horário: ${agendamento.hora}

Local: ${agendamento.unidadeNome || "Unidade não informada"}
Endereço: ${agendamento.endereco || "Endereço não informado"}
Profissional/Equipe: ${agendamento.profissional || "Equipe da unidade"}

Status: ${obterTextoStatus(obterStatusCalculado(agendamento))}
Código: ${agendamento.id}
    `.trim();

    const arquivo = new Blob([conteudo], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `comprovante-${agendamento.id}.txt`;
    link.click();

    URL.revokeObjectURL(url);
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
      mostrarErroNaTela(`Etapa não encontrada: ${idEtapa}`);
      return;
    }

    document.querySelectorAll(".agenda-step").forEach((secao) => {
      secao.hidden = true;
    });

    etapa.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
        ? "Você não possui agendamentos futuros confirmados."
        : "Você ainda não possui agendamentos no histórico.";

    return `
      <div class="empty-state">
        <h2 class="agenda-card-title">Nenhum agendamento encontrado</h2>
        <p class="agenda-subtitle">${texto}</p>
      </div>
    `;
  }

  function criarDataHora(dataISO, hora) {
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const [horas, minutos] = String(hora || "00:00").split(":").map(Number);

    return new Date(ano, mes - 1, dia, horas, minutos || 0);
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3v5a4 4 0 0 0 8 0V3" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="19" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }

  function iconePessoa() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21a8 8 0 0 1 16 0"/>
      </svg>
    `;
  }

  function iconeRota() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.247 10.279C17.73 10.752 18.365 10.988 19 10.988C19.635 10.988 20.27 10.752 20.752 10.279L22.535 8.535C24.485 6.585 24.485 3.413 22.535 1.464C21.591 0.52 20.335 0 19 0C17.665 0 16.409 0.52 15.464 1.464C13.515 3.414 13.515 6.586 15.472 8.543L17.247 10.279Z"/>
      </svg>
    `;
  }
})();