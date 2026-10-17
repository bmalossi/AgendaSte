# Ticket 02: Catálogo Completo (`Serviços`, `Pacotes`, `Assinaturas` e `Recursos Físicos`) com Duração Segmentada

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar todas as telas e regras de negócio da seção `06 - Catálogo` (`06-1` a `06-4-add`): visão de **Serviços** com estado vazio/populável e card `"✨ Serviços sugeridos"` por IA (checkboxes, `"Regenerar"` e `"Criar"`), editor de página inteira `Novo serviço` com navegação de âncoras à esquerda (`Detalhes básicos`, `Configurações padrão`, `Recursos`, `Opções`, `Adicionais`), editor de página inteira `Novo pacote` (`06-3`), gestão de **Assinaturas** recorrentes e gerenciador de **Recursos Físicos** (`Equipamentos` com ícone rosa de tesoura e `Salas` com ícone verde de porta em `06-4-add`).

## Acceptance criteria

- [ ] Tela `Catálogo → Serviços` (`06-1` e `06-1-1`) permite selecionar sugestões de serviços geradas por IA, regenerar sugestões e criar serviços em 1 clique.
- [ ] Editor `Novo serviço` (`06-2`, `06-2-1`, `06-2-2`, `06-2-3`) inclui upload de imagem, botão `"✨ Gerar descrição"`, `Categoria`, `Cor no calendário`, switch `Disponível para agendamento online`, `Preço` (`Fixo`, `A partir de`, `Preço Oculto`), switch `Exigir sinal`, `Duração Total`, switches de **Tempo de Processamento** e **Tempo de Bloqueio**, vínculo de **Recursos Físicos**, **Opções** e **Adicionais** (`+X min · +R$ Y`).
- [ ] Tela `Catálogo → Pacotes` (`06-3`) permite criar e listar **Pacotes** (`Detalhes`, `Produtos e Serviços`, `Preço`, `Validade`, `Termos e Condições`) com switch `"Vender no seu site"`.
- [ ] Tela `Catálogo → Assinaturas` permite criar e listar planos de **Assinatura** recorrente com créditos mensais.
- [ ] Tela `Catálogo → Recursos` (`06-4` e `06-4-add`) inclui o Hero Editorial e o gerenciador com filtros (`Todas as categorias`, `Equipamentos`, `Salas`), permitindo cadastrar e associar salas e equipamentos aos serviços.

## Blocked by

- [01-fundacao-editorial-e-primeiros-passos.md](./01-fundacao-editorial-e-primeiros-passos.md)
