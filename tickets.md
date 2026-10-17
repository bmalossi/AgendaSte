# Tickets: Plataforma AgendaSte (Edição Brasil)

Construção ponta a ponta da plataforma de agendamento, POS, catálogo segmentado, CRM, equipe e automação WhatsApp/Pix baseada nas 39 capturas de referência do AgendaSte. Fonte: [PRD.md](./.scratch/AgendaSte-br/PRD.md).

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

## Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`)

**What to build:** Substituir a casca visual anterior pelo Design System Editorial do AgendaSte (títulos em serif editorial, sans-serif geométrica, superfícies brancas/lilás, botões pílula `#1C1C1E`, switches roxos/rosa e toasts escuros flutuantes), entregando a barra lateral retrátil com submenus expansíveis idêntica a `01-get-started.png`, a tela `0/3 Primeiros Passos` com progresso dinâmico (`0/3` a `3/3`), modal de `"Importar meus dados"`, card de avaliação Gold (`14 dias restantes`), motor central de estado do domínio (`Domain Store`) e o **Site de Agendamento Online (`Aura Studio`)** interativo onde o **Cliente** escolhe um serviço, seleciona horário e paga o **Sinal / Taxa de Reserva** via Pix Dinâmico.

**Blocked by:** None — can start immediately

- [x] `DESIGN.md` e `PRODUCT.md` atualizados refletindo fielmente a estética editorial, tipografia, cores e componentes pílula do AgendaSte.
- [x] Barra lateral esquerda retrátil com perfil do **Profissional**, contador `X/3 Primeiros Passos`, grupo `Colegas de IA` (`Recepção`), grupo `Negócio` (`Agenda`, `Pagamentos` expansível, `Clientes`, `Catálogo` expansível, `Equipe` expansível, `Marketing`, `Relatórios` expansível, `Estoque`, `Prontuários`) e rodapé (`Indique e ganhe R$ 150`, `Configurações`, `Ajuda`).
- [x] Tela `0/3 Primeiros Passos` idêntica a `01-get-started.png` e `01-1-get-started.png` com os 3 cartões ilustrados (`Seja encontrado e agendado online`, `Adicione seus serviços`, `Comece a receber pagamentos`), card `"Importe seus dados gratuitamente"`, card `"Seu teste gratuito — 14 dias restantes [Gold]"` e card de preview `"AURA STUDIO"`.
- [x] **Site de Agendamento Online (`Aura Studio`)** acessível pelo botão `"Meu site de agendamento ↗"` no topo direito, permitindo ao **Cliente** escolher serviço, data/hora e gerar cobrança de **Sinal** via Pix (`/api/pix/create`), confirmando o agendamento no estado global.

## Ticket 02: Catálogo Completo (`Serviços`, `Pacotes`, `Assinaturas` e `Recursos Físicos`) com Duração Segmentada

**What to build:** Entregar todas as telas e regras de negócio da seção `06 - Catálogo` (`06-1` a `06-4-add`): visão de **Serviços** com estado vazio/populável e card `"✨ Serviços sugeridos"` por IA (checkboxes, `"Regenerar"` e `"Criar"`), editor de página inteira `Novo serviço` com navegação de âncoras à esquerda (`Detalhes básicos`, `Configurações padrão`, `Recursos`, `Opções`, `Adicionais`), editor de página inteira `Novo pacote` (`06-3`), gestão de **Assinaturas** recorrentes e gerenciador de **Recursos Físicos** (`Equipamentos` com ícone rosa de tesoura e `Salas` com ícone verde de porta em `06-4-add`).

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`)

- [x] Tela `Catálogo → Serviços` (`06-1` e `06-1-1`) permite selecionar sugestões de serviços geradas por IA, regenerar sugestões e criar serviços em 1 clique.
- [x] Editor `Novo serviço` (`06-2`, `06-2-1`, `06-2-2`, `06-2-3`) inclui upload de imagem, botão `"✨ Gerar descrição"`, `Categoria`, `Cor no calendário`, switch `Disponível para agendamento online`, `Preço` (`Fixo`, `A partir de`, `Preço Oculto`), switch `Exigir sinal`, `Duração Total`, switches de **Tempo de Processamento** e **Tempo de Bloqueio**, vínculo de **Recursos Físicos**, **Opções** e **Adicionais** (`+X min · +R$ Y`).
- [x] Tela `Catálogo → Pacotes` (`06-3`) permite criar e listar **Pacotes** (`Detalhes`, `Produtos e Serviços`, `Preço`, `Validade`, `Termos e Condições`) com switch `"Vender no seu site"`.
- [x] Tela `Catálogo → Assinaturas` permite criar e listar planos de **Assinatura** recorrente com créditos mensais.
- [x] Tela `Catálogo → Recursos` (`06-4` e `06-4-add`) inclui o Hero Editorial e o gerenciador com filtros (`Todas as categorias`, `Equipamentos`, `Salas`), permitindo cadastrar e associar salas e equipamentos aos serviços.

## Ticket 03: Agenda Inteligente (`Calendar`) com Salto de Semanas (`+2` a `+8`), 4 Tipos de Evento, Trava de Recursos, Lista de Espera e Checkout em 1 Toque

**What to build:** Entregar a experiência completa da seção `03 - Agenda` (`03-1` a `03-4`): grade horária em modo `Dia` e `Semana` com linha e pílula magenta do horário atual, seletor de datas com popover de calendário e salto rápido `"Pular por semana"` (`+2` a `+8` semanas), filtro por **Profissional**, drawer lateral de **Lista de Espera (`Waitlist`)** (`03-3`), seleção de horário vazio com borda magenta (`03-4`) abrindo o drawer `Novo agendamento` com os 4 tipos de **Evento de Agenda** (`Agendamento`, `Bloqueio Pessoal`, `Horário de Trabalho`, `Entrada na Lista de Espera`), criação inline de cliente e serviço, validação de conflito de **Recurso Físico** e cálculo de **Tempo de Processamento**/**Tempo de Bloqueio**, além do drawer de Detalhes & Checkout em 1 Toque ao clicar em um agendamento existente.

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`), Ticket 02: Catálogo Completo (`Serviços`, `Pacotes`, `Assinaturas` e `Recursos Físicos`) com Duração Segmentada

- [x] Topo da **Agenda** (`03-1`) exibe mês atual, botão de calendário, seletor de data com popover contendo mini-calendário e botões `"Pular por semana"` (`+2` a `+8`), alternador `Dia / Semana`, filtro de **Profissional**, botão `Lista de espera`, botão `Venda rápida` e botão pílula preto `Adicionar`.
- [x] Grade exibe a linha horizontal e pílula magenta do horário atual, blocos de agendamento coloridos pela categoria do serviço (mostrando janelas de **Tempo de Processamento** e **Tempo de Bloqueio** quando aplicável) e destaca com borda superior magenta o slot vazio clicado (`03-4`).
- [x] Drawer `Novo agendamento` (`03-4` a `03-4-event-type`) suporta os 4 tipos de **Evento de Agenda**, busca/criação inline `+ Adicionar Novo Cliente`, busca/criação inline `+ Adicionar novo serviço`, switches `Tornar este evento recorrente` e `Cobrar Sinal`, e bloqueia ou alerta conflito se o **Recurso Físico** (`Sala`/`Equipamento`) exigido já estiver ocupado no horário.
- [x] Drawer `Lista de espera` (`03-3`) permite filtrar por **Profissional**, adicionar entradas e converter uma espera em agendamento confirmado em 1 clique.
- [x] Clicar em um agendamento existente na grade abre o Drawer de Detalhes & Checkout em 1 Toque (Confirmar presença, Cobrar Pix/Cartão, Reagendar retorno `+15d/+30d/+45d`, Disparar lembrete WhatsApp).

## Ticket 04: Diretório de Clientes (`Clients`), Drawer de Perfil em 5 Abas, Ficha de Atendimento e Galeria Auto-Organizada (`Auto-sorted`)

**What to build:** Entregar a seção `05 - Clientes` (`05-1` a `05-3-photos`): alternância entre o Hero Editorial (`"Faça cada cliente se sentir o seu favorito"`) e o diretório populado de **Clientes** com busca, filtros de retenção (`Todos`, `Ausentes +30/45d`, `VIPs`), exportação, botão rápido de adicionar foto na linha, toast escuro inferior (`"Cliente Stefany criado com sucesso!"`) e drawer lateral de perfil com 5 abas de ícones (`Agendamentos`, `Notas/Fichas`, `Fotos`, `Assinaturas`, `Pacotes`).

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`)

- [x] Tela `Clientes` (`05-1`, `05-2`, `05-3`) inclui o Hero Editorial e a tabela completa (`Nome` com avatar colorido, `E-mail`, `Telefone`, `Adição Rápida`), filtros de retenção (`Ausentes +30/45d`) e botões superiores (`Adicionar fotos`, `Exportar clientes`, `Adicionar cliente`).
- [x] Criar um novo **Cliente** exibe o toast escuro flutuante na base da tela (`"Cliente [Nome] criado com sucesso!"`) idêntico a `05-3-clients-added.png`.
- [x] Drawer lateral do **Cliente** exibe botões `Agendar horário` e `Venda rápida`, mais as 5 abas de ícones:
  - `Agendamentos`: sub-abas `Próximos`, `Cancelados` e `Anteriores`.
  - `Notas/Fichas`: edição e salvamento da **Ficha de Atendimento** (anamnese, alergias, fórmulas e preferências).
  - `Fotos` (`05-3-clients-added-photos.png`): seção `"✦ Auto-organizadas"` com dropzone de fotos agrupadas e rotuladas automaticamente por data/serviço do agendamento e comparativo Antes & Depois.
  - `Assinaturas` e `Pacotes`: visualização e abatimento de créditos de sessões ativos do cliente.

## Ticket 05: Pagamentos (`Payments`): Venda Rápida POS (`Quick Sale`), Construtor de Faturas (`Invoices`), Vale-Presentes e Histórico de Vendas

**What to build:** Entregar a seção `04 - Pagamentos` (`04-1`, `04-2`, `04-2-1`) e o drawer global de **Venda Rápida (`Quick Sale`)**: tabela de `Histórico de vendas`, Hero Editorial de `Faturas` (`04-2`) + construtor de página inteira `Nova Fatura` (`04-2-1`), gestão de **Vale-Presentes (`Gift Cards`)** e checkout POS com emissão de QR Code Pix Dinâmico (`/api/pix/create`) ou abatimento de créditos de pacote/vale-presente.

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`), Ticket 02: Catálogo Completo (`Serviços`, `Pacotes`, `Assinaturas` e `Recursos Físicos`) com Duração Segmentada, Ticket 04: Diretório de Clientes (`Clients`), Drawer de Perfil em 5 Abas, Ficha de Atendimento e Galeria Auto-Organizada (`Auto-sorted`)

- [x] `Pagamentos → Histórico de vendas` (`04-1`) lista todas as transações com `Horário do agendamento`, `Cliente`, `Status` e `Valor`, permitindo inspecionar o recibo detalhado.
- [x] `Pagamentos → Faturas` exibe o Hero Editorial (`04-2`) e a lista de faturas emitidas, abrindo o editor de página inteira `Nova Fatura` (`04-2-1`) com `Detalhes` (`Título da fatura`, `Profissional`, `Observação`), `Itens da fatura` (serviços, produtos, pacotes ou valor avulso), `Subtotal`, `Adicionar desconto na fatura`, `Taxa/Imposto`, `Cronograma de pagamento` e envio de link Pix/Cartão.
- [x] `Pagamentos → Vale-presentes` permite emitir, listar e resgatar **Vale-Presentes** no checkout.
- [x] Drawer de **Venda Rápida (`Quick Sale`)** acessível do topo da Agenda ou do perfil do Cliente calcula subtotal, gorjeta/desconto, permite abater sessão de **Pacote** ou saldo de **Vale-Presente**, e gera QR Code Pix Dinâmico instantâneo (`/api/pix/create`).

## Ticket 06: Recepção IA (`Reception`) em 3 Etapas e Motor WhatsApp QR Code 2-Way Sync

**What to build:** Entregar a seção `02 - Recepção IA` (`02-reception-ia.png`) unindo a apresentação editorial e demo interativa com o pareamento de WhatsApp via QR Code e o motor 2-Way Sync de confirmação automática na **Agenda**.

**Blocked by:** Ticket 03: Agenda Inteligente (`Calendar`) com Salto de Semanas (`+2` a `+8`), 4 Tipos de Evento, Trava de Recursos, Lista de Espera e Checkout em 1 Toque

- [x] Barra superior de 3 etapas idêntica a `02-reception-ia.png` (`Conheça a Recepção` | `Configuração rápida` | `Pronta`) com botão superior direito `Precisa de ajuda?`.
- [x] Etapa 1 (`Conheça a Recepção`) reproduz a pílula de onda sonora (`"Toque para testar a Recepção"`), título serif `"Apresentando a Recepção"`, 3 bullets com ícones de estrela de 4 pontas e barra inferior (`Pular para configuração` e `Testar demo da Recepção`).
- [x] Etapa 2 (`Configuração rápida`) exibe o QR Code de pareamento do WhatsApp do **Profissional**, regras de horário de atendimento da IA e configuração de lembretes automáticos de 24h e 2h antes do atendimento.
- [x] Etapa 3 (`Pronta`) exibe o log em tempo real de mensagens enviadas e recebidas (`/api/whatsapp/send`), permitindo simular respostas do cliente (`1 = Confirmar`, `2 = Reagendar`) que atualizam imediatamente o status do agendamento na **Agenda**.

## Ticket 07: Gestão de Equipe (`Team`): Profissionais, Comissões com Meta Semanal, Fechamento de Repasse (`Payroll`) e Controle de Ponto (`Timeclock`)

**What to build:** Entregar todas as telas da seção `06-5 - Equipe` (`06-5-staff`, `06-5-commissions`, `06-5-payroll`, `06-5-time-tracking` e `06-5-1`): gestão de **Profissionais (`Staff`)**, **Política de Comissão (`Commissions`)** com barra de meta semanal, **Fechamento de Repasse (`Payroll`)** via Pix e **Folha de Ponto (`Time tracking`)** com relógio digital interativo.

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`), Ticket 05: Pagamentos (`Payments`): Venda Rápida POS (`Quick Sale`), Construtor de Faturas (`Invoices`), Vale-Presentes e Histórico de Vendas

- [x] `Equipe → Profissionais` (`06-5-staff`) inclui o banner lilás com botões `"Configurar equipe"` e `"Sou só eu"`, os 3 cards `"Como funciona"` e a tabela/cadastro de membros da equipe com permissões e cores de agenda.
- [x] `Equipe → Comissões` (`06-5-commissions`) inclui abas `Serviços | Produtos`, o Hero Editorial com o card escuro de Meta Semanal (`R$ 1.450,50 de R$ 5.800,00 — 25% concluído`) e a tabela de configuração de percentual de comissão por **Profissional**.
- [x] `Equipe → Folha de pagamento` (`06-5-payroll`) inclui o Hero Editorial e o painel de **Fechamento de Repasse** por período, somando automaticamente comissões de serviços/produtos, gorjetas e horas registradas na **Folha de Ponto**, com liquidação via Pix.
- [x] `Equipe → Controle de ponto` (`06-5-time-tracking` e `06-5-1`) inclui o Hero Editorial com o relógio escuro `Timeclock` (`04:21:18`), cronômetro ativo com `Check in`, `Pausa` e `Check out`, planilha de horários registrados e painel de configuração de notificações e intervalos com switches rosa (`06-5-1`).

## Ticket 08: Campanhas de Marketing (`Marketing`) com Assistente IA e Preview em Smartphone + Configurações (`Settings`), Relatórios (`Insights`), Estoque e Prontuários

**What to build:** Entregar as seções `07 - Marketing` (`07-1`, `07-1-1`), `08 - Configurações` (`08-1` a `08-3`) e as visões de `Relatórios (Insights)`, `Estoque (Inventory)` e `Prontuários (Charts)` da barra lateral.

**Blocked by:** Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`), Ticket 04: Diretório de Clientes (`Clients`), Drawer de Perfil em 5 Abas, Ficha de Atendimento e Galeria Auto-Organizada (`Auto-sorted`)

- [x] `Marketing` (`07-1`) exibe os 3 cards superiores (`Criar campanha de e-mail`, `Criar campanha de texto/WhatsApp`, `Comprar mais créditos / 500 restantes`), abas `Todas | E-mail | Texto` e seção `"Como funciona"`.
- [x] Modal `Nova campanha` (`07-1-1`) dividido em duas colunas: à esquerda, fluxo em 3 etapas (`Criar mensagem`, `Selecionar clientes`, `Revisar e enviar`) com botão `"✨ Criar rascunho"`, campos de Assunto/Mensagem, upload de imagem com badge `Gold` e cards de sugestões prontas (incluindo reativação de clientes ausentes +30/45d); à direita, preview em tempo real dentro do smartphone segurado pela mão.
- [x] `Configurações` (`08-1`, `08-1-1`, `08-2`, `08-2-2`, `08-3`) reproduz as 4 abas superiores (`Pessoal`, `Equipe`, `Negócio`, `Assinatura`), botões superiores `▷ Bem-vindo ao AgendaSte` e `🎁 Indique e ganhe R$ 150`, e sub-abas laterais (`Detalhes Pessoais` com foto rosa e telefone verificado, `Minhas Preferências` com checkboxes pretos de E-mail/Texto/Push e switches roxos de Notas de Clientes, Sincronização de Calendário e Lista de Espera, `Segurança`, `Controle de Ponto`, `Detalhes do Negócio` com CNPJ/CPF, `Unidades`, `Site de Agendamento`, `Regras de Agendamento`, `Maquininha & Checkout Pix`, `Conta de Recebimento`, `LGPD`, `Prontuários` e `Vale-presentes`).
- [x] Telas de `Relatórios (Insights)`, `Estoque (Inventory)` e `Prontuários (Charts)` acessíveis na barra lateral exibindo KPIs financeiros/retenção, controle de produtos de revenda/uso interno e central de fichas clínicas.
