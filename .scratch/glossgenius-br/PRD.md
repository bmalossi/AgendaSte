# PRD: Plataforma de Gestão e Agendamento Padrão AgendaSte (Edição Brasil)

Status: ready-for-agent

## Problem Statement

Profissionais autônomos e gestores de estúdios de beleza, estética, saúde e bem-estar no Brasil enfrentam uma escolha ruim entre softwares locais visualmente datados, lentos e burocráticos, ou plataformas internacionais de ponta (como o AgendaSte) que operam apenas em inglês, em dólar e sem integração nativa com os motores essenciais de retenção e liquidação do mercado brasileiro: **WhatsApp (via pareamento QR Code 2-Way Sync)** e **Pix Dinâmico (para cobrança de Sinal / Taxa de Reserva, Venda Rápida e Fechamento de Repasse)**. Além disso, agendas genéricas tratam qualquer atendimento como um bloco único de tempo, ignorando a realidade operacional de salões e clínicas — onde serviços exigem **Tempo de Processamento** (janela intermediária em que o produto age e o **Profissional (Provider)** pode encaixar outro cliente), **Tempo de Bloqueio** (higienização pós-atendimento), trava simultânea de **Recursos Físicos (Resources)** como salas e equipamentos de alto custo, controle de créditos de **Pacotes (Packages)** e **Assinaturas (Memberships)**, **Galeria Auto-Organizada (Auto-Sorted Photos)** por visita e **Folha de Ponto (Timesheet)** integrada ao **Fechamento de Repasse (Payroll)**.

## Solution

Construir uma plataforma web e mobile-first cuja identidade visual, arquitetura de navegação, layouts, tipografia editorial (títulos em serif editorial combinados com sans-serif limpa e botões pílula `#1C1C1E`), estados de apresentação ("Heros Editoriais" com cards lilás ilustrados) e fluxos de gavetas deslizantes à direita (drawers) e editores de página inteira sejam **idênticos às 39 capturas de referência do AgendaSte**, porém 100% traduzidos e adaptados para a operação brasileira (Português PT-BR, moeda em Reais `R$`, **Sinal / Taxa de Reserva** via Pix Dinâmico, **Recepção IA** conectada ao WhatsApp por QR Code, e suporte a CPF/CNPJ/Salão Parceiro).

A plataforma unifica em uma única experiência:
1. **Primeiros Passos (`0/3 Get Started`)**: Checklist interativo de ativação em 3 cartões ilustrados (Site de Agendamento Online, Catálogo de Serviços e Pagamentos Pix/Cartão), importação gratuita de dados, status do período de avaliação Gold e atalho ao vivo para o **Site de Agendamento Online (`Aura Studio`)**.
2. **Recepção IA (`Reception`)**: Fluxo guiado em 3 etapas no topo (`Conheça a Recepção` → `Configuração rápida` → `Pronta`), combinando a tela editorial com demonstração interativa de áudio/texto, o pareamento de WhatsApp via QR Code com regras de lembrete automático (24h e 2h antes) e o monitor em tempo real de respostas (`1 = Confirmar`, `2 = Reagendar`).
3. **Agenda (`Calendar`)**: Grade diária e semanal com indicador de horário atual em linha e pílula magenta, seletor de datas com salto rápido de semanas (`+2` a `+8` semanas para retorno imediato), filtro por **Profissional (Provider)**, **Lista de Espera (Waitlist)** em drawer lateral, **Venda Rápida (Quick Sale)**, criação de **Evento de Agenda (Calendar Event)** em 4 modalidades (`Agendamento`, `Bloqueio Pessoal`, `Horário de Trabalho`, `Entrada na Lista de Espera`) com cadastro inline de cliente/serviço, e drawer de detalhes/checkout em 1 toque ao clicar em um agendamento existente.
4. **Pagamentos (`Payments`)**: Submódulos de **Vale-Presentes (Gift Cards)**, **Faturas (Invoices)** (com Hero Editorial e construtor completo de itens, descontos, impostos e cronograma de pagamento via link Pix/Cartão) e **Histórico de Vendas (Sales History)**.
5. **Clientes (`Clients`)**: Tabela pesquisável com filtros de retenção (`Todos`, `Ausentes +30/45d`, `VIPs`), botão de adição rápida de fotos na linha, exportação e drawer lateral completo do **Cliente (Client)** com 5 abas de ícones (`Agendamentos` em Próximos/Cancelados/Anteriores, `Notas/Fichas` com **Ficha de Atendimento**, `Fotos` com **Galeria Auto-Organizada** por agendamento, `Assinaturas` e `Pacotes`).
6. **Catálogo (`Catalog`)**: Gestão de **Serviços** (com sugestões geradas por IA, gerador de descrição por IA, cor no calendário, preço Fixo/A partir de/Oculto, exigência de **Sinal**, **Tempo de Processamento**, **Tempo de Bloqueio**, **Recursos Físicos**, **Opções** e **Adicionais**), **Pacotes**, **Assinaturas** e **Recursos Físicos** (`Equipamentos` e `Salas` com validação de conflito na agenda).
7. **Equipe (`Team`)**: Gestão de **Profissionais (Staff)** (com suporte ao modo solo `"Sou só eu"` e modo multi-profissional), **Política de Comissão (Commissions)** com barra de progresso de meta semanal para Serviços e Produtos, **Fechamento de Repasse (Payroll)** automatizado via Pix e **Folha de Ponto (Time Tracking)** com relógio de ponto digital (`Timeclock`) e gestão de intervalos (`Breaks`).
8. **Marketing (`Marketing`)**: Criador de **Campanhas de Marketing** por E-mail e Texto/WhatsApp em modal duplo de 3 etapas (`Criar mensagem` → `Selecionar clientes` → `Revisar e enviar`), assistente de redação por IA (`✨ Criar rascunho`), cartões de sugestões prontas e preview em tempo real na tela de um smartphone segurado na mão.
9. **Relatórios (`Insights`), Estoque (`Inventory`), Prontuários (`Charts`) e Configurações (`Settings`)**: Visões analíticas e operacionais complementares na barra lateral, além do painel completo de Configurações dividido em `Pessoal` (`Detalhes Pessoais`, `Minhas Preferências`, `Segurança`), `Equipe` (`Controle de Ponto`, `Profissionais`), `Negócio` (`Detalhes do Negócio` com CNPJ/CPF, `Unidades`, `Site de Agendamento`, `Regras de Agendamento`, `Notificações`, `Maquininha & Checkout Pix`, `Conta de Recebimento`, `LGPD`, `Prontuários`, `Vale-presentes`) e `Assinatura`.

## User Stories

1. As a **Profissional (Provider)**, I want a collapsible left sidebar identical to AgendaSte with expandable submenus for Pagamentos, Catálogo, Equipe and Relatórios, so that I can navigate between all operational areas with zero visual clutter.
2. As a **Profissional (Provider)**, I want a `0/3 Primeiros Passos` (`Get Started`) onboarding dashboard with 3 visual cards (Site de Agendamento Online, Catálogo de Serviços, Pagamentos) and a dynamic progress bar (`0/3` to `3/3`), so that I can track and complete my studio setup in minutes.
3. As a **Profissional (Provider)**, I want to click `"Importar meus dados"` on the Primeiros Passos screen to import existing clients, services and appointments, so that I can migrate from pen-and-paper or another system without manual typing.
4. As a **Profissional (Provider)**, I want to click `"Meu site de agendamento ↗"` in the top right header (or on the `AURA STUDIO` preview card) to open the interactive **Site de Agendamento Online (Booking Site)**, so that I can preview and test exactly how a **Cliente (Client)** books a service and pays a **Sinal / Taxa de Reserva (Deposit)** via Pix.
5. As a **Cliente (Client)** visiting the **Site de Agendamento Online (Booking Site)**, I want to choose a service, select Service Options and Add-ons, pick an available date/time slot that respects provider and resource availability, and pay the required **Sinal / Taxa de Reserva (Deposit)** via Pix Copia e Cola / QR Code, so that my appointment is immediately confirmed on the studio calendar.
6. As a **Profissional (Provider)**, I want to open `Recepção IA` (`Reception`) and see the 3-step top progress bar (`Conheça a Recepção`, `Configuração rápida`, `Pronta`) with the interactive audio/WhatsApp waveform pill `"Toque para testar a Recepção"`, so that I can experience how the AI handles client inquiries before activating it.
7. As a **Profissional (Provider)**, I want to navigate to the `Configuração rápida` step of **Recepção IA** to pair my WhatsApp via QR Code and configure automatic 24h and 2h appointment reminders, so that clients receive interactive confirmation prompts (`1 = Confirmar`, `2 = Reagendar`) from my own number.
8. As a **Profissional (Provider)**, I want to view the `Pronta` step of **Recepção IA** and simulate or monitor real-time client replies (`1` or `2`) on WhatsApp, so that appointments automatically flip to confirmed or reschedule-requested on the **Agenda (Calendar)**.
9. As a **Profissional (Provider)**, I want to view the **Agenda (Calendar)** in either `Dia` or `Semana` mode with a live magenta current-time pill and horizontal line across the grid, so that I have immediate temporal orientation during a busy workday.
10. As a **Profissional (Provider)**, I want to click the date selector pill on the **Agenda (Calendar)** to open a mini-calendar popover featuring `"Pular por semana"` (`+2`, `+3`, `+4`, `+5`, `+6`, `+7`, `+8` weeks), so that I can jump forward in 1 click to book a client's return visit.
11. As a **Profissional (Provider)**, I want to filter the **Agenda (Calendar)** by specific **Profissional (Provider)** or view all team members side by side, so that I can coordinate schedules across the studio.
12. As a **Profissional (Provider)**, I want to click any empty time slot on the **Agenda (Calendar)** to highlight that slot with a magenta top border and open the `Novo agendamento` right-hand drawer pre-filled with the clicked date and start time, so that booking takes minimal taps.
13. As a **Profissional (Provider)**, I want to switch the `Tipo de evento` (`Event type`) inside the calendar creation drawer between `Agendamento` (`Appointment`), `Bloqueio Pessoal` (`Personal Block`), `Horário de Trabalho` (`Working Hours`) and `Entrada na Lista de Espera` (`Waitlist Entry`), so that I can manage all schedule allocations from the same interface.
14. As a **Profissional (Provider)**, I want to search for an existing **Cliente (Client)** or click `+ Adicionar Novo Cliente` inline inside the `Novo agendamento` drawer, so that I can register a walk-in or new caller without leaving the calendar flow.
15. As a **Profissional (Provider)**, I want to select multiple services or click `+ Adicionar novo serviço` inline inside the `Novo agendamento` drawer, automatically calculating the end time including **Tempo de Processamento** and **Tempo de Bloqueio**, so that the calendar slot duration is always accurate.
16. As a **Profissional (Provider)**, I want to toggle `Tornar este evento recorrente` and `Cobrar Sinal` inside the `Novo agendamento` drawer, so that recurring clients and anti-no-show Pix deposits are configured at booking time.
17. As a **Profissional (Provider)**, I want the **Agenda (Calendar)** to warn or prevent booking if a required **Recurso Físico (Resource)** (such as a specific room or laser machine) is already reserved at that time by another appointment, so that double bookings of physical space or equipment never occur.
18. As a **Profissional (Provider)**, I want to click `"Lista de espera"` (`Waitlist`) on the **Agenda (Calendar)** top bar to open the right-hand **Lista de Espera (Waitlist)** drawer, filter by **Profissional (Provider)**, add new waitlist entries, and convert a waitlist entry into a confirmed appointment in 1 click when a slot opens.
19. As a **Profissional (Provider)**, I want to click any existing appointment block on the **Agenda (Calendar)** to open the Appointment Details & 1-Tap Checkout drawer, where I can confirm presence, trigger a WhatsApp reminder, execute 1-Tap Rebooking (`+15d`, `+30d`, `+45d`),redeem a **Pacote**/**Assinatura** credit, or complete payment via Pix/Cartão/Dinheiro.
20. As a **Profissional (Provider)**, I want to click `"Venda rápida"` (`Quick sale`) from the **Agenda (Calendar)** top bar or from a **Cliente (Client)** drawer to open the POS checkout drawer, select services, products or custom amounts, apply discounts or tips, and generate an instant Pix QR Code or record card/cash payment.
21. As a **Profissional (Provider)**, I want to open `Pagamentos → Histórico de vendas` (`Sales history`) to inspect a clean tabular ledger of all completed and pending sales with `Horário do agendamento`, `Cliente`, `Status` and `Valor`, and click any row to view its itemized receipt.
22. As a **Profissional (Provider)**, I want to open `Pagamentos → Faturas` (`Invoices`), view the Editorial Hero showcase (`"Expanda suas opções flexíveis de pagamento com faturas"`), and click `"Criar uma fatura"` to open the full-page `Nova Fatura` (`New Invoice`) editor.
23. As a **Profissional (Provider)**, I want to build an itemized **Fatura (Invoice)** with `Detalhes` (`Título da fatura`, `Profissional`, `Observação`), `Itens da fatura` (services, products, packages, custom charges), `Adicionar desconto na fatura`, `Taxa/Imposto` and `Cronograma de pagamento`, and click `"Enviar"` to generate a shareable payment link via WhatsApp or e-mail.
24. As a **Profissional (Provider)**, I want to open `Pagamentos → Vale-presentes` (`Gift Cards`) to issue digital gift cards with custom balances and redeem them during checkout.
25. As a **Profissional (Provider)**, I want to open `Clientes` (`Clients`), switch between the Editorial Hero view and the populated client directory, search by name/email/phone, and filter by retention segments (`Todos`, `Ausentes +30/45 dias`, `VIPs`), so that I can quickly identify clients who need reactivation.
26. As a **Profissional (Provider)**, I want to click a **Cliente (Client)** row in the `Clientes` table to open the right-hand Client Profile Drawer displaying their avatar initial, contact info, `"Agendar horário"`, `"Venda rápida"`, and the 5 icon tabs (`Agendamentos`, `Notas/Fichas`, `Fotos`, `Assinaturas`, `Pacotes`).
27. As a **Profissional (Provider)**, I want to switch between `Próximos` (`Upcoming`), `Cancelados` (`Canceled`) and `Anteriores` (`Past`) inside the `Agendamentos` tab of the Client Profile Drawer, so that I have full visibility into the client's visit history and no-show behavior.
28. As a **Profissional (Provider)**, I want to record and edit clinical anamnesis, allergy alerts, chemical formulas and personal preferences inside the `Notas/Fichas` (`Notes/Forms`) tab of the Client Profile Drawer, so that every visit is personalized and safe.
29. As a **Profissional (Provider)**, I want to open the `Fotos` tab of the Client Profile Drawer (or click the camera quick-add button directly on the client row) to upload Before & After photos into the **Galeria Auto-Organizada (`Auto-sorted`)**, where photos are automatically grouped and labeled by appointment date and service.
30. As a **Profissional (Provider)**, I want to view and manage active **Assinaturas (`Memberships`)** and **Pacotes (`Packages`)** inside their respective tabs in the Client Profile Drawer, seeing remaining session credits and expiration dates.
31. As a **Profissional (Provider)**, I want to open `Catálogo → Serviços` (`Catalog → Services`) and see AI-recommended `"✨ Serviços sugeridos"` with checkboxes, a `"Regenerar"` button, and a `"Criar"` button, so that I can populate my service menu in seconds.
32. As a **Profissional (Provider)**, I want to open the full-page `Novo serviço` (`New service`) editor with left anchor navigation (`Detalhes básicos`, `Configurações padrão`, `Recursos`, `Opções`, `Adicionais`), upload a service cover image, click `"✨ Gerar descrição"` to auto-write the service description, choose a category and `Cor no calendário`, and toggle `Disponível para agendamento online`.
33. As a **Profissional (Provider)**, I want to configure `Preço` (`Fixo`, `A partir de`, `Preço Oculto`), toggle `Exigir sinal` (`Require deposit`), set `Duração Total`, enable `Adicionar tempo de processamento` (`Add processing time`), and enable `Adicionar tempo de bloqueio` (`Add block time`) inside `Novo serviço`.
34. As a **Profissional (Provider)**, I want to assign required **Recursos Físicos (`Resources`)**, service **Opções (`Options`)** (e.g., hair length or treatment area) and paid **Adicionais (`Add-ons`)** (`+X min · +R$ Y`) inside `Novo serviço`, so that clients can customize their booking and the calendar reserves the exact time and room needed.
35. As a **Profissional (Provider)**, I want to open `Catálogo → Pacotes` (`Packages`) to create multi-session bundles (`Detalhes`, `Produtos e Serviços`, `Preço`, `Validade`, `Termos e Condições`) with the toggle `"Vender no seu site"`, automatically tracking client session credits.
36. As a **Profissional (Provider)**, I want to open `Catálogo → Assinaturas` (`Memberships`) to configure recurring monthly plans with automatic credit renewal.
37. As a **Profissional (Provider)**, I want to open `Catálogo → Recursos` (`Resources`) to manage categories (`Equipamentos` with pink scissor icon and `Salas` with green door icon), add physical rooms and machines, and prevent double bookings across the studio.
38. As a **Profissional (Provider)**, I want to open `Equipe → Profissionais` (`Team → Staff`), choose between `"Configurar equipe"` (multi-staff mode) or `"Sou só eu"` (solo mode), and manage team members, roles, permissions and service assignments.
39. As a **Profissional (Provider)**, I want to open `Equipe → Comissões` (`Team → Commissions`), view the weekly revenue goal card (`Meta Semanal` with progress bar and days remaining), and configure commission policies per staff member across `Serviços` and `Produtos`.
40. As a **Profissional (Provider)**, I want to open `Equipe → Folha de pagamento` (`Team → Payroll`) to review the consolidated **Fechamento de Repasse** for the pay period (appointments, tips, service/product commissions and logged hours) and execute payout via Pix.
41. As a **Profissional (Provider)**, I want to open `Equipe → Controle de ponto` (`Team → Time tracking`) to use the live digital `Timeclock` (`Check in`, `Pausa / Take a break`, `Check out` with live `HH:MM:SS` counter) and configure break types and clock-in/out notifications in `Configurações → Equipe → Controle de Ponto`.
42. As a **Profissional (Provider)**, I want to open `Marketing` to view my campaign history (`Todas`, `E-mail`, `Texto / WhatsApp`), remaining message credits, and launch the split-screen `Nova campanha` modal.
43. As a **Profissional (Provider)**, I want to use the `Nova campanha` modal in 3 steps (`Criar mensagem`, `Selecionar clientes`, `Revisar e enviar`), click `"✨ Criar rascunho"` or pick a ready-made suggestion card (including reactivation of clients absent for +30/45 days), upload an image, and see the live preview rendered inside the smartphone held by a hand on the right panel.
44. As a **Profissional (Provider)**, I want to open `Relatórios` (`Insights`), `Estoque` (`Inventory`) and `Prontuários` (`Charts`) from the sidebar to track studio revenue/retention KPIs, manage retail/backbar stock levels, and review clinical charts across clients.
45. As a **Profissional (Provider)**, I want to open `Configurações` (`Settings`) and navigate across the 4 top tabs (`Pessoal`, `Equipe`, `Negócio`, `Assinatura`) and their left sub-menus (`Detalhes Pessoais`, `Minhas Preferências` with Email/Text/Push checkboxes and Client Notes/Waitlist toggles, `Segurança`, `Controle de Ponto`, `Detalhes do Negócio` with CNPJ/CPF, `Unidades`, `Site de Agendamento`, `Regras de Agendamento`, `Maquininha & Checkout Pix`, `Vale-presentes`) with instant persistence and toast feedback.

## Implementation Decisions

### 1. Design System & Visual Architecture (`DESIGN.md` & `PRODUCT.md`)
- Replace the previous industrial monospace theme with the **AgendaSte Editorial Design System**:
  - **Surfaces**: Pure white primary workspace (`#FFFFFF`), warm light-gray secondary containers (`#F6F6F8`), soft lavender/periwinkle active navigation & showcase cards (`#EEECFF` to `#B8B0FF` subtle gradients), and high-contrast obsidian dark cards (`#18181B`) for live widgets (Smartphone mockups, Weekly Goal tracker, Timeclock, Toast notifications).
  - **Typography**: Editorial Serif display font (`Instrument Serif` / `Newsreader` / `Playfair Display`) for hero headlines (`"Faça cada cliente se sentir o seu favorito"`, `"Expanda suas opções flexíveis de pagamento com faturas"`, `"Apresentando a Recepção"`) paired with geometric Sans-Serif (`Plus Jakarta Sans` / `DM Sans`) for UI controls, tables and forms, and tabular numerals for currency, timers and schedules.
  - **Interactive Primitives**:
    - Primary CTA buttons: Solid pill-shaped dark charcoal (`#1C1C1E`, `border-radius: 9999px`) with white medium-bold text.
    - Secondary CTA buttons: Pill-shaped white or transparent surface with `1px solid #D4D4D8` border (`border-radius: 9999px`).
    - Toggles: Pill switches in AgendaSte Purple (`#6E56CF`) for general preferences/catalog and AgendaSte Pink (`#E11D8F`) for Staff Time Tracking and Calendar current-time indicators.
    - Drawers & Full-Page Editors: Slide-over right drawers (`420px–480px` width) for Calendar New Appointment, Calendar Appointment Details/Checkout, Calendar Waitlist, and Client Profile; sticky left-subnav + scrollable form canvas for New Service, New Package, New Invoice, and Settings.
  - **Dual-Layer Presentation (Editorial Hero + Operational View)**: Sections that feature zero-state/onboarding Editorial Heros in the reference screenshots (`Pagamentos → Faturas`, `Clientes`, `Catálogo → Serviços/Recursos`, `Equipe → Profissionais/Comissões/Folha/Ponto`) will include both the exact Editorial Hero banner/view from the screenshots (accessible via a toggle or initial showcase state) and the fully populated, interactive operational tables, forms and drawers.

### 2. Navigation & Layout Shell
- **Desktop Left Sidebar (`240px` width, collapsible)**:
  - Top Studio/User Switcher (`Bruno Fernandes...` with pink avatar circle and collapse button).
  - `0/3 Primeiros Passos` (dynamically updates `X/3` as steps are completed).
  - Group `Colegas de IA`:
    - `Recepção`
  - Group `Negócio`:
    - `Agenda`
    - `Pagamentos` (collapsible chevron: `Vale-presentes`, `Faturas`, `Histórico de vendas`)
    - `Clientes`
    - `Catálogo` (collapsible chevron: `Serviços`, `Pacotes`, `Assinaturas`, `Recursos [Beta]`)
    - `Equipe` (collapsible chevron: `Profissionais`, `Folha de pagamento`, `Comissões`, `Controle de ponto`)
    - `Marketing`
    - `Relatórios` (collapsible chevron: `Visão Geral & Retenção`, ` Desempenho Financeiro`)
    - `Estoque`
    - `Prontuários`
  - Footer group:
    - `Indique e ganhe R$ 150`
    - `Configurações`
    - `Ajuda`
- **Mobile Navigation**: Responsive top header + drawer menu and bottom quick-access bar for `Agenda`, `Venda Rápida`, `Clientes`, `Recepção IA` and `Menu`.

### 3. Unified Domain Store & Segmented Scheduling Engine
- A central, deterministic domain state engine (with React context/hooks and API route integration) manages all entities using the canonical domain model:

```ts
export type CalendarEventType =
  | "appointment"
  | "personal_block"
  | "working_hours"
  | "waitlist_entry";

export type PriceType = "fixed" | "starting_at" | "hidden";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  calendarColor: string;
  onlineBookingEnabled: boolean;
  priceType: PriceType;
  priceCents: number;
  requireDeposit: boolean;
  depositCents: number;
  durationMinutes: number;
  processingTimeEnabled: boolean;
  processingStartOffsetMinutes: number;
  processingDurationMinutes: number;
  blockTimeEnabled: boolean;
  blockAfterMinutes: number;
  requiredResourceIds: string[];
  options: Array<{ id: string; name: string; priceDeltaCents: number; durationDeltaMinutes: number }>;
  addOns: Array<{ id: string; name: string; priceCents: number; durationMinutes: number }>;
}
```

- **Conflict & Availability Calculation**:
  - When scheduling or validating an `Appointment`, total occupied window on the calendar spans `durationMinutes + (blockTimeEnabled ? blockAfterMinutes : 0)`.
  - If `processingTimeEnabled` is true, the intermediate window `[startsAt + processingStartOffsetMinutes, startsAt + processingStartOffsetMinutes + processingDurationMinutes]` is marked as a **Tempo de Processamento (Processing Time)** gap where the **Profissional (Provider)** is eligible for parallel fit-in bookings.
  - If `requiredResourceIds` are attached to the service, the engine checks if any overlapping active appointment is already locking the same **Recurso Físico (Resource)** (`Salas` or `Equipamentos`) and surfaces an explicit conflict warning/block.

### 4. Database Schema Evolution (`supabase/schema.sql`)
- Expand the PostgreSQL schema (with RLS policies) to cover all AgendaSte domain entities:
  - `professionals` / `staff_members` (roles, commission policies for services and products, weekly revenue goals, solo vs. team mode, personal/notification preferences).
  - `resources` (categories `equipment` and `room`, assigned services).
  - `services` (segmented durations: `processing_duration_minutes`, `block_after_minutes`, `price_type`, `calendar_color`, `online_booking_enabled`, JSONB `options` and `add_ons`).
  - `packages` and `memberships` + `client_package_credits` (session balance tracking per client).
  - `calendar_events` / `appointments` (supporting all 4 `event_type` variants, repeating rules, deposit status, linked resource locks).
  - `waitlist_entries` (requested date/window, provider, service, notes, status).
  - `invoices` and `gift_cards` (itemized line items, discounts, tax, payment schedule, Pix/Link status).
  - `time_tracking_entries` (clock-in, breaks, clock-out, total duration seconds, synced to payroll).
  - `marketing_campaigns` (channel `email` | `whatsapp_sms`, subject, body, image, target segment, credits used).

### 5. Brazilian Payment & WhatsApp API Contracts
- `/api/pix/create`: Generates dynamic Pix payload (EMVCo Copia e Cola + QR visualization) for **Sinal / Taxa de Reserva (Deposit)** in the **Site de Agendamento Online**, **Venda Rápida (Quick Sale)**, and **Faturas (Invoices)**.
- `/api/whatsapp/send`: Dispatches and logs outbound 24h/2h reminders, marketing campaigns, and invoice links, and supports 2-Way Sync webhook/simulation replies (`1_confirmed`, `2_reschedule`).

## Testing Decisions

### Philosophy
- Good tests verify **external behavior and domain contracts** at the highest possible seam, never internal React component implementation details or CSS class names.
- All tests use the canonical terminology from `CONTEXT.md`.

### Seam Under Test
- **Single High-Level Seam**: The **Domain Operations Engine & API Route Seam** (`src/lib/AgendaSte-store.ts` / domain controller functions + `/api/pix/create` and `/api/whatsapp/send`).
- Through this single seam, automated tests and verification scripts can deterministically exercise:
  1. **Segmented Service Scheduling & Resource Locking**: Verifying that creating an appointment with **Tempo de Processamento** and **Tempo de Bloqueio** computes the exact calendar spans and blocks overlapping bookings for the same **Recurso Físico (`Salas`/`Equipamentos`)** while permitting fit-ins during the processing window.
  2. **POS Checkout, Quick Sale & Invoices**: Verifying itemized subtotal, discount, tax, **Vale-Presente** or **Pacote** credit redemption, and dynamic Pix generation.
  3. **Client Retention & Auto-Sorted Photos**: Verifying filtering of clients absent for `+30/45` days and automatic grouping of uploaded photos by appointment date and service.
  4. **Team Commissions, Time Tracking & Payroll**: Verifying that completing sales and logging **Folha de Ponto (`Timesheet`)** entries accurately updates the **Política de Comissão** weekly goal bar and **Fechamento de Repasse (`Payroll`)** totals.
  5. **Recepção IA 2-Way Sync**: Verifying that an inbound `"1"` reply transitions a pending appointment to `confirmed` and updates the live log.

## Out of Scope

- US-specific financial lending (`AgendaSte Financing`) and US physical card-reader hardware Bluetooth firmware pairing.
- US 50-state W-2/1099 federal tax filing with the IRS (replaced by Brazilian **Fechamento de Repasse / Salão Parceiro** via Pix).
- External third-party e-commerce dropshipping (`GeniusShop`).

## Further Notes

- Every screen photographed in `C:\Users\sorai\Desktop\Bruno\Projetos\Agenda\AgendaSte` (`01-get-started` through `08-3-settings-business`) must have its corresponding visual counterpart faithfully represented in the application, including the floating dark confirmation toasts (e.g., `"Cliente Stefany criado com sucesso!"`), the purple/pink switches, the `+2` to `+8` weeks skip popover on the calendar, the 5 icon tabs in the client drawer, and the hand-held smartphone preview in the Marketing campaign modal.
