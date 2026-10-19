# Ticket 04: Homepage — seção "Como funciona" com carrossel

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

A seção "Como funciona" apresenta um carrossel de blocos coloridos (sálvia, limão suavizado, lavanda e carvão, em tons harmonizados com a paleta AgendaSte), um por categoria do mega menu: Agentes (**Recepção IA**), Agendamento, Marketing e CRM, Pagamentos e PDV (**Venda Rápida**, **Pix Dinâmico**), Equipe e Negócio (**Fechamento de Repasse**, **Folha de Ponto**) e Prontuário (**Ficha de Atendimento**). Cada bloco tem título, frase de apoio e um mockup em código que reproduz uma tela real do produto, com sidebar do Aura Studio, números e textos em português. Cada bloco é uma âncora, e os itens do mega menu **Como funciona** rolam suavemente até o bloco da categoria correspondente. O carrossel avança e volta por botões e por arraste/rolagem horizontal, e há um botão de chamada abaixo.

## Acceptance criteria

- [x] Existe um bloco por categoria do mega menu, cada um com âncora própria.
- [x] Clicar em um item do mega menu leva ao bloco da categoria com rolagem suave.
- [x] Os botões de avançar e voltar e o arraste horizontal funcionam, com estado desabilitado nas pontas.
- [x] Os mockups só mostram módulos que existem no produto e usam R$, Pix e WhatsApp.
- [x] O carrossel é operável por teclado e anuncia a posição atual a leitores de tela.
- [x] Respeita a preferência de movimento reduzido do sistema.
- [x] Em celular o carrossel exibe um bloco por vez sem estourar a largura.
- [x] Checagem de tipos e build de produção passam.

## Blocked by

- 02 — Header com mega menu, rodapé e botões de conversão
