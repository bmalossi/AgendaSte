# Ticket 06: Preços — Planos, alternância mensal/anual e FAQ

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

`/precos` apresenta o título "Planos que crescem com você", a alternância **Mensal / Anual (economize até 14%)** e os 3 **Planos** lado a lado: Essencial (autônomo, 1 profissional), Gold (estúdio até 9 profissionais, com o selo "Mais popular") e Platinum (equipes 10+). Cada card mostra o preço mensal riscado, o preço anual por mês com o desconto, o público-alvo, os destaques e o botão **Começar teste grátis** (o Platinum também tem **Agendar demonstração**), com a nota "Sem cartão de crédito". Abaixo, uma FAQ em acordeão com 8 perguntas em português (o que cada plano inclui, **Teste Grátis**, Pix e taxas, migração de dados, quantidade de profissionais, cancelamento, etc.). Onde a resposta depender de política ainda não definida (taxas de cartão, cancelamento), o texto é neutro e verdadeiro, sem prometer valores.

Este ticket cria o catálogo de **Planos** como fonte única de preços, desconto, limites e selo "Mais popular", alimentando os cards e (no ticket 07) a tabela de comparação.

## Acceptance criteria

- [x] Os 3 **Planos** aparecem com preços provisórios (Essencial R$ 69/R$ 59, Gold R$ 149/R$ 129, Platinum R$ 399/R$ 349) vindos de uma única fonte de configuração.
- [x] Alternar para Anual mostra o preço anual por mês com o desconto e o preço mensal riscado; alternar para Mensal restaura o preço cheio.
- [x] Apenas o Gold exibe o selo "Mais popular" (teste automatizado verifica).
- [x] O preço anual exibido é consistente com o desconto definido (teste automatizado verifica para todos os planos).
- [x] Não há abas de segmento nem plano grátis; o **Teste Grátis** de 14 dias sem cartão é comunicado.
- [x] A FAQ tem 8 perguntas em acordeão acessível por teclado e não promete taxas ou prazos indefinidos.
- [x] Layout responsivo: cards empilham no celular.
- [x] Checagem de tipos, testes e build de produção passam.

## Blocked by

- 02 — Header com mega menu, rodapé e botões de conversão
