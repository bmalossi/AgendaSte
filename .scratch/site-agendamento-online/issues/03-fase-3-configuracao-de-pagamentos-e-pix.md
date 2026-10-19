# Ticket 03: Fase 3 — Configuração de Pagamentos Aceitos, Chave Pix/Conta de Repasse, Verificação de Identidade e Painel 3/3

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

A partir do Cartão 3 (**"Comece a receber"**) em Primeiros Passos ou na sequência após a Fase 2, conduzir o **Profissional** pelas 3 etapas da Fase 3 (*Set up payments*):
1. **Taxas e modalidades de recebimento:** apresentação clara das taxas de processamento, recebimento rápido via **Pix Dinâmico** e cartão, e proteção do tempo do **Profissional** contra faltas (*no-show*) com **Sinal / Taxa de Reserva**, acompanhada de mockup visual de terminal/celular com cartão em arquivo e pagamento por aproximação/Pix.
2. **Adicione sua conta de repasse (Chave Pix, Conta Bancária ou Cartão de Débito):** seletor para o **Profissional** escolher como receberá seus ganhos — via **Chave Pix** (CPF/CNPJ, e-mail, celular ou chave aleatória + banco), **Conta Bancária** (agência/routing e número da conta) ou **Cartão de Débito** — com aviso sobre a liberação de repasses após a verificação.
3. **Verifique sua identidade:** etapa de conformidade regulatória e fiscal (gateway integrado Stripe / Mercado Pago) alertando que os dados devem corresponder à conta vinculada, com botão para iniciar/confirmar a verificação e opção **"Verificar depois"** (*I'll verify later*).
4. **Reflexo nos Cartões de Primeiros Passos:** se o **Profissional** concluir a verificação e o cadastro de repasse, o Cartão 3 (`start_getting_paid`) exibe **Tudo pronto!** (*All set!*) e o painel atinge `3/3 concluídos`; se pular ou escolher **"Verificar depois"**, o Cartão 3 exibe o indicador de pendência (*"Configuração de pagamentos pendente/restrita"*) com o botão **Começar** (*Start*).

## Acceptance criteria

- [x] A Etapa 9 exibe os benefícios de processamento (taxas transparentes, repasse rápido e proteção contra *no-show*) e o mockup visual de pagamento.
- [x] A Etapa 10 permite alternar e salvar os dados de repasse via **Chave Pix** (tipo de chave + valor + banco), **Conta Bancária** (agência e conta) ou **Cartão de Débito**.
- [x] A Etapa 11 exibe os avisos de titularidade bancária e fiscal e permite concluir a verificação de identidade ou clicar em **"Verificar depois"**.
- [x] Quando o usuário escolhe **"Verificar depois"** ou pula a conta de repasse, o Cartão 3 em Primeiros Passos mostra o aviso de configuração de pagamentos pendente/restrita e mantém o botão **Começar**.
- [x] Quando a conta de repasse e a verificação são concluídas, o passo `start_getting_paid` é marcado como concluído, exibindo **Tudo pronto!** nos 3 cartões (`3/3 concluídos`).
- [x] Testes automatizados de domínio validam o salvamento de Chave Pix e Conta Bancária e a diferença de estado entre verificação concluída e verificação adiada.

## Blocked by

- [Ticket 01: Fase 1 — Criação do Site de Agendamento Online](./01-fase-1-criacao-do-site-e-subdominio.md)
