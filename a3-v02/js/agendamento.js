(function () {
  "use strict";

  /*
    agendamento.js
    Controla todo o passo a passo de agendamento:
    consulta, exame e vacina. Ele carrega dados do JSON, filtra as opcoes,
    controla voltar/cancelar e salva o atendimento confirmado no banco simulado.
  */

  const estadoAgendamento = {
    usuario: null,
    usuarioCompleto: null,
    unidades: [],
    categoria: null,
    itemSelecionado: null,
    tipoConsulta: null,
    unidade: null,
    servico: null,
    profissional: null,
    data: null,
    hora: null,
    agendamentoConfirmado: null,
  };

  const historicoEtapas = [];
  let etapaAntesCancelamento = null;

  document.addEventListener("DOMContentLoaded", iniciarPagina);

  async function iniciarPagina() {
    try {
      esconderTodasEtapas();

      const usuarioLogado = obterUsuarioLogado();

      if (!usuarioLogado) {
        window.location.href = "login.html";
        return;
      }

      estadoAgendamento.usuario = usuarioLogado;
      estadoAgendamento.categoria = obterTipoPelaURL();
      estadoAgendamento.unidades = await carregarJSONSeguro(
        "./data/unidades.json",
      );
      estadoAgendamento.usuarioCompleto =
        await obterUsuarioCompleto(usuarioLogado);

      configurarEventos();
      iniciarFluxoCorreto();
    } catch (erro) {
      console.error("Erro ao iniciar fluxo de agendamento:", erro);
      mostrarErroNaTela(
        "Nao foi possivel carregar os dados do Viva+. Verifique sua conexao, recarregue a pagina e tente novamente.",
      );
    }
  }

  function obterUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("viva_usuario_logado") || "null");
  }

  function obterTipoPelaURL() {
    const parametros = new URLSearchParams(window.location.search);
    const tipo = parametros.get("tipo");

    if (["consulta", "exame", "vacina"].includes(tipo)) {
      return tipo;
    }

    return "consulta";
  }

  async function carregarJSONSeguro(caminho) {
    const resposta = await fetch(caminho);

    if (!resposta.ok) {
      throw new Error(`Falha ao carregar ${caminho}`);
    }

    return await resposta.json();
  }

  async function obterUsuarioCompleto(usuarioLogado) {
    const usuarioDoLocalStorage = buscarUsuarioNoLocalStorage(
      usuarioLogado.cpf,
    );

    try {
      const usuariosJSON = await carregarJSONSeguro("./data/usuarios.json");
      const usuarioDoJSON = usuariosJSON.find((usuario) => {
        return usuario.cpf === usuarioLogado.cpf;
      });

      return normalizarUsuario({
        ...usuarioLogado,
        ...(usuarioDoLocalStorage || {}),
        ...(usuarioDoJSON || {}),
      });
    } catch (erro) {
      console.warn(
        "Não foi possível carregar usuarios.json. Usando usuário da sessão/localStorage.",
        erro,
      );

      return normalizarUsuario({
        ...usuarioLogado,
        ...(usuarioDoLocalStorage || {}),
      });
    }
  }

  function buscarUsuarioNoLocalStorage(cpf) {
    const usuarios = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");

    return (
      usuarios.find((usuario) => {
        return usuario.cpf === cpf;
      }) || null
    );
  }

  function normalizarUsuario(usuario) {
    const encaminhamentos = usuario.encaminhamentos;

    if (!encaminhamentos) {
      return {
        ...usuario,
        encaminhamentos: {
          consultas: [],
          exames: [],
          vacinas: [],
        },
      };
    }

    if (Array.isArray(encaminhamentos)) {
      return {
        ...usuario,
        encaminhamentos: {
          consultas: encaminhamentos.map((item) => ({
            especialidade: item.especialidade || item.nome,
            status: item.status || "ativo",
          })),
          exames: [],
          vacinas: [],
        },
      };
    }

    return {
      ...usuario,
      encaminhamentos: {
        consultas: encaminhamentos.consultas || [],
        exames: encaminhamentos.exames || [],
        vacinas: encaminhamentos.vacinas || [],
      },
    };
  }

  function configurarEventos() {
    document.querySelectorAll("[data-consulta-tipo]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const tipo = botao.dataset.consultaTipo;

        if (tipo === "clinico") {
          selecionarClinicoGeral();
        }

        if (tipo === "especialista") {
          selecionarEspecialista();
        }
      });
    });

    document.querySelectorAll("[data-agendar-clinico]").forEach((botao) => {
      botao.addEventListener("click", selecionarClinicoGeral);
    });

    document.querySelectorAll("[data-voltar-home]").forEach((botao) => {
      botao.addEventListener("click", () => {
        irPara("home.html");
      });
    });

    escutarClique("btn-voltar", voltarEtapa);

    escutarClique("btn-confirmar-horario", () => {
      renderizarRevisao();
      mostrarEtapa("step-revisao");
    });

    escutarClique("btn-confirmar-agendamento", confirmarAgendamento);

    escutarClique("btn-cancelar-agendamento", mostrarConfirmacaoCancelamento);

    escutarClique("btn-continuar-agendamento", fecharConfirmacaoCancelamento);

    escutarClique("btn-confirmar-cancelamento", () => {
      irPara("home.html");
    });

    escutarClique("btn-voltar-home-sucesso", () => {
      irPara("home.html");
    });

    escutarClique("btn-baixar-comprovante", baixarComprovante);
  }

  function escutarClique(id, acao) {
    const elemento = document.getElementById(id);

    if (!elemento) {
      console.warn(`Elemento não encontrado: #${id}`);
      return;
    }

    elemento.addEventListener("click", acao);
  }

  function iniciarFluxoCorreto() {
    if (estadoAgendamento.categoria === "consulta") {
      mostrarEtapaSemHistorico("step-consulta-tipo");
      return;
    }

    iniciarFluxoDireto();
  }

  function selecionarClinicoGeral() {
    estadoAgendamento.categoria = "consulta";
    estadoAgendamento.tipoConsulta = "Clínico Geral";
    estadoAgendamento.itemSelecionado = {
      nome: "Clínico Geral",
      tipo: "consulta",
      descricao: "Consulta de avaliação inicial",
    };

    limparEscolhasPosteriores();
    renderizarLocais();
    mostrarEtapa("step-local");
  }

  function selecionarEspecialista() {
    estadoAgendamento.categoria = "consulta";
    estadoAgendamento.tipoConsulta = "Especialista";

    const encaminhamentos = obterItensPermitidos("consultas");

    if (encaminhamentos.length === 0) {
      mostrarBloqueio("consulta");
      return;
    }

    renderizarListaItens({
      titulo: "Especialidades disponíveis",
      subtitulo: "Encontramos encaminhamento para os atendimentos abaixo:",
      itens: encaminhamentos.map((item) => ({
        nome: item.especialidade || item.nome,
        descricao: "Encaminhamento disponível",
        tipo: "consulta",
      })),
    });

    mostrarEtapa("step-lista-itens");
  }

  function iniciarFluxoDireto() {
    const chave =
      estadoAgendamento.categoria === "exame" ? "exames" : "vacinas";
    const itensPermitidos = obterItensPermitidos(chave);

    if (itensPermitidos.length === 0) {
      mostrarBloqueio(estadoAgendamento.categoria);
      return;
    }

    const ehExame = estadoAgendamento.categoria === "exame";

    const itensDaLista = ehExame
      ? itensPermitidos.map((item) => ({
          nome: item.nome,
          descricao: "Pedido disponível",
          tipo: estadoAgendamento.categoria,
        }))
      : prepararVacinasPorIdade(itensPermitidos);

    const idadeUsuario = calcularIdade(
      estadoAgendamento.usuarioCompleto?.dataNascimento,
    );

    renderizarListaItens({
      titulo: ehExame ? "Exames disponíveis" : "Vacinas disponíveis",
      subtitulo: ehExame
        ? "Encontramos encaminhamento para os exames abaixo:"
        : idadeUsuario
          ? `Organizamos as vacinas pensando na sua idade: ${idadeUsuario} anos.`
          : "Organizamos as vacinas pensando na sua idade:",
      itens: itensDaLista,
    });

    mostrarEtapaSemHistorico("step-lista-itens");
  }

  function obterItensPermitidos(chave) {
    const encaminhamentos =
      estadoAgendamento.usuarioCompleto?.encaminhamentos || {};
    const lista = encaminhamentos[chave] || [];

    return lista.filter((item) => {
      return (item.status || "ativo") === "ativo";
    });
  }

  function prepararVacinasPorIdade(vacinas) {
    return vacinas
      .map((vacina) => {
        const recomendacao = obterRecomendacaoVacina(vacina.nome);

        return {
          nome: vacina.nome,
          descricao: recomendacao.descricao,
          tipo: "vacina",
          recomendacaoTexto: recomendacao.texto,
          recomendacaoDestaque: recomendacao.destaque,
        };
      })
      .sort((a, b) => {
        if (a.recomendacaoDestaque && !b.recomendacaoDestaque) return -1;
        if (!a.recomendacaoDestaque && b.recomendacaoDestaque) return 1;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }

  function obterRecomendacaoVacina(nomeVacina) {
    const idade = calcularIdade(estadoAgendamento.usuarioCompleto?.dataNascimento);
    const nomeNormalizado = normalizarTexto(nomeVacina);

    const recomendacaoPadrao = {
      texto: idade ? `Disponivel para ${idade} anos` : "Disponivel para agendar",
      descricao: "Dose disponivel para agendamento",
      destaque: false,
    };

    if (!idade) {
      return recomendacaoPadrao;
    }

    if (idade >= 60 && nomeNormalizado.includes("gripe")) {
      return {
        texto: "Recomendada para 60+",
        descricao: "Vacina anual importante para pessoas idosas",
        destaque: true,
      };
    }

    if (idade >= 60 && nomeNormalizado.includes("covid")) {
      return {
        texto: "Recomendada para 60+",
        descricao: "Reforco indicado para proteger pessoas idosas",
        destaque: true,
      };
    }

    if (idade >= 60 && nomeNormalizado.includes("febre")) {
      return {
        texto: "Disponivel para agendar",
        descricao: "Protecao contra febre amarela conforme seu historico vacinal",
        destaque: false,
      };
    }

    if (idade < 60 && nomeNormalizado.includes("febre")) {
      return {
        texto: "Recomendada ate 59 anos",
        descricao: "Vacina indicada para protecao contra febre amarela",
        destaque: true,
      };
    }

    if (idade < 60 && nomeNormalizado.includes("gripe")) {
      return {
        texto: "Anual conforme calendario",
        descricao: "Vacina anual disponivel para grupos indicados",
        destaque: false,
      };
    }

    if (idade < 60 && nomeNormalizado.includes("covid")) {
      return {
        texto: "Reforco conforme calendario",
        descricao: "Dose de reforco disponivel conforme sua faixa etaria",
        destaque: false,
      };
    }

    return recomendacaoPadrao;
  }

  function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;

    const partes = String(dataNascimento).split("/");
    if (partes.length !== 3) return null;

    const [dia, mes, ano] = partes.map(Number);
    if (!dia || !mes || !ano) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - ano;
    const mesAtual = hoje.getMonth() + 1;
    const aindaNaoFezAniversario =
      mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia);

    if (aindaNaoFezAniversario) {
      idade -= 1;
    }

    return idade;
  }

  function mostrarBloqueio(tipo) {
    const telasDeBloqueio = {
      consulta: "step-bloqueio-especialidade",
      exame: "step-bloqueio-exame",
      vacina: "step-bloqueio-vacina",
    };

    const idTela = telasDeBloqueio[tipo];

    if (!idTela) {
      mostrarErroNaTela("Tipo de bloqueio não reconhecido.");
      return;
    }

    mostrarEtapa(idTela);
  }

  function renderizarListaItens({ titulo, subtitulo, itens }) {
    const tituloElemento = document.getElementById("titulo-lista-itens");
    const subtituloElemento = document.getElementById("subtitulo-lista-itens");
    const lista = document.getElementById("lista-itens");

    if (!tituloElemento || !subtituloElemento || !lista) {
      mostrarErroNaTela("Elementos da lista de opções não foram encontrados.");
      return;
    }

    tituloElemento.textContent = titulo;
    subtituloElemento.textContent = subtitulo;
    lista.innerHTML = "";

    itens.forEach((item) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "item-card";
      botao.setAttribute(
        "aria-label",
        `Selecionar ${item.nome}. ${item.descricao}. ${item.recomendacaoTexto || ""}`,
      );

      botao.innerHTML = `
        <span class="item-icon" aria-hidden="true">
          ${obterIconeItem(item.nome, item.tipo)}
        </span>

        <span class="item-info">
          <span class="item-title">${item.nome}</span>
          <span class="item-desc">${item.descricao}</span>
          ${
            item.recomendacaoTexto
              ? `<span class="item-badge ${item.recomendacaoDestaque ? "is-recommended" : ""}">${item.recomendacaoTexto}</span>`
              : ""
          }
        </span>

        <svg class="item-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path 
            d="M9 18L15 12L9 6" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
          />
        </svg>
      `;

      botao.addEventListener("click", () => {
        estadoAgendamento.itemSelecionado = item;
        limparEscolhasPosteriores();
        renderizarLocais();
        mostrarEtapa("step-local");
      });

      lista.appendChild(botao);
    });
  }

  function renderizarLocais() {
    const lista = document.getElementById("lista-locais");

    if (!lista) {
      mostrarErroNaTela("Lista de locais não encontrada.");
      return;
    }

    let locais = obterLocaisDisponiveis();

    locais = adicionarDistanciaNosLocais(locais);
    locais = ordenarLocaisPorDistancia(locais);

    lista.innerHTML = "";

    if (locais.length === 0) {
      lista.innerHTML = `
      <div class="info-alert" role="alert" aria-live="assertive">
        <span class="info-alert-icon" aria-hidden="true">!</span>
        <p>Não encontramos unidades disponíveis para esse atendimento.</p>
      </div>
    `;
      return;
    }

    locais.forEach(({ unidade, servico, distanciaKm }) => {
      const card = document.createElement("article");
      card.className = "location-card";
      card.setAttribute(
        "aria-label",
        `Unidade ${unidade.nome}. Endereco: ${unidade.endereco}. ${formatarDistancia(distanciaKm)} de voce.`,
      );

      card.innerHTML = `
      <div class="location-card-header">
        <span class="location-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path 
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" 
              fill="currentColor" 
            />
          </svg>
        </span>

        <h2 class="location-name">${unidade.nome}</h2>
      </div>

      <p class="location-address">${unidade.endereco}</p>

      <div class="location-divider"></div>

      <div class="location-distance">
        <span class="location-distance-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path 
              d="M17.247 10.279C17.73 10.752 18.365 10.988 19 10.988C19.635 10.988 20.27 10.752 20.752 10.279L22.535 8.535C24.485 6.585 24.485 3.413 22.535 1.464C21.591 0.52 20.335 0 19 0C17.665 0 16.409 0.52 15.464 1.464C13.515 3.414 13.515 6.586 15.472 8.543L17.247 10.279ZM20.501 4.787C20.501 5.615 19.829 6.287 19.001 6.287C18.173 6.287 17.501 5.615 17.501 4.787C17.501 3.959 18.173 3.287 19.001 3.287C19.829 3.287 20.501 3.959 20.501 4.787ZM4 22C4 23.105 3.105 24 2 24C0.895 24 0 23.105 0 22C0 20.895 0.895 20 2 20C3.105 20 4 20.895 4 22ZM14.5 16C14.5 17.105 13.605 18 12.5 18C11.395 18 10.5 17.105 10.5 16C10.5 14.895 11.395 14 12.5 14C13.605 14 14.5 14.895 14.5 16ZM2 13C2 10.794 3.794 9 6 9H13C13.552 9 14 9.448 14 10C14 10.552 13.552 11 13 11H6C4.897 11 4 11.897 4 13C4 14.103 4.897 15 6 15H8C8.552 15 9 15.448 9 16C9 16.552 8.552 17 8 17H6C3.794 17 2 15.206 2 13ZM24 19C24 21.206 22.206 23 20 23H7C6.448 23 6 22.552 6 22C6 21.448 6.448 21 7 21H20C21.103 21 22 20.103 22 19C22 17.897 21.103 17 20 17H17C16.448 17 16 16.552 16 16C16 15.448 16.448 15 17 15H20C22.206 15 24 16.794 24 19Z" 
              fill="currentColor"
            />
          </svg>
        </span>

        <span>A ${formatarDistancia(distanciaKm)} de você</span>
      </div>

      <div class="location-actions">
        <button type="button" class="btn btn-primary location-select-button" aria-label="Selecionar ${unidade.nome} para este agendamento">
          Selecionar local
        </button>

        <a class="btn btn-secondary location-maps-button" href="${criarLinkMaps(unidade)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir o endereço ${unidade.endereco} no Google Maps em uma nova aba">
          Ver no Maps
        </a>
      </div>
    `;

      const botaoSelecionar = card.querySelector(".location-select-button");

      botaoSelecionar.addEventListener("click", () => {
        estadoAgendamento.unidade = unidade;
        estadoAgendamento.servico = servico;
        estadoAgendamento.profissional = null;
        estadoAgendamento.data = null;
        estadoAgendamento.hora = null;

        renderizarProfissionais();
      });

      lista.appendChild(card);
    });
  }

  function criarLinkMaps(unidade) {
    const consulta =
      unidade?.endereco ||
      unidade?.mapsQuery ||
      unidade?.nome ||
      "";

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
  }

  function obterLocaisDisponiveis() {
    const item = estadoAgendamento.itemSelecionado;

    if (!item) return [];

    const nomeSelecionado = normalizarTexto(item.nome);
    const categoria = estadoAgendamento.categoria;
    const resultado = [];

    estadoAgendamento.unidades.forEach((unidade) => {
      (unidade.servicosAgendaveis || []).forEach((servico) => {
        if (servico.categoria !== categoria) return;

        const valorComparacao =
          categoria === "consulta" ? servico.especialidade : servico.nome;

        if (normalizarTexto(valorComparacao) === nomeSelecionado) {
          resultado.push({ unidade, servico });
        }
      });
    });

    return resultado;
  }

  function adicionarDistanciaNosLocais(locais) {
    const coordenadasUsuario = estadoAgendamento.usuarioCompleto?.coordenadas;

    return locais.map((local) => {
      const coordenadasUnidade = local.unidade.coordenadas;

      if (!coordenadasUsuario || !coordenadasUnidade) {
        return {
          ...local,
          distanciaKm: null,
        };
      }

      const distanciaKm = calcularDistanciaKm(
        coordenadasUsuario.lat,
        coordenadasUsuario.lon,
        coordenadasUnidade.lat,
        coordenadasUnidade.lon,
      );

      return {
        ...local,
        distanciaKm,
      };
    });
  }

  function ordenarLocaisPorDistancia(locais) {
    return locais.sort((a, b) => {
      if (a.distanciaKm === null) return 1;
      if (b.distanciaKm === null) return -1;

      return a.distanciaKm - b.distanciaKm;
    });
  }

  function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const raioTerraKm = 6371;

    const diferencaLat = converterGrausParaRadianos(lat2 - lat1);
    const diferencaLon = converterGrausParaRadianos(lon2 - lon1);

    const origemLat = converterGrausParaRadianos(lat1);
    const destinoLat = converterGrausParaRadianos(lat2);

    const a =
      Math.sin(diferencaLat / 2) * Math.sin(diferencaLat / 2) +
      Math.cos(origemLat) *
        Math.cos(destinoLat) *
        Math.sin(diferencaLon / 2) *
        Math.sin(diferencaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return raioTerraKm * c;
  }

  function converterGrausParaRadianos(graus) {
    return graus * (Math.PI / 180);
  }

  function formatarDistancia(distanciaKm) {
    if (distanciaKm === null || Number.isNaN(distanciaKm)) {
      return "distância não informada";
    }

    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toFixed(1).replace(".", ",")} km`;
  }

  function renderizarProfissionais() {
    const resumo = document.getElementById("resumo-profissional");
    const lista = document.getElementById("lista-profissionais");

    if (!resumo || !lista) {
      mostrarErroNaTela(
        "Elementos da etapa de profissional não foram encontrados.",
      );
      return;
    }

    const profissionais = obterProfissionaisDisponiveis();

    if (profissionais.length === 0) {
      estadoAgendamento.profissional = criarEquipeUnidade();
      renderizarDatas();
      mostrarEtapa("step-data");
      return;
    }

    resumo.innerHTML = montarResumo({
      servico: obterNomeServico(),
      tipo: estadoAgendamento.itemSelecionado.nome,
      local: estadoAgendamento.unidade.nome,
    });

    lista.innerHTML = "";

    profissionais.forEach((profissional) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "professional-card";

      const quantidadeHorarios =
        contarHorariosDisponiveisDoProfissional(profissional);
      botao.setAttribute(
        "aria-label",
        `Selecionar ${profissional.nome}. ${quantidadeHorarios} horarios disponiveis.`,
      );

      botao.innerHTML = `
        <span class="professional-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0v1H5v-1Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span class="professional-info">
          <span class="professional-name">${profissional.nome}</span>
          <span class="professional-specialty">${profissional.especialidade || estadoAgendamento.itemSelecionado.nome}</span>
          <span class="professional-count">${quantidadeHorarios} horários disponíveis</span>
        </span>
      `;

      botao.addEventListener("click", () => {
        estadoAgendamento.profissional = profissional;
        estadoAgendamento.data = null;
        estadoAgendamento.hora = null;

        renderizarDatas();
        mostrarEtapa("step-data");
      });

      lista.appendChild(botao);
    });

    mostrarEtapa("step-profissional");
  }

  function obterProfissionaisDisponiveis() {
    const ids = estadoAgendamento.servico?.profissionaisDisponiveis || [];

    if (ids.length === 0) {
      return [];
    }

    return ids
      .map((id) => {
        return (estadoAgendamento.unidade?.profissionais || []).find(
          (profissional) => profissional.id === id,
        );
      })
      .filter(Boolean);
  }

  function contarHorariosDisponiveisDoProfissional(profissional) {
    const profissionalAnterior = estadoAgendamento.profissional;
    estadoAgendamento.profissional = profissional;

    const total = gerarDatasDisponiveis(5).reduce((quantidade, dataISO) => {
      return quantidade + obterHorariosLivres(dataISO).length;
    }, 0);

    estadoAgendamento.profissional = profissionalAnterior;

    return total;
  }

  function criarEquipeUnidade() {
    return {
      id: "equipe-unidade",
      nome: "Equipe da unidade",
      especialidade:
        estadoAgendamento.servico?.especialidade ||
        estadoAgendamento.servico?.nome ||
        estadoAgendamento.itemSelecionado?.nome ||
        "Atendimento",
    };
  }

  function escolherProfissional(unidade, servico) {
    const ids = servico.profissionaisDisponiveis || [];

    if (ids.length === 0) {
      return criarEquipeUnidade();
    }

    const profissional = (unidade.profissionais || []).find((item) => {
      return item.id === ids[0];
    });

    return profissional || criarEquipeUnidade();
  }

  function renderizarDatas() {
    const resumo = document.getElementById("resumo-data");
    const lista = document.getElementById("lista-datas");

    if (!resumo || !lista) {
      mostrarErroNaTela("Elementos da etapa de data não foram encontrados.");
      return;
    }

    resumo.innerHTML = montarResumo({
      servico: obterNomeServico(),
      tipo: estadoAgendamento.itemSelecionado.nome,
      local: estadoAgendamento.unidade.nome,
      profissional: estadoAgendamento.profissional?.nome,
    });

    lista.innerHTML = "";

    gerarDatasDisponiveis(5).forEach((dataISO) => {
      const horarios = obterHorariosLivres(dataISO);
      const botao = document.createElement("button");

      botao.type = "button";
      botao.className = "date-card";
      botao.disabled = horarios.length === 0;
      botao.setAttribute(
        "aria-label",
        `${horarios.length === 0 ? "Sem horarios disponiveis em" : "Selecionar"} ${formatarDataComDiaSemana(dataISO)}. ${horarios.length} horarios disponiveis.`,
      );

      botao.innerHTML = `
        <div class="date-card-main">
          <span class="date-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <rect 
                x="3" 
                y="4" 
                width="18" 
                height="17" 
                rx="2" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
              />
              <path 
                d="M8 2v4M16 2v4M3 9h18" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
              />
            </svg>
          </span>

          <span class="date-title">${formatarDataComDiaSemana(dataISO)}</span>
        </div>

        <div class="date-count">
          ${horarios.length} horários disponíveis
        </div>
      `;

      botao.addEventListener("click", () => {
        estadoAgendamento.data = dataISO;
        estadoAgendamento.hora = null;

        renderizarHorarios();
        mostrarEtapa("step-horario");
      });

      lista.appendChild(botao);
    });
  }

  function renderizarHorarios() {
    const resumo = document.getElementById("resumo-horario");
    const lista = document.getElementById("lista-horarios");
    const btnConfirmar = document.getElementById("btn-confirmar-horario");

    if (!resumo || !lista || !btnConfirmar) {
      mostrarErroNaTela("Elementos da etapa de horário não foram encontrados.");
      return;
    }

    resumo.innerHTML = montarResumo({
      servico: obterNomeServico(),
      tipo: estadoAgendamento.itemSelecionado.nome,
      local: estadoAgendamento.unidade.nome,
      profissional: estadoAgendamento.profissional?.nome,
      data: formatarDataComDiaSemana(estadoAgendamento.data),
    });

    lista.innerHTML = "";
    btnConfirmar.disabled = true;

    const horariosLivres = obterHorariosLivres(estadoAgendamento.data);

    if (horariosLivres.length === 0) {
      lista.innerHTML = `
        <div class="info-alert" role="alert" aria-live="assertive">
          <span class="info-alert-icon" aria-hidden="true">!</span>
          <p>Nao encontramos horarios disponiveis para esta escolha. Volte uma etapa e tente outra data, profissional ou unidade.</p>
        </div>
      `;
      return;
    }

    horariosLivres.forEach((hora) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "time-card";
      botao.setAttribute("aria-label", `Selecionar horario ${hora}`);
      botao.setAttribute("aria-pressed", "false");

      botao.innerHTML = `
        <span class="time-text">${hora}</span>
        <span class="time-radio" aria-hidden="true"></span>
      `;

      botao.addEventListener("click", () => {
        document.querySelectorAll(".time-card").forEach((item) => {
          item.classList.remove("selected");
          item.setAttribute("aria-pressed", "false");
        });

        botao.classList.add("selected");
        botao.setAttribute("aria-pressed", "true");
        estadoAgendamento.hora = hora;
        btnConfirmar.disabled = false;
      });

      lista.appendChild(botao);
    });
  }

  function gerarDatasDisponiveis(quantidade) {
    const datas = [];
    const data = new Date();

    data.setDate(data.getDate() + 1);

    while (datas.length < quantidade) {
      if (data.getDay() !== 0) {
        datas.push(formatarDataISO(data));
      }

      data.setDate(data.getDate() + 1);
    }

    return datas;
  }

  function obterHorariosLivres(dataISO) {
    const agendamentos = JSON.parse(
      localStorage.getItem("viva_agendamentos") || "[]",
    );

    const horariosBase = estadoAgendamento.servico?.horariosDisponiveis || [];

    const profissionalAtualId =
      estadoAgendamento.profissional?.id || "equipe-unidade";

    return horariosBase.filter((hora) => {
      return !agendamentos.some((agendamento) => {
        const profissionalAgendadoId =
          agendamento.profissionalId || "equipe-unidade";

        return (
          agendamento.status !== "cancelado" &&
          agendamento.unidadeId === estadoAgendamento.unidade.id &&
          agendamento.servicoId === estadoAgendamento.servico.id &&
          agendamento.data === dataISO &&
          agendamento.hora === hora &&
          profissionalAgendadoId === profissionalAtualId
        );
      });
    });
  }

  function renderizarRevisao() {
    const container = document.getElementById("conteudo-revisao");

    if (!container) {
      mostrarErroNaTela("Área de revisão não encontrada.");
      return;
    }

    container.innerHTML = `
      <div class="review-card">
        <div class="review-item">
          <span class="review-icon" aria-hidden="true">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="27" viewBox="0 0 24 27"
                                fill="none">
                                <path
                                    d="M7.30434 12.4615C5.92061 12.4615 4.59354 11.9145 3.61509 10.9407C2.63664 9.967 2.08696 8.64632 2.08696 7.26923V3.11538C2.08696 2.83997 2.19689 2.57583 2.39258 2.38108C2.58827 2.18633 2.85369 2.07692 3.13043 2.07692H4.17391C4.45066 2.07692 4.71607 1.96751 4.91176 1.77276C5.10745 1.57802 5.21739 1.31388 5.21739 1.03846C5.21739 0.763044 5.10745 0.498908 4.91176 0.304158C4.71607 0.109409 4.45066 0 4.17391 0H3.13043C2.30019 0 1.50395 0.328227 0.916883 0.912475C0.329813 1.49672 0 2.28913 0 3.11538V7.26923C0.00134131 8.44242 0.288805 9.59775 0.837704 10.636C1.3866 11.6743 2.18053 12.5644 3.1513 13.23C4.08493 14.0476 4.84196 15.0453 5.37649 16.1628C5.91101 17.2802 6.21189 18.4941 6.26087 19.7308C6.26087 21.6587 7.03043 23.5076 8.40026 24.8709C9.77009 26.2341 11.628 27 13.5652 27C15.5024 27 17.3603 26.2341 18.7302 24.8709C20.1 23.5076 20.8696 21.6587 20.8696 19.7308V18.5469C21.8532 18.2942 22.7104 17.6931 23.2806 16.8563C23.8508 16.0195 24.0947 15.0045 23.9667 14.0016C23.8387 12.9986 23.3475 12.0765 22.5853 11.4082C21.823 10.7399 20.842 10.3711 19.8261 10.3711C18.8102 10.3711 17.8291 10.7399 17.0669 11.4082C16.3046 12.0765 15.8134 12.9986 15.6854 14.0016C15.5574 15.0045 15.8014 16.0195 16.3715 16.8563C16.9417 17.6931 17.799 18.2942 18.7826 18.5469V19.7308C18.7826 21.1079 18.2329 22.4285 17.2545 23.4023C16.276 24.376 14.9489 24.9231 13.5652 24.9231C12.1815 24.9231 10.8544 24.376 9.87596 23.4023C8.89751 22.4285 8.34782 21.1079 8.34782 19.7308C8.39944 18.4926 8.70357 17.2778 9.24173 16.1602C9.77988 15.0427 10.5408 14.0457 11.4783 13.23C12.4452 12.5621 13.235 11.6709 13.7802 10.6328C14.3254 9.59472 14.6097 8.44058 14.6087 7.26923V3.11538C14.6087 2.28913 14.2789 1.49672 13.6918 0.912475C13.1047 0.328227 12.3085 0 11.4783 0H10.4348C10.158 0 9.89262 0.109409 9.69693 0.304158C9.50124 0.498908 9.3913 0.763044 9.3913 1.03846C9.3913 1.31388 9.50124 1.57802 9.69693 1.77276C9.89262 1.96751 10.158 2.07692 10.4348 2.07692H11.4783C11.755 2.07692 12.0204 2.18633 12.2161 2.38108C12.4118 2.57583 12.5217 2.83997 12.5217 3.11538V7.26923C12.5217 7.95109 12.3868 8.62628 12.1246 9.25624C11.8624 9.8862 11.4781 10.4586 10.9936 10.9407C10.5091 11.4229 9.93396 11.8054 9.30095 12.0663C8.66795 12.3272 7.9895 12.4615 7.30434 12.4615ZM19.8261 16.6154C19.2726 16.6154 18.7418 16.3966 18.3504 16.0071C17.959 15.6176 17.7391 15.0893 17.7391 14.5385C17.7391 13.9876 17.959 13.4594 18.3504 13.0699C18.7418 12.6804 19.2726 12.4615 19.8261 12.4615C20.3796 12.4615 20.9104 12.6804 21.3018 13.0699C21.6932 13.4594 21.913 13.9876 21.913 14.5385C21.913 15.0893 21.6932 15.6176 21.3018 16.0071C20.9104 16.3966 20.3796 16.6154 19.8261 16.6154Z" />
                            </svg>
          </span>
          <div>
            <div class="review-label">Serviço</div>
            <div class="review-value">${obterNomeServico()}</div>
          </div>
        </div>

        <div class="review-item">
          <span class="review-icon" aria-hidden="true">
           <svg viewBox="0 0 48 55" focusable="false">
                                <path
                                    d="M24 27.5C27.6373 27.5 31.1255 26.0513 33.6975 23.4727C36.2694 20.8941 37.7143 17.3967 37.7143 13.75C37.7143 10.1033 36.2694 6.60591 33.6975 4.02728C31.1255 1.44866 27.6373 0 24 0C20.3627 0 16.8745 1.44866 14.3025 4.02728C11.7306 6.60591 10.2857 10.1033 10.2857 13.75C10.2857 17.3967 11.7306 20.8941 14.3025 23.4727C16.8745 26.0513 20.3627 27.5 24 27.5ZM13.7143 33.4297C5.78571 35.7607 0 43.1084 0 51.8096C0 53.5713 1.425 55 3.18214 55H44.8179C46.575 55 48 53.5713 48 51.8096C48 43.1084 42.2143 35.7607 34.2857 33.4297V38.8867C37.2429 39.6494 39.4286 42.3457 39.4286 45.5469V49.8438C39.4286 50.7891 38.6571 51.5625 37.7143 51.5625H36C35.0571 51.5625 34.2857 50.7891 34.2857 49.8438C34.2857 48.8984 35.0571 48.125 36 48.125V45.5469C36 43.6455 34.4679 42.1094 32.5714 42.1094C30.675 42.1094 29.1429 43.6455 29.1429 45.5469V48.125C30.0857 48.125 30.8571 48.8984 30.8571 49.8438C30.8571 50.7891 30.0857 51.5625 29.1429 51.5625H27.4286C26.4857 51.5625 25.7143 50.7891 25.7143 49.8438V45.5469C25.7143 42.3457 27.9 39.6494 30.8571 38.8867V32.7529C30.2143 32.6885 29.5607 32.6562 28.8964 32.6562H19.1036C18.4393 32.6562 17.7857 32.6885 17.1429 32.7529V39.7783C19.6179 40.5195 21.4286 42.8184 21.4286 45.5469C21.4286 48.8662 18.7393 51.5625 15.4286 51.5625C12.1179 51.5625 9.42857 48.8662 9.42857 45.5469C9.42857 42.8184 11.2393 40.5195 13.7143 39.7783V33.4297ZM15.4286 48.125C16.1106 48.125 16.7646 47.8534 17.2468 47.3699C17.7291 46.8864 18 46.2306 18 45.5469C18 44.8631 17.7291 44.2074 17.2468 43.7239C16.7646 43.2404 16.1106 42.9688 15.4286 42.9688C14.7466 42.9688 14.0925 43.2404 13.6103 43.7239C13.1281 44.2074 12.8571 44.8631 12.8571 45.5469C12.8571 46.2306 13.1281 46.8864 13.6103 47.3699C14.0925 47.8534 14.7466 48.125 15.4286 48.125Z" />
                            </svg>
          </span>
          <div>
            <div class="review-label">Tipo</div>
            <div class="review-value">${estadoAgendamento.itemSelecionado.nome}</div>
          </div>
        </div>

        <div class="review-date-highlight">
          <span>${formatarDataComDiaSemana(estadoAgendamento.data)}</span>
          <strong>às ${estadoAgendamento.hora}</strong>
        </div>

        <div class="review-item">
          <span class="review-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28" fill="none">
  <path d="M9.23096 11.9997C9.23096 11.2653 9.52271 10.5609 10.042 10.0416C10.5614 9.52223 11.2657 9.23047 12.0002 9.23047C12.7346 9.23047 13.439 9.52223 13.9583 10.0416C14.4777 10.5609 14.7694 11.2653 14.7694 11.9997C14.7694 12.7341 14.4777 13.4385 13.9583 13.9578C13.439 14.4772 12.7346 14.7689 12.0002 14.7689C11.2657 14.7689 10.5614 14.4772 10.042 13.9578C9.52271 13.4385 9.23096 12.7341 9.23096 11.9997Z"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 11.9926C0.00195773 8.8113 1.2671 5.76095 3.51733 3.51211C5.76755 1.26327 8.81868 -6.0238e-07 12 0C18.6258 0 24 5.37046 24 11.9926C24 16.9292 21.5298 20.8412 18.8825 23.4849C17.7105 24.6584 16.3992 25.6839 14.9778 26.5385C14.3834 26.8892 13.8277 27.1662 13.344 27.3545C12.888 27.5354 12.4098 27.6757 12 27.6757C11.5902 27.6757 11.112 27.5354 10.656 27.3545C10.0914 27.1244 9.54525 26.8516 9.02215 26.5385C7.60081 25.6839 6.28951 24.6584 5.11754 23.4849C2.47015 20.8412 0 16.9292 0 11.9926ZM12 7.37908C10.7759 7.37908 9.60198 7.86534 8.73643 8.73089C7.87088 9.59644 7.38462 10.7704 7.38462 11.9945C7.38462 13.2185 7.87088 14.3925 8.73643 15.258C9.60198 16.1236 10.7759 16.6098 12 16.6098C13.2241 16.6098 14.398 16.1236 15.2636 15.258C16.1291 14.3925 16.6154 13.2185 16.6154 11.9945C16.6154 10.7704 16.1291 9.59644 15.2636 8.73089C14.398 7.86534 13.2241 7.37908 12 7.37908Z"/>
</svg>
          </span>
          <div>
            <div class="review-label">Local</div>
            <div class="review-value">${estadoAgendamento.unidade.nome}</div>
          </div>
        </div>

        <div class="review-item">
          <span class="review-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <g clip-path="url(#clip0_704_5288)">
    <path d="M17.247 10.279C17.73 10.752 18.365 10.988 19 10.988C19.635 10.988 20.27 10.752 20.752 10.279L22.535 8.535C24.485 6.585 24.485 3.413 22.535 1.464C21.591 0.52 20.335 0 19 0C17.665 0 16.409 0.52 15.464 1.464C13.515 3.414 13.515 6.586 15.472 8.543L17.247 10.279ZM20.501 4.787C20.501 5.615 19.829 6.287 19.001 6.287C18.173 6.287 17.501 5.615 17.501 4.787C17.501 3.959 18.173 3.287 19.001 3.287C19.829 3.287 20.501 3.959 20.501 4.787ZM4 22C4 23.105 3.105 24 2 24C0.895 24 0 23.105 0 22C0 20.895 0.895 20 2 20C3.105 20 4 20.895 4 22ZM14.5 16C14.5 17.105 13.605 18 12.5 18C11.395 18 10.5 17.105 10.5 16C10.5 14.895 11.395 14 12.5 14C13.605 14 14.5 14.895 14.5 16ZM2 13C2 10.794 3.794 9 6 9H13C13.552 9 14 9.448 14 10C14 10.552 13.552 11 13 11H6C4.897 11 4 11.897 4 13C4 14.103 4.897 15 6 15H8C8.552 15 9 15.448 9 16C9 16.552 8.552 17 8 17H6C3.794 17 2 15.206 2 13ZM24 19C24 21.206 22.206 23 20 23H7C6.448 23 6 22.552 6 22C6 21.448 6.448 21 7 21H20C21.103 21 22 20.103 22 19C22 17.897 21.103 17 20 17H17C16.448 17 16 16.552 16 16C16 15.448 16.448 15 17 15H20C22.206 15 24 16.794 24 19Z"/>
  </g>
  <defs>
    <clipPath id="clip0_704_5288">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>
          </span>
          <div>
            <div class="review-label">Endereço</div>
            <div class="review-value">${estadoAgendamento.unidade.endereco}</div>
          </div>
        </div>

        <div class="review-item">
          <span class="review-icon" aria-hidden="true">
          <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="nav-icon-outline" cx="12" cy="8" r="4" />
                            <path class="nav-icon-outline" d="M4 21a8 8 0 0 1 16 0" />
                            <path class="nav-icon-fill"
                                d="M12 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9Zm0 2c-4.8 0-8.5 2.8-8.5 6.4c0 .9.7 1.6 1.6 1.6h13.8c.9 0 1.6-.7 1.6-1.6C20.5 16.8 16.8 14 12 14Z" />
                        </svg>
                        </span>
          <div>
            <div class="review-label">Profissional/Equipe</div>
            <div class="review-value">${estadoAgendamento.profissional.nome}</div>
          </div>
        </div>
      </div>

      <div class="info-alert">
        <span class="info-alert-icon" aria-hidden="true">!</span>
        <p>Chegue 30 minutos antes e leve documento com foto.</p>
      </div>
    `;
  }

  function confirmarAgendamento() {
    const novoAgendamento = {
      id: `ag-${Date.now()}`,
      cpf: estadoAgendamento.usuario.cpf,
      categoria: estadoAgendamento.categoria,
      servico: obterNomeServico(),
      item: estadoAgendamento.itemSelecionado.nome,
      titulo: estadoAgendamento.itemSelecionado.nome,
      servicoId: estadoAgendamento.servico.id,
      unidadeId: estadoAgendamento.unidade.id,
      unidadeNome: estadoAgendamento.unidade.nome,
      endereco: estadoAgendamento.unidade.endereco,
      profissionalId: estadoAgendamento.profissional.id,
      profissional: estadoAgendamento.profissional.nome,
      especialidade:
        estadoAgendamento.servico.especialidade ||
        estadoAgendamento.itemSelecionado.nome,
      data: estadoAgendamento.data,
      hora: estadoAgendamento.hora,
      status: "confirmado",
      criadoEm: new Date().toISOString(),
    };

    try {
      const agendamentos = JSON.parse(
        localStorage.getItem("viva_agendamentos") || "[]",
      );

      agendamentos.push(novoAgendamento);

      localStorage.setItem("viva_agendamentos", JSON.stringify(agendamentos));
    } catch (erro) {
      console.error("Erro ao salvar agendamento:", erro);
      mostrarErroNaTela(
        "Nao foi possivel salvar o agendamento. Confira os dados escolhidos e tente confirmar novamente.",
      );
      return;
    }

    estadoAgendamento.agendamentoConfirmado = novoAgendamento;

    mostrarEtapa("step-sucesso");
  }

  function baixarComprovante() {
    const agendamento = estadoAgendamento.agendamentoConfirmado;

    if (!agendamento) return;

    if (!window.VivaPDF) {
      mostrarErroNaTela("Nao foi possivel gerar o PDF do comprovante.");
      return;
    }

    window.VivaPDF.baixarComprovanteAgendamento({
      usuario: estadoAgendamento.usuario,
      agendamento,
      dataFormatada: formatarDataComDiaSemana(agendamento.data),
      statusTexto: "Confirmado",
    });
  }

  function mostrarEtapa(idEtapa) {
    const etapaAtual = document.querySelector(".step:not([hidden])");

    if (
      etapaAtual &&
      etapaAtual.id !== idEtapa &&
      etapaAtual.id !== "step-loading"
    ) {
      historicoEtapas.push(etapaAtual.id);
    }

    mostrarEtapaSemHistorico(idEtapa);
  }

  function mostrarEtapaSemHistorico(idEtapa) {
    const etapa = document.getElementById(idEtapa);

    if (!etapa) {
      console.error(`Etapa não encontrada: #${idEtapa}`);
      mostrarErroNaTela(`Etapa não encontrada: ${idEtapa}`);
      return;
    }

    const layout = document.querySelector(".scheduling-layout");
    const mainContent = document.getElementById("main-content");
    const botaoVoltar = document.getElementById("btn-voltar");

    const etapasDeBloqueio = [
      "step-bloqueio-especialidade",
      "step-bloqueio-exame",
      "step-bloqueio-vacina",
      "step-bloqueio-clinico-aberto",
    ];

    const etapaAtualEhBloqueio = etapasDeBloqueio.includes(idEtapa);
    const etapasSemBotaoVoltar = [
      ...etapasDeBloqueio,
      "step-confirmar-cancelamento",
      "step-error",
      "step-sucesso",
    ];

    document.querySelectorAll(".step").forEach((secao) => {
      secao.hidden = true;
    });

    etapa.hidden = false;

    if (layout) {
      layout.classList.toggle("is-blocked-step", etapaAtualEhBloqueio);
    }

    if (mainContent) {
      mainContent.hidden = etapaAtualEhBloqueio;
    }

    if (botaoVoltar) {
      botaoVoltar.hidden = etapasSemBotaoVoltar.includes(idEtapa);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function voltarEtapa() {
    const etapaAtual = document.querySelector(".step:not([hidden])");

    if (etapaAtual?.id === "step-confirmar-cancelamento") {
      fecharConfirmacaoCancelamento();
      return;
    }

    if (
      !etapaAtual ||
      etapaAtual.id === "step-consulta-tipo" ||
      etapaAtual.id === "step-lista-itens" ||
      etapaAtual.id === "step-bloqueio-especialidade" ||
      etapaAtual.id === "step-bloqueio-exame" ||
      etapaAtual.id === "step-bloqueio-vacina"
    ) {
      mostrarConfirmacaoCancelamento();
      return;
    }

    const etapaAnterior = historicoEtapas.pop();

    if (!etapaAnterior || etapaAnterior === "step-loading") {
      mostrarConfirmacaoCancelamento();
      return;
    }

    mostrarEtapaSemHistorico(etapaAnterior);
  }

  function mostrarConfirmacaoCancelamento() {
    const etapaAtual = document.querySelector(".step:not([hidden])");

    if (etapaAtual?.id !== "step-confirmar-cancelamento") {
      etapaAntesCancelamento = etapaAtual?.id || "step-consulta-tipo";
    }

    mostrarEtapaSemHistorico("step-confirmar-cancelamento");
  }

  function fecharConfirmacaoCancelamento() {
    const etapaParaRestaurar = etapaAntesCancelamento || "step-consulta-tipo";

    etapaAntesCancelamento = null;
    mostrarEtapaSemHistorico(etapaParaRestaurar);
  }

  function mostrarErroNaTela(mensagem) {
    const mensagemErro = document.getElementById("mensagem-erro");

    if (mensagemErro) {
      mensagemErro.textContent = mensagem;
      mensagemErro.setAttribute("role", "alert");
      mensagemErro.setAttribute("aria-live", "assertive");
      mostrarEtapaSemHistorico("step-error");
      return;
    }

    console.error(mensagem);
    alert(mensagem);
  }

  function esconderTodasEtapas() {
    document.querySelectorAll(".step").forEach((secao) => {
      secao.hidden = true;
    });
  }

  function irPara(caminho) {
    window.location.href = caminho;
  }

  function limparEscolhasPosteriores() {
    estadoAgendamento.unidade = null;
    estadoAgendamento.servico = null;
    estadoAgendamento.profissional = null;
    estadoAgendamento.data = null;
    estadoAgendamento.hora = null;
  }

  function obterNomeServico() {
    const nomes = {
      consulta: "Consulta médica",
      exame: "Exame",
      vacina: "Vacina",
    };

    return nomes[estadoAgendamento.categoria] || "Agendamento";
  }

  function montarResumo(dados) {
    const linhas = [];

    if (dados.servico) {
      linhas.push(montarLinhaResumo("Serviço:", dados.servico));
    }

    if (dados.tipo) {
      linhas.push(montarLinhaResumo("Tipo:", dados.tipo));
    }

    if (dados.local) {
      linhas.push(montarLinhaResumo("Local:", dados.local));
    }

    if (dados.profissional) {
      linhas.push(montarLinhaResumo("Profissional:", dados.profissional));
    }

    if (dados.data) {
      linhas.push(montarLinhaResumo("Data:", dados.data));
    }

    return `
      <h2 class="summary-title">Resumo do seu agendamento</h2>
      ${linhas.join("")}
    `;
  }

  function montarLinhaResumo(rotulo, valor) {
    return `
      <div class="summary-row">
        <span class="summary-label">${rotulo}</span>
        <span class="summary-value">${valor}</span>
      </div>
    `;
  }

  function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataComDiaSemana(dataISO) {
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

  function normalizarTexto(texto) {
    return String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function obterIconeVacina(nome) {
    const nomeNormalizado = normalizarTexto(nome);

    if (nomeNormalizado.includes("gripe")) {
      return `
        <img
          src="assets/icons/icon-vacina-gripe.svg"
          alt=""
          aria-hidden="true"
        >
      `;
    }

    if (nomeNormalizado.includes("covid")) {
      return `
        <img
          src="assets/icons/icon-vacina-covid.svg"
          alt=""
          aria-hidden="true"
        >
      `;
    }

    if (nomeNormalizado.includes("febre")) {
      return `
        <img
          src="assets/icons/icon-vacina-febre-amarela.svg"
          alt=""
          aria-hidden="true"
        >
      `;
    }

    return `
      <img
        src="assets/icons/icon-vacina-default.svg"
        alt=""
        aria-hidden="true"
      >
    `;
  }

  function obterIconeItem(nome, tipo) {
    const nomeNormalizado = normalizarTexto(nome);

    if (tipo === "consulta") {
      if (nomeNormalizado.includes("cardiologia")) {
        return `
        <svg viewBox="0 0 48 43" aria-hidden="true" focusable="false">
          <path d="M33.9 0C37.9 0 41.2504 1.47315 43.9512 4.41944C46.652 7.36574 48.0016 10.8694 48 14.9306C48 15.6472 47.96 16.3543 47.88 17.0519C47.8 17.7494 47.66 18.4358 47.46 19.1111H32.46L28.38 13.0194C28.18 12.7009 27.9 12.4421 27.54 12.2431C27.18 12.044 26.8 11.9444 26.4 11.9444C25.88 11.9444 25.4104 12.1037 24.9912 12.4222C24.572 12.7407 24.2816 13.1389 24.12 13.6167L20.88 23.2917L18.78 20.1861C18.58 19.8676 18.3 19.6088 17.94 19.4097C17.58 19.2106 17.2 19.1111 16.8 19.1111H0.54C0.34 18.4343 0.2 17.7478 0.12 17.0519C0.0399999 16.3559 0 15.6687 0 14.9903C0 10.8893 1.34 7.36574 4.02 4.41944C6.7 1.47315 10.04 0 14.04 0C15.96 0 17.7704 0.37824 19.4712 1.13472C21.172 1.8912 22.6816 2.9463 24 4.3C25.28 2.9463 26.7704 1.8912 28.4712 1.13472C30.172 0.37824 31.9816 0 33.9 0ZM24 43C23.28 43 22.5904 42.871 21.9312 42.613C21.272 42.355 20.6816 41.9664 20.16 41.4472L4.08 25.3819C3.84 25.143 3.62 24.9042 3.42 24.6653C3.22 24.4264 3.02 24.1676 2.82 23.8889H15.48L19.56 29.9805C19.76 30.2991 20.04 30.5579 20.4 30.7569C20.76 30.956 21.14 31.0555 21.54 31.0555C22.06 31.0555 22.54 30.8963 22.98 30.5778C23.42 30.2593 23.72 29.8611 23.88 29.3833L27.12 19.7083L29.16 22.8139C29.4 23.1324 29.7 23.3912 30.06 23.5903C30.42 23.7893 30.8 23.8889 31.2 23.8889H45.12L44.52 24.6055L43.92 25.3222L27.78 41.4472C27.26 41.9648 26.68 42.3534 26.04 42.613C25.4 42.8726 24.72 43.0016 24 43Z" />
        </svg>
      `;
      }

      if (nomeNormalizado.includes("ortopedia")) {
        return `
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path d="M0 24C0 12.6751 0 7.01502 3.5136 3.4955C6.3384 0.667868 10.5456 0.112913 17.9544 0.00240223V4.92733C17.9544 6.26306 16.812 7.32493 15.6504 7.98559C13.4544 9.23003 11.9064 12.0841 11.9064 14.609C11.9064 16.2143 12.5435 17.7539 13.6775 18.889C14.8115 20.0242 16.3495 20.6619 17.9532 20.6619C19.5569 20.6619 21.0949 20.0242 22.2289 18.889C23.3629 17.7539 24 16.2143 24 14.609C24 16.214 24.6369 17.7533 25.7707 18.8882C26.9045 20.0231 28.4422 20.6607 30.0456 20.6607C31.649 20.6607 33.1867 20.0231 34.3205 18.8882C35.4543 17.7533 36.0912 16.214 36.0912 14.609C36.0912 12.0841 34.5456 9.22763 32.3496 7.98559C31.188 7.32493 30.0456 6.26306 30.0456 4.92733V0C37.4568 0.110511 41.6616 0.665465 44.484 3.49309C48 7.01261 48 12.6751 48 24C48 35.3249 48 40.9874 44.484 44.5069C41.6736 47.3201 37.4904 47.8847 30.1368 47.9952V43.1832C30.1368 41.845 31.2792 40.7832 32.4408 40.1249C34.6368 38.8805 36.1824 36.0264 36.1824 33.4991C36.1824 31.8941 35.5455 30.3548 34.4117 29.2199C33.2779 28.085 31.7402 27.4474 30.1368 27.4474C28.5334 27.4474 26.9957 28.085 25.8619 29.2199C24.7281 30.3548 24.0912 31.8941 24.0912 33.4991C24.0912 31.8941 23.4543 30.3548 22.3205 29.2199C21.1867 28.085 19.649 27.4474 18.0456 27.4474C16.4422 27.4474 14.9045 28.085 13.7707 29.2199C12.6369 30.3548 12 31.8941 12 33.4991C12 36.0264 13.5456 38.8805 15.7392 40.1249C16.9032 40.7832 18.0456 41.845 18.0456 43.1832V48C10.5792 47.8919 6.3504 47.3441 3.5136 44.5069C0 40.985 0 35.3249 0 24Z" />
        </svg>
      `;
      }

      return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0v1H5v-1Z" />
      </svg>
    `;
    }

    if (tipo === "exame") {
      if (nomeNormalizado.includes("sangue")) {
        return `
        <svg viewBox="0 0 20 48" aria-hidden="true" focusable="false">
          <path d="M14.1176 0V8.47059H11.2941V0H8.47266V8.47059H5.64913V0H0V8.47059H2.82353V14.1176H16.9412V8.47059H19.7647V0H14.1176Z" />
          <path d="M16.9411 16.9414H2.82349V19.7649H11.2941V22.5885H2.82349V25.412H8.47055V28.2355H2.82349V31.0591H16.9411V16.9414Z" />
          <path d="M2.82349 33.8828V40.9416C2.82349 44.8339 5.99007 48.0005 9.88231 48.0005C13.7745 48.0005 16.9411 44.8339 16.9411 40.9416V33.8828H2.82349Z" />
        </svg>
      `;
      }

      if (nomeNormalizado.includes("raio")) {
        return `
    <svg class="icon-xray" viewBox="0 0 42 48" aria-hidden="true" focusable="false">
      <rect 
        data-stroke
        x="5" 
        y="2" 
        width="32" 
        height="44" 
        rx="2.5" 
      />

      <path 
        data-stroke
        d="M21 8V40" 
      />

      <path 
        data-stroke
        d="M21 12C17 12 13.5 12.8 10.5 15" 
      />
      <path 
        data-stroke
        d="M21 12C25 12 28.5 12.8 31.5 15" 
      />

      <path 
        data-stroke
        d="M21 18C16.8 18 13 19 9.5 22" 
      />
      <path 
        data-stroke
        d="M21 18C25.2 18 29 19 32.5 22" 
      />

      <path 
        data-stroke
        d="M21 24C16.5 24 12.8 25.4 9 29" 
      />
      <path 
        data-stroke
        d="M21 24C25.5 24 29.2 25.4 33 29" 
      />

      <path 
        data-stroke
        d="M21 30C17.2 30 14 31.4 11 34" 
      />
      <path 
        data-stroke
        d="M21 30C24.8 30 28 31.4 31 34" 
      />

      <circle data-fill cx="21" cy="12" r="1.6" />
      <circle data-fill cx="21" cy="18" r="1.6" />
      <circle data-fill cx="21" cy="24" r="1.6" />
      <circle data-fill cx="21" cy="30" r="1.6" />
      <circle data-fill cx="21" cy="36" r="1.6" />

      <path 
        data-stroke
        d="M15 41C16.8 38.5 18.8 37.4 21 37.4C23.2 37.4 25.2 38.5 27 41" 
      />
    </svg>
  `;
      }

      if (nomeNormalizado.includes("ultrassom")) {
        return `
        <svg viewBox="0 0 48 76" aria-hidden="true" focusable="false">
          <path d="M4.58044 31.2707L3.9932 29.0392C3.87575 28.5694 4.11065 28.0996 4.46299 27.7472C4.58044 27.6298 22.5502 16.2372 38.2883 27.7472C38.6407 27.9821 38.8756 28.5694 38.7581 28.9217L38.2883 31.6231C25.4864 25.2808 11.5099 28.3345 4.58044 31.2707Z" />
          <path d="M47.4494 41.371C46.9796 41.0187 46.1575 41.0187 45.8051 41.6059C43.2212 45.0119 42.9864 48.6528 42.7515 52.1763C42.2817 59.1058 41.8119 58.5186 38.7582 64.391C32.4159 77.3104 22.9025 72.6125 22.5502 66.3877L30.1844 58.5186C30.4193 58.2837 30.5367 58.0488 30.5367 57.6964V43.1327C30.5367 40.314 32.8857 37.965 35.7045 37.965C36.2917 37.965 36.6441 37.6126 36.879 37.0254L37.7011 33.8543C25.1341 27.512 11.2751 31.0355 5.16772 33.6194L5.98987 37.0254C6.10732 37.4952 6.57712 37.965 7.16436 37.965C9.98314 37.965 12.3321 40.314 12.3321 43.1327V57.9313C12.3321 58.2837 12.4496 58.5186 12.6845 58.7535L20.3187 66.6226C20.9059 76.6057 34.2951 79.542 40.9897 65.5655C43.9259 59.5756 44.7481 60.0454 45.2179 52.4112C45.4528 49.0052 45.5702 45.8341 47.8018 43.0153C48.1541 42.5455 48.0367 41.8408 47.4494 41.371ZM22.6676 47.2435C22.6676 47.8307 22.1979 48.4179 21.4932 48.4179C20.9059 48.4179 20.3187 47.8307 20.3187 47.2435V38.4348C20.3187 37.8475 20.9059 37.2603 21.4932 37.2603C22.1979 37.2603 22.6676 37.8475 22.6676 38.4348V47.2435Z" />
          <path d="M31.9461 19.2909C32.4159 19.7607 32.4159 20.4654 31.9461 20.9352C31.4763 21.4049 30.7716 21.4049 30.3018 20.9352C25.3689 16.0023 17.4998 16.1197 12.5669 20.9352C12.0972 21.4049 11.3925 21.4049 10.9227 20.9352C10.4529 20.4654 10.4529 19.7607 10.9227 19.2909C16.6777 13.5359 26.191 13.5359 31.9461 19.2909Z" />
          <path d="M42.634 10.3649C42.1642 10.8347 41.4595 10.8347 40.9898 10.3649C30.1844 -0.322987 12.802 -0.322987 1.99664 10.3649C1.52684 10.8347 0.822144 10.8347 0.352347 10.3649C-0.117449 9.89509 -0.117449 9.1904 0.352347 8.7206C11.9798 -2.90687 31.0066 -2.90687 42.634 8.7206C43.1038 9.1904 43.1038 9.89509 42.634 10.3649Z" />
          <path d="M37.2313 14.0059C37.7011 14.4757 37.7011 15.1804 37.2313 15.6502C36.7615 16.12 36.0568 16.12 35.587 15.6502C27.8354 7.89855 15.0334 7.7811 7.28179 15.6502C6.81199 16.12 6.1073 16.12 5.6375 15.6502C5.16771 15.1804 5.16771 14.4757 5.6375 14.0059C14.3287 5.19722 28.5401 5.31467 37.2313 14.0059Z" />
        </svg>
      `;
      }

      return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 3h6v2h-1v5l4.8 8.2A2.5 2.5 0 0 1 16.6 22H7.4a2.5 2.5 0 0 1-2.2-3.8L10 10V5H9V3Z" />
      </svg>
    `;
    }

    if (tipo === "vacina") {
      return obterIconeVacina(nome);
    }

    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Z" />
      </svg>
    `;
  }
})();
