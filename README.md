# 🏥 Viva+ | Área do Paciente
> **Branch de Desenvolvimento (`feature/desenvolvimento`)**

O **Viva+** é um sistema web acadêmico focado no agendamento de serviços de saúde. O grande diferencial do projeto é a **acessibilidade e a experiência do usuário (UX)**, com fluxos objetivos, claros e amigáveis, pensados especialmente para a inclusão digital de pessoas idosas.

Aqui testamos, refinamos e validamos as novas funcionalidades de interface antes de enviá-las para a branch principal.

---

## 📸 Preview da Interface

*(Coloque aqui 2 ou 3 screenshots das telas mais bonitas, como a Home, o Perfil e a nova tela de Erro com a mascote. Se puder gravar um GIF do fluxo de agendamento, fica ainda melhor!)*

<p align="center">
  <img src="caminho-para-imagem-da-home.png" width="250" alt="Tela Inicial do Viva+">
  <img src="caminho-para-imagem-do-modal.png" width="250" alt="Modal de aviso com a Mascote">
  <img src="caminho-para-imagem-da-agenda.png" width="250" alt="Tela de Agenda">
</p>

---

## ✨ Destaques de UI/UX

Além das funcionalidades padrão, o projeto conta com refinamentos de front-end focados na usabilidade:

- **Modais Nativos (`<dialog>`):** Feedbacks visuais e alertas de bloqueio integrados ao fluxo através de modais conversacionais com a mascote do app, evitando que o usuário perca o contexto da tela.
- **Acessibilidade Configurável:** Opções de alto contraste, tema escuro e redimensionamento de fonte.
- **Design System Consistente:** Uso de variáveis CSS (`variables.css`) para manter a consistência da paleta de cores, tipografia e ícones em todo o projeto.

---

## ⚙️ Regras de Negócio Simuladas

Para demonstrar o funcionamento real da aplicação, o front-end consome dados simulados (`data/usuarios.json` e `data/unidades.json`) que ditam as seguintes regras de bloqueio e liberação de agenda:

* **🩺 Consultas Médicas:** O agendamento de especialidades requer um encaminhamento ativo. Caso não haja, a interface guia o paciente para o agendamento com um Clínico Geral.
* **🔬 Exames:** Exige um pedido médico registrado no sistema para liberar os horários.
* **💉 Vacinas:** A exibição depende do estoque e da disponibilidade vinculada ao perfil do usuário.

---

## 🚀 Status do Desenvolvimento

**Fluxos de Autenticação & Setup**
- [x] Tela inicial e Login
- [x] Cadastro e Recuperação de senha
- [x] Acessibilidade e visualização de Perfil

**Fluxos de Agendamento**
- [x] Home do paciente
- [x] Agendamento de consultas, exames e vacinas
- [x] Telas de bloqueio amigáveis (Mascote)
- [x] Seleção de local, data e horário
- [x] Revisão e confirmação de agendamentos

**Próximos Passos (To-Do)**
- [ ] Refinamento visual finais com base no Figma
- [ ] Melhorias na tela de histórico da Agenda
- [ ] Revisão de textos (UX Writing) e organização final do código

---

## 📁 Estrutura de Arquivos Principal

A arquitetura do front-end foi dividida para separar a lógica de negócio da estilização e marcação:

- `*.html` — Marcação estrutural das telas principais.
- `css/` — Estilos separados por componentes e páginas (`global.css`, `components.css`, etc).
- `js/` — Controladores de tela e integrações simuladas (`agendamento.js`, `a11y.js`).
- `data/` — Banco de dados em formato JSON.