# Ticket 04: Diretório de Clientes (`Clients`), Drawer de Perfil em 5 Abas, Ficha de Atendimento e Galeria Auto-Organizada (`Auto-sorted`)

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar a seção `05 - Clientes` (`05-1` a `05-3-photos`): alternância entre o Hero Editorial (`"Faça cada cliente se sentir o seu favorito"`) e o diretório populado de **Clientes** com busca, filtros de retenção (`Todos`, `Ausentes +30/45d`, `VIPs`), exportação, botão rápido de adicionar foto na linha, toast escuro inferior (`"Cliente Stefany criado com sucesso!"`) e drawer lateral de perfil com 5 abas de ícones (`Agendamentos`, `Notas/Fichas`, `Fotos`, `Assinaturas`, `Pacotes`).

## Acceptance criteria

- [ ] Tela `Clientes` (`05-1`, `05-2`, `05-3`) inclui o Hero Editorial e a tabela completa (`Nome` com avatar colorido, `E-mail`, `Telefone`, `Adição Rápida`), filtros de retenção (`Ausentes +30/45d`) e botões superiores (`Adicionar fotos`, `Exportar clientes`, `Adicionar cliente`).
- [ ] Criar um novo **Cliente** exibe o toast escuro flutuante na base da tela (`"Cliente [Nome] criado com sucesso!"`) idêntico a `05-3-clients-added.png`.
- [ ] Drawer lateral do **Cliente** exibe botões `Agendar horário` e `Venda rápida`, mais as 5 abas de ícones:
  - `Agendamentos`: sub-abas `Próximos`, `Cancelados` e `Anteriores`.
  - `Notas/Fichas`: edição e salvamento da **Ficha de Atendimento** (anamnese, alergias, fórmulas e preferências).
  - `Fotos` (`05-3-clients-added-photos.png`): seção `"✦ Auto-organizadas"` com dropzone de fotos agrupadas e rotuladas automaticamente por data/serviço do agendamento e comparativo Antes & Depois.
  - `Assinaturas` e `Pacotes`: visualização e abatimento de créditos de sessões ativos do cliente.

## Blocked by

- [01-fundacao-editorial-e-primeiros-passos.md](./01-fundacao-editorial-e-primeiros-passos.md)
