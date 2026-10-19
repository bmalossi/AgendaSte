# Ticket 02: Header com mega menu, rodapé e botões de conversão

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

O Site Institucional ganha seu cabeçalho e rodapé definitivos, na identidade AgendaSte (Instrument Serif nos títulos, Plus Jakarta Sans no corpo, carvão, lavanda e dourado, sem translucidez ou emojis). O cabeçalho tem o logotipo, o mega menu **Como funciona** (6 categorias: Agentes, Agendamento, Marketing e CRM, Pagamentos e PDV, Equipe e Negócio, Prontuário, cada uma com lista de módulos existentes e card de destaque), o mega menu **Negócios** ("Por segmento" e "Por porte"), **Preços** e os botões **Entrar**, **Agendar demonstração** e **Começar teste grátis**. No celular vira menu hambúrguer. O rodapé é enxuto, com âncoras, Preços, Entrar, Começar teste grátis, Termos de Uso, Política de Privacidade e direitos autorais.

Este ticket cria o módulo de conteúdo do Site Institucional com a configuração do menu e o resolvedor dos botões de conversão: itens de menu apontam para âncoras da homepage ou rotas declaradas (nenhum link morto), **Começar teste grátis** e **Entrar** levam a `/app`, e **Agendar demonstração** abre WhatsApp comercial com mensagem pré-escrita usando o número de uma variável de ambiente pública, com fallback para `/app` quando ela não estiver definida.

## Acceptance criteria

- [x] O mega menu **Como funciona** troca a lista de itens e o card de destaque conforme a categoria ativa; só aparecem módulos que existem no produto.
- [x] O mega menu **Negócios** mostra "Por segmento" e "Por porte" e leva à seção "Para quem é".
- [x] Todo item de menu tem destino válido (âncora ou rota declarada); teste automatizado falha se algum destino não existir.
- [x] **Agendar demonstração** gera o link de WhatsApp com a mensagem quando a variável de ambiente está definida e cai em `/app` quando não está (teste automatizado cobre os dois casos).
- [x] **Entrar** e **Começar teste grátis** levam a `/app`.
- [x] O menu funciona por teclado (Tab, setas, Esc) e tem rótulos acessíveis.
- [x] No celular o menu hambúrguer expõe as mesmas opções.
- [x] O rodapé inclui links para Termos de Uso e Política de Privacidade.
- [x] Checagem de tipos, testes e build de produção passam.

## Blocked by

- 01 — Rotas e layouts separados para o Site Institucional e o painel
