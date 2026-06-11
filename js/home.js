/*
  home.js
  Controla a pagina inicial depois do login:
  - mostra o primeiro nome do paciente;
  - exibe o proximo agendamento salvo no banco simulado;
  - configura o botao de sair.
*/

document.addEventListener("DOMContentLoaded", () => {
  const usuarioLogado = JSON.parse(
    sessionStorage.getItem("viva_usuario_logado") || "null",
  );

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  const nomePaciente = document.getElementById("nome-paciente");
  const btnSair = document.getElementById("btn-sair");

  if (nomePaciente && usuarioLogado.nomeCompleto) {
    const primeiroNome = usuarioLogado.nomeCompleto.trim().split(" ")[0];
    nomePaciente.textContent = primeiroNome;
  }

  renderizarProximoAgendamento(usuarioLogado);

  if (btnSair) {
    btnSair.addEventListener("click", () => {
      sessionStorage.removeItem("viva_usuario_logado");
      window.location.href = "login.html";
    });
  }
});

function renderizarProximoAgendamento(usuarioLogado) {
  const card = document.querySelector(".next-appointment-card");

  if (!card) return;

  const proximo = window.VivaAgendamentos.obterProximo(usuarioLogado.cpf);

  if (!proximo) {
    card.innerHTML = `
      <div class="card-content">
        <div class="card-header">
          <span class="badge-status">Agenda</span>
        </div>
        <h3 class="appointment-title">Nenhum agendamento próximo</h3>
        <p class="appointment-date">Quando você marcar uma consulta, exame ou vacina, o próximo atendimento aparecerá aqui.</p>
      </div>
      <button class="btn-secondary-small" type="button" onclick="window.location.href='agenda.html'">
        Ver agenda
      </button>
    `;

    return;
  }

  const tipo = obterTituloHome(proximo);
  const dataTexto = formatarDataHome(proximo.data);

  card.innerHTML = `
    <div class="card-content">
      <div class="card-header">
        <span class="badge-status">Próximo ${obterCategoriaLabel(proximo.categoria)}</span>
      </div>

      <h3 class="appointment-title">${tipo}</h3>
      <p class="appointment-date">${dataTexto}, às ${proximo.hora}</p>
    </div>

    <button class="btn-secondary-small" type="button" onclick="window.location.href='agenda.html'">
      Ver detalhes
    </button>
  `;
}

function obterTituloHome(agendamento) {
  if (agendamento.categoria === "consulta") {
    return agendamento.profissional
      ? `${agendamento.profissional} — ${agendamento.especialidade || agendamento.item}`
      : agendamento.item || "Consulta Médica";
  }

  if (agendamento.categoria === "exame") {
    return agendamento.item || agendamento.titulo || "Exame";
  }

  if (agendamento.categoria === "vacina") {
    return agendamento.item || agendamento.titulo || "Vacina";
  }

  return agendamento.titulo || "Agendamento";
}

function obterCategoriaLabel(categoria) {
  const labels = {
    consulta: "Consulta",
    exame: "Exame",
    vacina: "Vacina",
  };

  return labels[categoria] || "Agendamento";
}

function formatarDataHome(dataISO) {
  if (!dataISO) return "Data não informada";

  const [ano, mes, dia] = String(dataISO).split("-").map(Number);

  if (!ano || !mes || !dia) {
    return dataISO;
  }

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

  return `Dia ${dia} de ${meses[mes - 1]}`;
}
