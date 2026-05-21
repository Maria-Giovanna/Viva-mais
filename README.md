# Viva+

## Sobre o projeto

O **Viva+** é um protótipo de sistema web voltado para o agendamento de serviços de saúde, com foco em acessibilidade, clareza visual e facilidade de uso para pessoas idosas.

O projeto foi desenvolvido como parte de um trabalho acadêmico de usabilidade, interface e experiência do usuário, simulando uma plataforma onde o paciente pode criar conta, acessar sua área pessoal e agendar consultas médicas, exames e vacinas.

## Objetivo

O objetivo do Viva+ é facilitar o acesso do paciente a serviços de saúde, reduzindo a complexidade do processo de agendamento e oferecendo uma navegação mais clara, simples e acessível.

A proposta prioriza:

- interface mobile first;
- leitura confortável;
- botões grandes e bem destacados;
- mensagens claras;
- fluxo guiado por etapas;
- acessibilidade visual;
- organização simples das informações.

## Funcionalidades principais

- Tela inicial de boas-vindas.
- Login com CPF e senha.
- Cadastro com validação de CPF.
- Recuperação de senha.
- Home do paciente.
- Agendamento de consulta médica.
- Agendamento de exames.
- Agendamento de vacinas.
- Validação de encaminhamentos e pedidos médicos.
- Escolha de local, data e horário.
- Revisão do agendamento antes da confirmação.
- Confirmação do agendamento.
- Simulação de banco de dados com arquivos JSON.
- Armazenamento local com `localStorage` e `sessionStorage`.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- JSON
- LocalStorage
- SessionStorage
- VS Code
- Figma

## Estrutura de pastas

```txt
assets/
  icons/
  img/

css/
  auth-pages.css
  components.css
  global.css
  home.css
  reset.css
  variables.css
  welcome.css
  agendamento.css

data/
  convenios.json
  usuarios.json
  unidades.json
  agendamento.json

js/
  a11y.js
  api.js
  auth.js
  cadastro.js
  recuperar-senha.js
  home.js
  agendamento.js
  util.js

index.html
login.html
cadastro.html
recuperar-senha.html
home.html
agendamento.html
agenda.html
perfil.html