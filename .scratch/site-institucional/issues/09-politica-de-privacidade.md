# Ticket 09: Política de Privacidade (LGPD)

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

`/politica-de-privacidade` publica a Política de Privacidade da AgendaSte redigida do zero para o nosso produto: quem é o Controlador e quem é o Operador (estúdio versus AgendaSte), quais dados são coletados (cadastro do estúdio, dados dos **Clientes**, **Fichas de Atendimento** e **Galeria Auto-Organizada** como dado sensível de saúde, registros de acesso, dados de pagamento via Mercado Pago, mensagens de WhatsApp da **Recepção IA**), finalidades e bases legais, compartilhamento com operadores (pagamento, mensagens, armazenamento de imagens, hospedagem), transferência internacional, retenção e descarte, medidas de segurança, comunicação de incidentes, direitos do titular (art. 18 da LGPD) e como exercê-los, cookies e ferramentas de monitoramento, alterações e contato do **Encarregado de Dados**. Usa a mesma configuração legal do ticket 08, mostrando `[a preencher]` onde faltar dado.

## Acceptance criteria

- [x] A página `/politica-de-privacidade` abre pelo rodapé e pelo cabeçalho, com sumário navegável.
- [x] O texto cobre todos os tópicos listados e distingue claramente os papéis de Controlador e Operador.
- [x] A política declara que a AgendaSte armazena **Fichas de Atendimento** e fotos como dado sensível de saúde e descreve base legal, segurança e retenção específicas para eles.
- [x] Todos os terceiros que tratam dados no produto atual são listados (pagamento, mensagens, armazenamento de imagens, hospedagem) e nenhum terceiro que não usamos é citado.
- [x] O contato do **Encarregado de Dados** e o canal para exercer direitos vêm da configuração legal e aparecem como `[a preencher]` se vazios.
- [x] O texto não replica redação de documentos de terceiros.
- [x] A página traz o aviso de rascunho técnico dependente de revisão jurídica enquanto houver campos pendentes.
- [x] Layout responsivo, navegação por teclado e metadados adequados.
- [x] Checagem de tipos, testes e build de produção passam.

## Blocked by

- 08 — Termos de Uso
