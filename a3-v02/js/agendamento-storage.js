(function () {
  "use strict";

  function limparCPF(cpf) {
    return String(cpf || "").replace(/\D/g, "");
  }

  function obterUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("viva_usuario_logado") || "null");
  }

  function obterTodos() {
    return JSON.parse(localStorage.getItem("viva_agendamentos") || "[]");
  }

  function salvarTodos(agendamentos) {
    localStorage.setItem("viva_agendamentos", JSON.stringify(agendamentos));
  }

  function listarDoUsuario(cpf) {
    const cpfLimpo = limparCPF(cpf);

    return obterTodos().filter((agendamento) => {
      return limparCPF(agendamento.cpf) === cpfLimpo;
    });
  }

  function criarDataHora(dataISO, hora) {
    if (!dataISO) return new Date(0);

    let ano;
    let mes;
    let dia;

    if (String(dataISO).includes("-")) {
      [ano, mes, dia] = String(dataISO).split("-").map(Number);
    } else if (String(dataISO).includes("/")) {
      [dia, mes, ano] = String(dataISO).split("/").map(Number);
    } else {
      return new Date(0);
    }

    const [horas, minutos] = String(hora || "00:00").split(":").map(Number);

    return new Date(ano, mes - 1, dia, horas || 0, minutos || 0);
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

  function obterStatusCalculado(agendamento) {
    const statusOriginal = normalizarStatus(agendamento.status);
    const dataHora = criarDataHora(agendamento.data, agendamento.hora);
    const agora = new Date();

    if (statusOriginal === "confirmado" && dataHora < agora) {
      return "realizado";
    }

    return statusOriginal;
  }

  function listarProximos(cpf) {
    const agora = new Date();

    return listarDoUsuario(cpf)
      .map((agendamento) => ({
        ...agendamento,
        statusCalculado: obterStatusCalculado(agendamento),
      }))
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

  function listarHistorico(cpf) {
    const agora = new Date();

    return listarDoUsuario(cpf)
      .map((agendamento) => ({
        ...agendamento,
        statusCalculado: obterStatusCalculado(agendamento),
      }))
      .filter((agendamento) => {
        return agendamento.statusCalculado !== "confirmado";
      })
      .sort((a, b) => {
        return criarDataHora(b.data, b.hora) - criarDataHora(a.data, a.hora);
      });
  }

  function obterProximo(cpf) {
    return listarProximos(cpf)[0] || null;
  }

  function salvarNovo(agendamento) {
    const agendamentos = obterTodos();
    agendamentos.push(agendamento);
    salvarTodos(agendamentos);
  }

  function atualizarStatus(id, novoStatus) {
    const atualizados = obterTodos().map((agendamento) => {
      if (agendamento.id === id) {
        return {
          ...agendamento,
          status: novoStatus,
          atualizadoEm: new Date().toISOString(),
        };
      }

      return agendamento;
    });

    salvarTodos(atualizados);
  }

  window.VivaAgendamentos = {
    limparCPF,
    obterUsuarioLogado,
    obterTodos,
    salvarTodos,
    listarDoUsuario,
    listarProximos,
    listarHistorico,
    obterProximo,
    salvarNovo,
    atualizarStatus,
    criarDataHora,
    normalizarStatus,
    obterStatusCalculado,
  };
})();