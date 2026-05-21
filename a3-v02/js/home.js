document.addEventListener("DOMContentLoaded", () => {
  const usuarioLogado = JSON.parse(
    sessionStorage.getItem("viva_usuario_logado") || "null",
  );

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  carregarNomePaciente(usuarioLogado);
  configurarBotaoSair();
  carregarProximoAgendamento(usuarioLogado.cpf);
});

/* =========================================
   NOME DO PACIENTE
   ========================================= */

function carregarNomePaciente(usuarioLogado) {
  const nomePaciente = document.getElementById("nome-paciente");

  if (nomePaciente && usuarioLogado.nomeCompleto) {
    const primeiroNome = usuarioLogado.nomeCompleto.trim().split(" ")[0];
    nomePaciente.textContent = primeiroNome;
  }
}

/* =========================================
   BOTÃO SAIR
   ========================================= */

function configurarBotaoSair() {
  const btnSair = document.getElementById("btn-sair");

  if (btnSair) {
    btnSair.addEventListener("click", () => {
      sessionStorage.removeItem("viva_usuario_logado");
      window.location.href = "login.html";
    });
  }
}

/* =========================================
   PRÓXIMO AGENDAMENTO
   ========================================= */

async function carregarProximoAgendamento(cpfUsuario) {
  const tipoElemento = document.getElementById("proximo-tipo");
  const tituloElemento = document.getElementById("proximo-titulo");
  const dataElemento = document.getElementById("proximo-data");
  const botaoDetalhes = document.getElementById("btn-ver-detalhes");

  if (!tipoElemento || !tituloElemento || !dataElemento || !botaoDetalhes) {
    console.warn("Elementos do card de próximo agendamento não encontrados.");
    return;
  }

  try {
    const resposta = await fetch("./data/agendamento.json");

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar o arquivo agendamento.json.");
    }

    const agendamentos = await resposta.json();

    const proximoAgendamento = encontrarProximoAgendamento(
      agendamentos,
      cpfUsuario,
    );

    if (!proximoAgendamento) {
      tipoElemento.textContent = "Sem agendamentos";
      tituloElemento.textContent = "Você não possui agendamentos futuros.";
      dataElemento.textContent =
        "Quando desejar, agende uma consulta, exame ou vacina.";
      botaoDetalhes.hidden = true;
      return;
    }

    tipoElemento.textContent = formatarTipo(proximoAgendamento.tipo);
    tituloElemento.textContent = montarTituloAgendamento(proximoAgendamento);
    dataElemento.textContent = montarDataAgendamento(proximoAgendamento);

    botaoDetalhes.hidden = false;

    botaoDetalhes.addEventListener("click", () => {
      sessionStorage.setItem(
        "viva_agendamento_selecionado",
        JSON.stringify(proximoAgendamento),
      );

      window.location.href = "agenda.html";
    });
  } catch (erro) {
    console.error("Erro ao carregar próximo agendamento:", erro);

    tipoElemento.textContent = "Agendamento";
    tituloElemento.textContent =
      "Não foi possível carregar seu próximo agendamento.";
    dataElemento.textContent = "Tente novamente mais tarde.";
    botaoDetalhes.hidden = true;
  }
}

/* =========================================
   ENCONTRAR O AGENDAMENTO MAIS PRÓXIMO
   ========================================= */

function encontrarProximoAgendamento(agendamentos, cpfUsuario) {
  const agora = new Date();

  const agendamentosDoUsuario = agendamentos.filter((agendamento) => {
    return agendamento.cpf === cpfUsuario;
  });

  const agendamentosFuturos = agendamentosDoUsuario.filter((agendamento) => {
    const dataHoraAgendamento = criarDataHora(
      agendamento.data,
      agendamento.hora,
    );

    return dataHoraAgendamento >= agora && agendamento.status !== "cancelado";
  });

  agendamentosFuturos.sort((a, b) => {
    const dataA = criarDataHora(a.data, a.hora);
    const dataB = criarDataHora(b.data, b.hora);

    return dataA - dataB;
  });

  return agendamentosFuturos[0];
}

/* =========================================
   FUNÇÕES DE FORMATAÇÃO
   ========================================= */

function criarDataHora(data, hora) {
  return new Date(`${data}T${hora}:00`);
}

function formatarTipo(tipo) {
  const tipos = {
    consulta: "Próxima consulta",
    exame: "Próximo exame",
    vacina: "Próxima vacina",
  };

  return tipos[tipo] || "Próximo agendamento";
}

function montarTituloAgendamento(agendamento) {
  if (agendamento.tipo === "consulta") {
    return `${agendamento.profissional} — ${agendamento.especialidade}`;
  }

  if (agendamento.tipo === "exame") {
    return agendamento.titulo || "Exame agendado";
  }

  if (agendamento.tipo === "vacina") {
    return agendamento.titulo || "Vacina agendada";
  }

  return agendamento.titulo || "Agendamento";
}

function montarDataAgendamento(agendamento) {
  const dataFormatada = formatarDataBR(agendamento.data);
  return `Dia ${dataFormatada}, às ${agendamento.hora}`;
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");

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

  const nomeMes = meses[Number(mes) - 1];

  return `${Number(dia)} de ${nomeMes}`;
}
