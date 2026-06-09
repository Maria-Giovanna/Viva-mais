(function () {
  "use strict";

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const BLUE = "#0047CC";
  const LIGHT_BLUE = "#F4F8FF";
  const PAGE_BG = "#F7FAFF";
  const BORDER = "#9EB4D3";
  const LINE = "#D6E2F2";
  const TEXT = "#00010A";
  const MUTED = "#4A5565";
  const WHITE = "#FFFFFF";

  const SVG_ICONS = {
    servico: {
      viewBox: { width: 24, height: 27 },
      paths: [
        "M7.30434 12.4615C5.92061 12.4615 4.59354 11.9145 3.61509 10.9407C2.63664 9.967 2.08696 8.64632 2.08696 7.26923V3.11538C2.08696 2.83997 2.19689 2.57583 2.39258 2.38108C2.58827 2.18633 2.85369 2.07692 3.13043 2.07692H4.17391C4.45066 2.07692 4.71607 1.96751 4.91176 1.77276C5.10745 1.57802 5.21739 1.31388 5.21739 1.03846C5.21739 0.763044 5.10745 0.498908 4.91176 0.304158C4.71607 0.109409 4.45066 0 4.17391 0H3.13043C2.30019 0 1.50395 0.328227 0.916883 0.912475C0.329813 1.49672 0 2.28913 0 3.11538V7.26923C0.00134131 8.44242 0.288805 9.59775 0.837704 10.636C1.3866 11.6743 2.18053 12.5644 3.1513 13.23C4.08493 14.0476 4.84196 15.0453 5.37649 16.1628C5.91101 17.2802 6.21189 18.4941 6.26087 19.7308C6.26087 21.6587 7.03043 23.5076 8.40026 24.8709C9.77009 26.2341 11.628 27 13.5652 27C15.5024 27 17.3603 26.2341 18.7302 24.8709C20.1 23.5076 20.8696 21.6587 20.8696 19.7308V18.5469C21.8532 18.2942 22.7104 17.6931 23.2806 16.8563C23.8508 16.0195 24.0947 15.0045 23.9667 14.0016C23.8387 12.9986 23.3475 12.0765 22.5853 11.4082C21.823 10.7399 20.842 10.3711 19.8261 10.3711C18.8102 10.3711 17.8291 10.7399 17.0669 11.4082C16.3046 12.0765 15.8134 12.9986 15.6854 14.0016C15.5574 15.0045 15.8014 16.0195 16.3715 16.8563C16.9417 17.6931 17.799 18.2942 18.7826 18.5469V19.7308C18.7826 21.1079 18.2329 22.4285 17.2545 23.4023C16.276 24.376 14.9489 24.9231 13.5652 24.9231C12.1815 24.9231 10.8544 24.376 9.87596 23.4023C8.89751 22.4285 8.34782 21.1079 8.34782 19.7308C8.39944 18.4926 8.70357 17.2778 9.24173 16.1602C9.77988 15.0427 10.5408 14.0457 11.4783 13.23C12.4452 12.5621 13.235 11.6709 13.7802 10.6328C14.3254 9.59472 14.6097 8.44058 14.6087 7.26923V3.11538C14.6087 2.28913 14.2789 1.49672 13.6918 0.912475C13.1047 0.328227 12.3085 0 11.4783 0H10.4348C10.158 0 9.89262 0.109409 9.69693 0.304158C9.50124 0.498908 9.3913 0.763044 9.3913 1.03846C9.3913 1.31388 9.50124 1.57802 9.69693 1.77276C9.89262 1.96751 10.158 2.07692 10.4348 2.07692H11.4783C11.755 2.07692 12.0204 2.18633 12.2161 2.38108C12.4118 2.57583 12.5217 2.83997 12.5217 3.11538V7.26923C12.5217 7.95109 12.3868 8.62628 12.1246 9.25624C11.8624 9.8862 11.4781 10.4586 10.9936 10.9407C10.5091 11.4229 9.93396 11.8054 9.30095 12.0663C8.66795 12.3272 7.9895 12.4615 7.30434 12.4615ZM19.8261 16.6154C19.2726 16.6154 18.7418 16.3966 18.3504 16.0071C17.959 15.6176 17.7391 15.0893 17.7391 14.5385C17.7391 13.9876 17.959 13.4594 18.3504 13.0699C18.7418 12.6804 19.2726 12.4615 19.8261 12.4615C20.3796 12.4615 20.9104 12.6804 21.3018 13.0699C21.6932 13.4594 21.913 13.9876 21.913 14.5385C21.913 15.0893 21.6932 15.6176 21.3018 16.0071C20.9104 16.3966 20.3796 16.6154 19.8261 16.6154Z",
      ],
    },
    tipo: {
      viewBox: { width: 48, height: 55 },
      paths: [
        "M24 27.5C27.6373 27.5 31.1255 26.0513 33.6975 23.4727C36.2694 20.8941 37.7143 17.3967 37.7143 13.75C37.7143 10.1033 36.2694 6.60591 33.6975 4.02728C31.1255 1.44866 27.6373 0 24 0C20.3627 0 16.8745 1.44866 14.3025 4.02728C11.7306 6.60591 10.2857 10.1033 10.2857 13.75C10.2857 17.3967 11.7306 20.8941 14.3025 23.4727C16.8745 26.0513 20.3627 27.5 24 27.5ZM13.7143 33.4297C5.78571 35.7607 0 43.1084 0 51.8096C0 53.5713 1.425 55 3.18214 55H44.8179C46.575 55 48 53.5713 48 51.8096C48 43.1084 42.2143 35.7607 34.2857 33.4297V38.8867C37.2429 39.6494 39.4286 42.3457 39.4286 45.5469V49.8438C39.4286 50.7891 38.6571 51.5625 37.7143 51.5625H36C35.0571 51.5625 34.2857 50.7891 34.2857 49.8438C34.2857 48.8984 35.0571 48.125 36 48.125V45.5469C36 43.6455 34.4679 42.1094 32.5714 42.1094C30.675 42.1094 29.1429 43.6455 29.1429 45.5469V48.125C30.0857 48.125 30.8571 48.8984 30.8571 49.8438C30.8571 50.7891 30.0857 51.5625 29.1429 51.5625H27.4286C26.4857 51.5625 25.7143 50.7891 25.7143 49.8438V45.5469C25.7143 42.3457 27.9 39.6494 30.8571 38.8867V32.7529C30.2143 32.6885 29.5607 32.6562 28.8964 32.6562H19.1036C18.4393 32.6562 17.7857 32.6885 17.1429 32.7529V39.7783C19.6179 40.5195 21.4286 42.8184 21.4286 45.5469C21.4286 48.8662 18.7393 51.5625 15.4286 51.5625C12.1179 51.5625 9.42857 48.8662 9.42857 45.5469C9.42857 42.8184 11.2393 40.5195 13.7143 39.7783V33.4297ZM15.4286 48.125C16.1106 48.125 16.7646 47.8534 17.2468 47.3699C17.7291 46.8864 18 46.2306 18 45.5469C18 44.8631 17.7291 44.2074 17.2468 43.7239C16.7646 43.2404 16.1106 42.9688 15.4286 42.9688C14.7466 42.9688 14.0925 43.2404 13.6103 43.7239C13.1281 44.2074 12.8571 44.8631 12.8571 45.5469C12.8571 46.2306 13.1281 46.8864 13.6103 47.3699C14.0925 47.8534 14.7466 48.125 15.4286 48.125Z",
      ],
    },
    local: {
      viewBox: { width: 24, height: 28 },
      paths: [
        "M9.23096 11.9997C9.23096 11.2653 9.52271 10.5609 10.042 10.0416C10.5614 9.52223 11.2657 9.23047 12.0002 9.23047C12.7346 9.23047 13.439 9.52223 13.9583 10.0416C14.4777 10.5609 14.7694 11.2653 14.7694 11.9997C14.7694 12.7341 14.4777 13.4385 13.9583 13.9578C13.439 14.4772 12.7346 14.7689 12.0002 14.7689C11.2657 14.7689 10.5614 14.4772 10.042 13.9578C9.52271 13.4385 9.23096 12.7341 9.23096 11.9997Z",
        "M0 11.9926C0.00195773 8.8113 1.2671 5.76095 3.51733 3.51211C5.76755 1.26327 8.81868 -6.0238e-07 12 0C18.6258 0 24 5.37046 24 11.9926C24 16.9292 21.5298 20.8412 18.8825 23.4849C17.7105 24.6584 16.3992 25.6839 14.9778 26.5385C14.3834 26.8892 13.8277 27.1662 13.344 27.3545C12.888 27.5354 12.4098 27.6757 12 27.6757C11.5902 27.6757 11.112 27.5354 10.656 27.3545C10.0914 27.1244 9.54525 26.8516 9.02215 26.5385C7.60081 25.6839 6.28951 24.6584 5.11754 23.4849C2.47015 20.8412 0 16.9292 0 11.9926ZM12 7.37908C10.7759 7.37908 9.60198 7.86534 8.73643 8.73089C7.87088 9.59644 7.38462 10.7704 7.38462 11.9945C7.38462 13.2185 7.87088 14.3925 8.73643 15.258C9.60198 16.1236 10.7759 16.6098 12 16.6098C13.2241 16.6098 14.398 16.1236 15.2636 15.258C16.1291 14.3925 16.6154 13.2185 16.6154 11.9945C16.6154 10.7704 16.1291 9.59644 15.2636 8.73089C14.398 7.86534 13.2241 7.37908 12 7.37908Z",
      ],
    },
    endereco: {
      viewBox: { width: 24, height: 24 },
      paths: [
        "M17.247 10.279C17.73 10.752 18.365 10.988 19 10.988C19.635 10.988 20.27 10.752 20.752 10.279L22.535 8.535C24.485 6.585 24.485 3.413 22.535 1.464C21.591 0.52 20.335 0 19 0C17.665 0 16.409 0.52 15.464 1.464C13.515 3.414 13.515 6.586 15.472 8.543L17.247 10.279ZM20.501 4.787C20.501 5.615 19.829 6.287 19.001 6.287C18.173 6.287 17.501 5.615 17.501 4.787C17.501 3.959 18.173 3.287 19.001 3.287C19.829 3.287 20.501 3.959 20.501 4.787ZM4 22C4 23.105 3.105 24 2 24C0.895 24 0 23.105 0 22C0 20.895 0.895 20 2 20C3.105 20 4 20.895 4 22ZM14.5 16C14.5 17.105 13.605 18 12.5 18C11.395 18 10.5 17.105 10.5 16C10.5 14.895 11.395 14 12.5 14C13.605 14 14.5 14.895 14.5 16ZM2 13C2 10.794 3.794 9 6 9H13C13.552 9 14 9.448 14 10C14 10.552 13.552 11 13 11H6C4.897 11 4 11.897 4 13C4 14.103 4.897 15 6 15H8C8.552 15 9 15.448 9 16C9 16.552 8.552 17 8 17H6C3.794 17 2 15.206 2 13ZM24 19C24 21.206 22.206 23 20 23H7C6.448 23 6 22.552 6 22C6 21.448 6.448 21 7 21H20C21.103 21 22 20.103 22 19C22 17.897 21.103 17 20 17H17C16.448 17 16 16.552 16 16C16 15.448 16.448 15 17 15H20C22.206 15 24 16.794 24 19Z",
      ],
    },
    profissional: {
      viewBox: { width: 24, height: 24 },
      paths: [
        "M12 14C7.2 14 3.5 16.8 3.5 20.4C3.5 21.3 4.2 22 5.1 22H18.9C19.8 22 20.5 21.3 20.5 20.4C20.5 16.8 16.8 14 12 14Z",
      ],
      circles: [{ cx: 12, cy: 7.5, r: 4.5 }],
    },
  };

  function baixarComprovanteAgendamento({
    usuario,
    agendamento,
    dataFormatada,
    statusTexto,
  }) {
    const dados = normalizarDados(
      usuario,
      agendamento,
      dataFormatada,
      statusTexto,
    );
    const pdf = montarPDF(dados);
    const arquivo = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `comprovante-${dados.codigo}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function normalizarDados(
    usuario = {},
    agendamento = {},
    dataFormatada,
    statusTexto,
  ) {
    return {
      paciente: texto(usuario.nomeCompleto, "Paciente"),
      cpf: formatarCPF(usuario.cpf || agendamento.cpf),
      servico: texto(
        agendamento.servico || nomeServico(agendamento.categoria),
        "Agendamento",
      ),
      tipo: texto(
        agendamento.item || agendamento.especialidade || agendamento.titulo,
        "Não informado",
      ),
      data: texto(dataFormatada || agendamento.data, "Data não informada"),
      hora: texto(agendamento.hora, "Horário não informado"),
      local: texto(agendamento.unidadeNome, "Unidade não informada"),
      endereco: texto(agendamento.endereco, "Endereço não informado"),
      profissional: texto(agendamento.profissional, "Equipe da unidade"),
      status: texto(statusTexto || agendamento.status, "Confirmado"),
      codigo: texto(agendamento.id, String(Date.now())),
    };
  }

  function montarPDF(dados) {
    const comandos = [];

    retangulo(comandos, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, PAGE_BG);

    retangulo(comandos, 0, 710, PAGE_WIDTH, 82, BLUE);
    textoPDF(comandos, "Viva+", 48, 756, 30, WHITE, true);
    textoPDF(comandos, "Comprovante de agendamento", 48, 731, 17, WHITE, false);
    textoDireitaPDF(
      comandos,
      `Código: ${dados.codigo}`,
      564,
      760,
      10,
      WHITE,
      false,
    );

    roundedRetangulo(comandos, 46, 616, 520, 64, 5, LIGHT_BLUE, BORDER);
    textoPDF(comandos, "Paciente", 70, 654, 10.5, MUTED, true);
    textoQuebrado(comandos, dados.paciente, 70, 633, 30, 17, 18, TEXT, true, 2);
    textoPDF(comandos, "CPF", 396, 654, 10.5, MUTED, true);
    textoPDF(comandos, dados.cpf, 396, 633, 15, TEXT, true);

    const cardX = 46;
    const cardY = 72;
    const cardW = 520;
    const cardH = 522;
    const contentX = cardX + 24;
    const contentW = cardW - 48;

    roundedRetangulo(comandos, cardX, cardY, cardW, cardH, 9, WHITE, BORDER);

    let cursorTop = cardY + cardH - 24;

    cursorTop = detalheComIcone(
      comandos,
      "servico",
      "Serviço",
      dados.servico,
      contentX,
      cursorTop,
      contentW,
      66,
      true,
    );

    cursorTop = detalheComIcone(
      comandos,
      "tipo",
      "Tipo",
      dados.tipo,
      contentX,
      cursorTop,
      contentW,
      66,
      true,
    );

    cursorTop -= 18;
    blocoDataDetalhe(comandos, dados, contentX, cursorTop - 112, contentW, 112);
    cursorTop -= 128;

    cursorTop = detalheComIcone(
      comandos,
      "local",
      "Local",
      dados.local,
      contentX,
      cursorTop,
      contentW,
      66,
      true,
    );

    cursorTop = detalheComIcone(
      comandos,
      "endereco",
      "Endereço",
      dados.endereco,
      contentX,
      cursorTop,
      contentW,
      82,
      true,
      3,
    );

    detalheComIcone(
      comandos,
      "profissional",
      "Profissional/Equipe",
      dados.profissional,
      contentX,
      cursorTop,
      contentW,
      66,
      false,
    );

    textoPDF(
      comandos,
      "Viva+ | Agendamento fácil e descomplicado",
      46,
      34,
      9.5,
      MUTED,
      false,
    );

    return serializarPDF(comandos.join("\n"));
  }

  function detalheComIcone(
    comandos,
    icone,
    rotulo,
    valor,
    x,
    topoY,
    largura,
    altura,
    separador,
    limiteLinhas = 2,
  ) {
    const tamanhoIcone = 52;
    const tamanhoDesenho = icone === "tipo" ? 31 : 30;
    const bottomY = topoY - altura;
    const caixaY = bottomY + Math.max(7, (altura - tamanhoIcone) / 2);
    const textoX = x + 66;
    const labelY = topoY - 24;
    const valorY = labelY - 20;

    iconeCaixa(comandos, x, caixaY, tamanhoIcone);
    desenharIcone(
      comandos,
      icone,
      x + (tamanhoIcone - tamanhoDesenho) / 2,
      caixaY + (tamanhoIcone - tamanhoDesenho) / 2,
      tamanhoDesenho,
    );
    textoPDF(comandos, rotulo, textoX, labelY, 10.8, MUTED, false);
    textoQuebrado(
      comandos,
      valor,
      textoX,
      valorY,
      icone === "endereco" ? 48 : 50,
      icone === "endereco" ? 13.4 : 14,
      15.6,
      TEXT,
      true,
      limiteLinhas,
    );

    if (separador) {
      linha(comandos, x, bottomY, x + largura, bottomY, LINE);
    }

    return bottomY;
  }

  function blocoDataDetalhe(comandos, dados, x, y, largura, altura) {
    roundedRetangulo(comandos, x, y, largura, altura, 7, BLUE);

    /*
      A data e o horario ficam em areas separadas para melhorar a leitura.
      Antes, a linha da data ficava muito perto do box branco do horario,
      dando a sensacao de texto espremido no comprovante.
    */
    textoCentralizadoPDF(
      comandos,
      dados.data,
      x,
      y + 82,
      largura,
      16.5,
      WHITE,
      false,
    );

    roundedRetangulo(comandos, x + 16, y + 20, largura - 32, 44, 4, WHITE);
    textoCentralizadoPDF(
      comandos,
      `às ${dados.hora}`,
      x + 16,
      y + 34.5,
      largura - 32,
      25,
      BLUE,
      true,
    );
  }

  function textoQuebrado(
    comandos,
    valor,
    x,
    y,
    maxCaracteres,
    tamanho,
    alturaLinha,
    corTexto,
    negrito,
    limiteLinhas = 4,
  ) {
    const palavras = prepararTexto(valor).split(" ").filter(Boolean);
    const linhas = [];
    let atual = "";

    palavras.forEach((palavra) => {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;

      if (tentativa.length > maxCaracteres && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = tentativa;
      }
    });

    if (atual) linhas.push(atual);

    linhas.slice(0, limiteLinhas).forEach((linhaTexto, indice) => {
      textoPDF(
        comandos,
        linhaTexto,
        x,
        y - indice * alturaLinha,
        tamanho,
        corTexto,
        negrito,
      );
    });

    return y - (Math.min(linhas.length, limiteLinhas) - 1) * alturaLinha;
  }

  function iconeCaixa(comandos, x, y, tamanho) {
    roundedRetangulo(comandos, x, y, tamanho, tamanho, 4, WHITE, BLUE);
  }

  function desenharIcone(comandos, tipo, x, y, tamanho, corIcone = BLUE) {
    if (SVG_ICONS[tipo]) {
      desenharIconeSVG(comandos, SVG_ICONS[tipo], x, y, tamanho, corIcone);
      return;
    }
  }

  function desenharIconeSVG(comandos, icone, x, y, tamanho, corIcone = BLUE) {
    const escala = Math.min(
      tamanho / icone.viewBox.width,
      tamanho / icone.viewBox.height,
    );
    const larguraDesenhada = icone.viewBox.width * escala;
    const alturaDesenhada = icone.viewBox.height * escala;
    const origemX = x + (tamanho - larguraDesenhada) / 2;
    const origemY = y + (tamanho - alturaDesenhada) / 2;

    comandos.push(`${cor(corIcone)} rg`);

    (icone.circles || []).forEach((circuloSVG) => {
      circulo(
        comandos,
        origemX + circuloSVG.cx * escala,
        origemY + (icone.viewBox.height - circuloSVG.cy) * escala,
        circuloSVG.r * escala,
        corIcone,
        true,
      );
    });

    (icone.paths || []).forEach((caminho) => {
      comandos.push(
        converterPathSVGParaPDF(
          caminho,
          origemX,
          origemY,
          icone.viewBox.height,
          escala,
        ),
      );
      comandos.push("f");
    });
  }

  function converterPathSVGParaPDF(caminho, origemX, origemY, viewBoxHeight, escala) {
    const tokens =
      caminho.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?|[a-zA-Z]/g) || [];
    const comandos = [];
    let indice = 0;
    let comando = "";
    let atualX = 0;
    let atualY = 0;
    let inicioX = 0;
    let inicioY = 0;

    function ehComando(token) {
      return /^[a-zA-Z]$/.test(token);
    }

    function temNumero() {
      return indice < tokens.length && !ehComando(tokens[indice]);
    }

    function numeroSVG() {
      return Number(tokens[indice++]);
    }

    function pdfX(valor) {
      return numero(origemX + valor * escala);
    }

    function pdfY(valor) {
      return numero(origemY + (viewBoxHeight - valor) * escala);
    }

    while (indice < tokens.length) {
      if (ehComando(tokens[indice])) {
        comando = tokens[indice++];
      }

      if (!comando) break;

      switch (comando) {
        case "M":
        case "m": {
          const relativo = comando === "m";
          if (!temNumero()) break;
          atualX = (relativo ? atualX : 0) + numeroSVG();
          atualY = (relativo ? atualY : 0) + numeroSVG();
          inicioX = atualX;
          inicioY = atualY;
          comandos.push(`${pdfX(atualX)} ${pdfY(atualY)} m`);

          while (temNumero()) {
            atualX = (relativo ? atualX : 0) + numeroSVG();
            atualY = (relativo ? atualY : 0) + numeroSVG();
            comandos.push(`${pdfX(atualX)} ${pdfY(atualY)} l`);
          }
          break;
        }

        case "L":
        case "l": {
          const relativo = comando === "l";
          while (temNumero()) {
            atualX = (relativo ? atualX : 0) + numeroSVG();
            atualY = (relativo ? atualY : 0) + numeroSVG();
            comandos.push(`${pdfX(atualX)} ${pdfY(atualY)} l`);
          }
          break;
        }

        case "H":
        case "h": {
          const relativo = comando === "h";
          while (temNumero()) {
            atualX = (relativo ? atualX : 0) + numeroSVG();
            comandos.push(`${pdfX(atualX)} ${pdfY(atualY)} l`);
          }
          break;
        }

        case "V":
        case "v": {
          const relativo = comando === "v";
          while (temNumero()) {
            atualY = (relativo ? atualY : 0) + numeroSVG();
            comandos.push(`${pdfX(atualX)} ${pdfY(atualY)} l`);
          }
          break;
        }

        case "C":
        case "c": {
          const relativo = comando === "c";
          while (temNumero()) {
            const x1 = (relativo ? atualX : 0) + numeroSVG();
            const y1 = (relativo ? atualY : 0) + numeroSVG();
            const x2 = (relativo ? atualX : 0) + numeroSVG();
            const y2 = (relativo ? atualY : 0) + numeroSVG();
            const x = (relativo ? atualX : 0) + numeroSVG();
            const y = (relativo ? atualY : 0) + numeroSVG();
            comandos.push(
              `${pdfX(x1)} ${pdfY(y1)} ${pdfX(x2)} ${pdfY(y2)} ${pdfX(x)} ${pdfY(y)} c`,
            );
            atualX = x;
            atualY = y;
          }
          break;
        }

        case "Z":
        case "z":
          comandos.push("h");
          atualX = inicioX;
          atualY = inicioY;
          break;

        default:
          // O comprovante usa apenas caminhos SVG ja convertidos para M/L/H/V/C/Z.
          indice += 1;
          break;
      }
    }

    return comandos.join(" ");
  }

  function retangulo(comandos, x, y, largura, altura, preenchimento, borda) {
    if (preenchimento) {
      comandos.push(`${cor(preenchimento)} rg`);
      comandos.push(
        `${numero(x)} ${numero(y)} ${numero(largura)} ${numero(altura)} re f`,
      );
    }

    if (borda) {
      comandos.push(`${cor(borda)} RG`);
      comandos.push(
        `1 w ${numero(x)} ${numero(y)} ${numero(largura)} ${numero(altura)} re S`,
      );
    }
  }

  function roundedRetangulo(
    comandos,
    x,
    y,
    largura,
    altura,
    raio,
    preenchimento,
    borda,
  ) {
    const r = Math.min(raio, largura / 2, altura / 2);
    const k = 0.5522847498 * r;
    const path = [
      `${numero(x + r)} ${numero(y)} m`,
      `${numero(x + largura - r)} ${numero(y)} l`,
      `${numero(x + largura - r + k)} ${numero(y)} ${numero(x + largura)} ${numero(y + r - k)} ${numero(x + largura)} ${numero(y + r)} c`,
      `${numero(x + largura)} ${numero(y + altura - r)} l`,
      `${numero(x + largura)} ${numero(y + altura - r + k)} ${numero(x + largura - r + k)} ${numero(y + altura)} ${numero(x + largura - r)} ${numero(y + altura)} c`,
      `${numero(x + r)} ${numero(y + altura)} l`,
      `${numero(x + r - k)} ${numero(y + altura)} ${numero(x)} ${numero(y + altura - r + k)} ${numero(x)} ${numero(y + altura - r)} c`,
      `${numero(x)} ${numero(y + r)} l`,
      `${numero(x)} ${numero(y + r - k)} ${numero(x + r - k)} ${numero(y)} ${numero(x + r)} ${numero(y)} c`,
      "h",
    ].join(" ");

    if (preenchimento) {
      comandos.push(`${cor(preenchimento)} rg`);
    }

    if (borda) {
      comandos.push(`${cor(borda)} RG`);
      comandos.push("1 w");
    }

    comandos.push(path);

    if (preenchimento && borda) {
      comandos.push("B");
      return;
    }

    comandos.push(preenchimento ? "f" : "S");
  }

  function linha(comandos, x1, y1, x2, y2, corLinha, espessura = 1) {
    comandos.push(`${cor(corLinha)} RG`);
    comandos.push(
      `${numero(espessura)} w ${numero(x1)} ${numero(y1)} m ${numero(x2)} ${numero(y2)} l S`,
    );
  }

  function circulo(
    comandos,
    cx,
    cy,
    raio,
    corCirculo,
    preencher,
    espessura = 1,
  ) {
    const k = 0.5522847498 * raio;
    const operadorCor = preencher ? "rg" : "RG";

    comandos.push(`${cor(corCirculo)} ${operadorCor}`);
    if (!preencher) {
      comandos.push(`${numero(espessura)} w`);
    }
    comandos.push(`${numero(cx + raio)} ${numero(cy)} m`);
    comandos.push(
      `${numero(cx + raio)} ${numero(cy + k)} ${numero(cx + k)} ${numero(cy + raio)} ${numero(cx)} ${numero(cy + raio)} c`,
    );
    comandos.push(
      `${numero(cx - k)} ${numero(cy + raio)} ${numero(cx - raio)} ${numero(cy + k)} ${numero(cx - raio)} ${numero(cy)} c`,
    );
    comandos.push(
      `${numero(cx - raio)} ${numero(cy - k)} ${numero(cx - k)} ${numero(cy - raio)} ${numero(cx)} ${numero(cy - raio)} c`,
    );
    comandos.push(
      `${numero(cx + k)} ${numero(cy - raio)} ${numero(cx + raio)} ${numero(cy - k)} ${numero(cx + raio)} ${numero(cy)} c`,
    );
    comandos.push(preencher ? "f" : "S");
  }

  function textoPDF(comandos, valor, x, y, tamanho, corTexto, negrito) {
    const seguro = prepararTexto(valor);

    if (!seguro) return;

    comandos.push(`${cor(corTexto)} rg`);
    comandos.push("BT");
    comandos.push(`/${negrito ? "F2" : "F1"} ${numero(tamanho)} Tf`);
    comandos.push(`1 0 0 1 ${numero(x)} ${numero(y)} Tm`);
    comandos.push(`${hexPDF(seguro)} Tj`);
    comandos.push("ET");
  }

  function textoCentralizadoPDF(
    comandos,
    valor,
    x,
    y,
    largura,
    tamanho,
    corTexto,
    negrito,
  ) {
    const seguro = prepararTexto(valor);
    const posicaoX =
      x + (largura - larguraAproximada(seguro, tamanho, negrito)) / 2;

    textoPDF(comandos, seguro, posicaoX, y, tamanho, corTexto, negrito);
  }

  function textoDireitaPDF(
    comandos,
    valor,
    direita,
    y,
    tamanho,
    corTexto,
    negrito,
  ) {
    const seguro = prepararTexto(valor);
    const posicaoX = direita - larguraAproximada(seguro, tamanho, negrito);

    textoPDF(comandos, seguro, posicaoX, y, tamanho, corTexto, negrito);
  }

  function serializarPDF(conteudo) {
    const objetos = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ];
    const partes = ["%PDF-1.4\n"];
    const offsets = [0];

    objetos.forEach((objeto, indice) => {
      offsets.push(partes.join("").length);
      partes.push(`${indice + 1} 0 obj\n${objeto}\nendobj\n`);
    });

    const inicioXref = partes.join("").length;
    const xref = ["xref", `0 ${objetos.length + 1}`, "0000000000 65535 f "];

    offsets.slice(1).forEach((offset) => {
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    });

    partes.push(`${xref.join("\n")}\n`);
    partes.push(`trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\n`);
    partes.push(`startxref\n${inicioXref}\n%%EOF`);

    return partes.join("");
  }

  function hexPDF(valor) {
    let hex = "";

    for (const caractere of String(valor)) {
      const codigo = caractere.codePointAt(0);
      const byte = codigo <= 0xff ? codigo : 0x3f;
      hex += byte.toString(16).padStart(2, "0");
    }

    return `<${hex.toUpperCase()}>`;
  }

  function larguraAproximada(valor, tamanho, negrito) {
    return String(valor).length * tamanho * (negrito ? 0.58 : 0.53);
  }

  function cor(hex) {
    const limpo = String(hex).replace("#", "");
    const r = parseInt(limpo.slice(0, 2), 16) / 255;
    const g = parseInt(limpo.slice(2, 4), 16) / 255;
    const b = parseInt(limpo.slice(4, 6), 16) / 255;

    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }

  function numero(valor) {
    return Number(valor)
      .toFixed(2)
      .replace(/\.?0+$/, "");
  }

  function texto(valor, fallback = "") {
    return String(valor || fallback || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function prepararTexto(valor) {
    return texto(valor)
      .replace(/[–—]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\u00a0/g, " ")
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatarCPF(valor) {
    const numeros = String(valor || "").replace(/\D/g, "");

    if (numeros.length !== 11) return texto(valor, "Não informado");

    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function nomeServico(categoria) {
    const nomes = {
      consulta: "Consulta médica",
      exame: "Exame",
      vacina: "Vacina",
    };

    return nomes[categoria] || "Agendamento";
  }

  window.VivaPDF = {
    baixarComprovanteAgendamento,
  };
})();
