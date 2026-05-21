
---

# README da branch `feature/desenvolvimento`

Esse pode ser mais técnico, explicando que é uma branch de construção:

```md
# Viva+ — Branch de Desenvolvimento

## Sobre esta branch

Esta branch contém a versão em desenvolvimento do projeto **Viva+**, um sistema web acadêmico voltado para agendamento de serviços de saúde.

Aqui são implementadas, testadas e ajustadas novas funcionalidades antes de serem enviadas para a branch principal `main`.

## Objetivo do projeto

O Viva+ tem como objetivo simular uma plataforma acessível para pacientes realizarem agendamentos de saúde de forma simples, com atenção especial à experiência de pessoas idosas.

O sistema busca apresentar fluxos objetivos para:

- criação de conta;
- login;
- recuperação de senha;
- navegação pela área do paciente;
- agendamento de consultas;
- agendamento de exames;
- agendamento de vacinas;
- revisão e confirmação de agendamentos.

## Funcionalidades em desenvolvimento

### Fluxos já implementados

- Tela inicial.
- Login.
- Cadastro.
- Recuperação de senha.
- Home do paciente.
- Agendamento de consulta médica.
- Agendamento de exames.
- Agendamento de vacinas.
- Tela de bloqueio para especialidade sem encaminhamento.
- Tela de bloqueio para exame sem pedido médico.
- Tela de bloqueio para vacina indisponível.
- Seleção de local.
- Seleção de data.
- Seleção de horário.
- Revisão do agendamento.
- Confirmação do agendamento.

### Funcionalidades previstas

- Melhorias na tela de agenda.
- Tela de perfil do paciente.
- Melhorias de acessibilidade.
- Ajustes finais de responsividade.
- Refinamento visual com base no Figma.
- Organização final do código.
- Revisão de textos e mensagens do sistema.

## Regras de negócio simuladas

O sistema utiliza dados simulados para representar algumas regras de agendamento.

### Consulta médica

O paciente pode escolher entre:

- Clínico Geral;
- Especialista.

Para agendar uma especialidade, o paciente precisa ter um encaminhamento ativo registrado no `usuarios.json`.

Caso não tenha encaminhamento, o sistema exibe uma tela de aviso e recomenda agendar uma consulta com clínico geral.

### Exames

O paciente só pode agendar exames se houver um pedido médico ativo registrado no `usuarios.json`.

Caso não tenha pedido médico, o sistema exibe uma tela de bloqueio.

### Vacinas

O paciente só visualiza vacinas disponíveis quando elas estão cadastradas como disponíveis no `usuarios.json`.

Caso não existam vacinas disponíveis, o sistema exibe uma mensagem informando que não há vacinas para agendamento no momento.

## Arquivos principais

```txt
agendamento.html
css/agendamento.css
js/agendamento.js
data/unidades.json
data/usuarios.json