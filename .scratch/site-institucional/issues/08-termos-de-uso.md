# Ticket 08: Termos de Uso

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

`/termos-de-uso` publica os Termos de Uso da AgendaSte em português claro, redigidos do zero para o nosso produto: natureza do serviço e licença de uso, requisitos de cadastro e titularidade da conta, **Teste Grátis** de 14 dias, **Planos** e cobrança (renovação, cancelamento, direito de arrependimento do CDC), papéis na LGPD (estúdio como Controlador e AgendaSte como Operadora), uso de dados sensíveis em **Fichas de Atendimento** e fotos, canais de suporte, limitação de responsabilidade, alterações dos termos e foro. Os dados da empresa (razão social, CNPJ, endereço, foro, e-mail e WhatsApp de suporte, data de vigência) vêm de uma configuração legal única; campo vazio é exibido como `[a preencher]` em destaque. Cláusulas agressivas de terceiros (bloqueio por disputa societária, aceitação tácita irrevogável) não são replicadas.

Este ticket cria a configuração legal compartilhada e a detecção de campos pendentes.

## Acceptance criteria

- [x] A página `/termos-de-uso` abre pelo rodapé e pelo cabeçalho e é legível, com sumário navegável e cláusulas numeradas.
- [x] O texto cobre os tópicos listados e reflete o comportamento real do produto (Fichas e fotos armazenadas, Mercado Pago, WhatsApp).
- [x] Os dados da empresa vêm de uma única configuração legal; campo vazio aparece como `[a preencher]` destacado.
- [x] A configuração legal informa quais campos obrigatórios estão pendentes (teste automatizado verifica com campos vazios e preenchidos), e o resultado serve de bloqueio de publicação.
- [x] O texto não replica redação ou cláusulas de documentos de terceiros.
- [x] A página traz aviso de que o texto é rascunho técnico e depende de revisão jurídica, visível apenas enquanto houver campos pendentes.
- [x] Título, descrição e navegação por teclado adequados; layout responsivo.
- [x] Checagem de tipos, testes e build de produção passam.

## Blocked by

- 02 — Header com mega menu, rodapé e botões de conversão
