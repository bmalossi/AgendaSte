# Ticket 05: Pagamentos (`Payments`): Venda Rápida POS (`Quick Sale`), Construtor de Faturas (`Invoices`), Vale-Presentes e Histórico de Vendas

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar a seção `04 - Pagamentos` (`04-1`, `04-2`, `04-2-1`) e o drawer global de **Venda Rápida (`Quick Sale`)**: tabela de `Histórico de vendas`, Hero Editorial de `Faturas` (`04-2`) + construtor de página inteira `Nova Fatura` (`04-2-1`), gestão de **Vale-Presentes (`Gift Cards`)** e checkout POS com emissão de QR Code Pix Dinâmico (`/api/pix/create`) ou abatimento de créditos de pacote/vale-presente.

## Acceptance criteria

- [ ] `Pagamentos → Histórico de vendas` (`04-1`) lista todas as transações com `Horário do agendamento`, `Cliente`, `Status` e `Valor`, permitindo inspecionar o recibo detalhado.
- [ ] `Pagamentos → Faturas` exibe o Hero Editorial (`04-2`) e a lista de faturas emitidas, abrindo o editor de página inteira `Nova Fatura` (`04-2-1`) com `Detalhes` (`Título da fatura`, `Profissional`, `Observação`), `Itens da fatura` (serviços, produtos, pacotes ou valor avulso), `Subtotal`, `Adicionar desconto na fatura`, `Taxa/Imposto`, `Cronograma de pagamento` e envio de link Pix/Cartão.
- [ ] `Pagamentos → Vale-presentes` permite emitir, listar e resgatar **Vale-Presentes** no checkout.
- [ ] Drawer de **Venda Rápida (`Quick Sale`)** acessível do topo da Agenda ou do perfil do Cliente calcula subtotal, gorjeta/desconto, permite abater sessão de **Pacote** ou saldo de **Vale-Presente**, e gera QR Code Pix Dinâmico instantâneo (`/api/pix/create`).

## Blocked by

- [01-fundacao-editorial-e-primeiros-passos.md](./01-fundacao-editorial-e-primeiros-passos.md)
- [02-catalogo-completo-e-recursos.md](./02-catalogo-completo-e-recursos.md)
- [04-clientes-prontuario-e-fotos.md](./04-clientes-prontuario-e-fotos.md)
