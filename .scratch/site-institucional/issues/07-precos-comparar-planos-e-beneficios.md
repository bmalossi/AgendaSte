# Ticket 07: Preços — tabela "Comparar planos" e benefícios

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

`/precos` ganha a seção "Benefícios que você não encontra em outro lugar" (cards com os fatos do produto) e a tabela **Comparar planos**, com colunas Essencial, Gold (destacada com "Mais popular") e Platinum, cada uma com botão **Começar**, e as linhas agrupadas em Colegas de IA (**Recepção IA**, Assistente de Marketing IA), Agendamento (**Site de Agendamento Online**, Agenda, **Recursos Físicos**, **Lista de Espera**), Pagamentos (**Venda Rápida** e Pix Dinâmico, **Faturas** e **Vale-Presente**, **Pacotes** e **Assinaturas**), Clientes (cadastro, **Ficha de Atendimento**, **Galeria Auto-Organizada**), Equipe (**Profissionais**, **Política de Comissão**, **Folha de Ponto** e **Fechamento de Repasse**) e Marketing (**Campanhas de Marketing** com créditos). Cada célula mostra incluído, não incluído ou um limite (ex.: até 9 profissionais, 500 conversas/mês). Os grupos são recolhíveis. A matriz usa o mesmo catálogo de **Planos** do ticket 06, sem duplicar dados.

## Acceptance criteria

- [x] A tabela mostra os 6 grupos e todas as linhas definidas na spec, com incluído, não incluído ou limite por plano.
- [x] Toda linha da matriz referencia um módulo existente do produto e um **Plano** válido (teste automatizado verifica; falha se aparecer recurso inexistente).
- [x] Os limites provisórios (Profissionais 1/9/ilimitado, Recepção IA teste/500 conversas/ilimitada, créditos de campanha 0/500/2.500) vêm da fonte única de configuração.
- [x] A coluna Gold é destacada e os cabeçalhos ficam visíveis ao rolar a tabela.
- [x] Os grupos recolhem e expandem por mouse e teclado.
- [x] No celular a tabela é utilizável (rolagem horizontal controlada ou layout adaptado) sem perder a leitura de qual plano é qual.
- [x] A seção de benefícios usa apenas fatos verificáveis do produto.
- [x] Checagem de tipos, testes e build de produção passam.

## Blocked by

- 06 — Preços — Planos, alternância mensal/anual e FAQ
