<div align="center">

# LUVEA

**Plataforma Completa de Gestão & Agendamento para Estúdios de Beleza, Clínicas e Bem-Estar**  
*Desenvolvida para o mercado brasileiro com foco em máxima eficiência, elegância visual e zero custos de infraestrutura base.*

[![CI Pipeline](https://github.com/bmalossi/luvea/actions/workflows/ci.yml/badge.svg)](https://github.com/bmalossi/luvea/actions/workflows/ci.yml)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Visão Geral

A **LUVEA** é um ecossistema operacional de alta performance para salões de beleza, estúdios de estética, clínicas e profissionais autônomos. Inspirado nas melhores experiências de software do mundo e adaptado à realidade operacional, fiscal e cultural do Brasil.

Diferente de sistemas legados ou engessados, a LUVEA combina:
- **Reserva Online com Sinal Pix Instantâneo** para proteção anti-no-show.
- **Agenda Inteligente com Duração Segmentada**: tempo de aplicação, tempo de processamento/pausa livre para encaixes paralelos e tempo de higienização/bloqueio.
- **Trava de Recursos Físicos Compartilhados**: previne conflitos de salas, cabines ou equipamentos de alto valor (ex.: laser).
- **Prontuário Digital do Cliente**: histórico de visitas, fórmulas de colorimetria, preferências, anamnese e galeria de fotos antes/depois organizadas por agendamento.
- **Ponto de Venda (PDV) & Venda Rápida**: controle de vale-presentes, resgate de pacotes e faturamento em 1 toque.
- **Recepção com Automação WhatsApp 2-Way Sync**: confirmação e reagendamento automatizados com sincronização em tempo real.
- **Persistência em Duas Camadas**: arquitetura resiliente com cache local instantâneo (`localStorage`) e banco na nuvem (`Supabase PostgreSQL`) com canais WebSocket Realtime e Row Level Security (RLS).

---

## ✨ Principais Funcionalidades

### 1. 📅 Agenda Inteligente & Gestão de Conflitos
- **Visualização Flexível**: alternância entre modo Dia e modo Semana (com faixa de navegação dinâmica de 7 dias).
- **Salto Rápido de Semanas (+2 a +8 semanas)**: atalho de 1 toque no popover de calendário para agendamento de retorno.
- **Tempo de Processamento (ADR-0002)**: identifica janelas ociosas durante a pausa de químicas capilares ou procedimentos estéticos e sugere encaixes imediatos para o mesmo profissional.
- **Trava de Recursos Físicos**: bloqueio automático de agendamento se a sala, cabine ou equipamento (ex.: Laser Lavieen) já estiver em uso.
- **Lista de Espera Inteligente**: fila de espera com preenchimento em 1 toque diretamente para a grade de horários.
- **Reagendamento em 1 Toque (1-Tap Rebooking)**: duplicação rápida do último agendamento do cliente com todas as opções e serviços pré-selecionados.

### 2. 💅 Catálogo Completo de Serviços, Pacotes e Recursos
- **Serviços Parametrizáveis**: preços fixos, a partir de ou sob consulta, com exigência de depósito/sinal Pix configurável.
- **Pacotes de Sessões & Assinaturas Mensais**: comercialização de planos de sessões e clubes de recorrência.
- **Recursos Físicos**: cadastro de salas e aparelhos com vinculação automática aos serviços que deles dependem.
- **Sugestões por IA**: geração assistida de descrições comerciais e sugestões de serviços em 1 clique.

### 3. 👥 Clientes, Prontuário & Ficha de Atendimento
- **Drawer de Cliente em 5 Abas**: Detalhes, Histórico de Agendamentos, Prontuário/Ficha de Anamnese, Galeria de Fotos e Pacotes/Assinaturas.
- **Galeria Antes & Depois Auto-organizada**: fotos categorizadas e vinculadas automaticamente a cada atendimento.
- **Filtros de Retenção Ativa**: identificação imediata de clientes ausentes há mais de 30 e 45 dias para campanhas de resgate.

### 4. 💳 Pagamentos, Venda Rápida (PDV) & Faturas
- **Venda Rápida Integrada**: fechamento de comandas com múltiplos métodos (Pix, Cartão de Crédito/Débito, Dinheiro, Pacote e Vale-Presente).
- **Emissão e Envio de Faturas**: montagem de fatura detalhada com itens, gorjeta, descontos e envio rápido.
- **Vale-Presentes Digitais**: criação, controle de saldo e resgate direto no PDV.

### 5. 🤖 Recepção & Sincronização WhatsApp 2-Way
- **Disparo de Lembretes Automáticos**: envio de mensagem com template interativo de confirmação.
- **Webhook de Resposta em Tempo Real**: quando a cliente responde "1" (Confirmar) ou "2" (Reagendar), o status da agenda é atualizado ao vivo via Realtime.

### 6. 👥 Equipe, Ponto Eletrônico & Comissões
- **Controle de Ponto Digital**: registro de entrada, pausa e saída com cálculo de jornada.
- **Comissões Flexíveis**: regras percentuais diferenciadas para serviços e produtos.
- **Fechamento de Repasse (Payroll)**: relatório consolidado de produção, comissões brutas, deduções e valor líquido a repassar.

### 7. 🌐 Site de Agendamento Online (Link da Bio)
- **Experiência Mobile-First Elegante**: página pública rápida para agendamento direto pelo Instagram ou WhatsApp.
- **Sinal Pix Obrigatório**: trava o horário na agenda somente após o pagamento do sinal de reserva.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend Framework** | [Next.js 15.2 (App Router)](https://nextjs.org/) | Servidor e renderização React 19 de alta performance |
| **Linguagem** | [TypeScript 5.8](https://www.typescriptlang.org/) | Tipagem estrita com contratos canônicos de domínio |
| **Estilização** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Design system sólido, alto contraste e sem translucidez excessiva |
| **Ícones** | [Lucide React](https://lucide.dev/) | Iconografia consistente e moderna |
| **Banco de Dados** | [Supabase (PostgreSQL)](https://supabase.com/) | Banco relacional na nuvem com RLS e WebSockets Realtime |
| **Persistência Local** | `localStorage` API | Cache instantâneo zero-loss que preserva o estado ao atualizar a página |
| **Pagamentos Pix** | Mercado Pago / Asaas API | Geração de Pix Copia e Cola dinâmico e validação de sinal |
| **WhatsApp Engine** | Evolution API / Baileys | Sincronização bidirecional de mensagens e webhooks |
| **Testes** | Node.js Test Runner Nativo (`node:test`) | Suíte de testes unitários e de integração de domínio |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** 20.x ou superior
- **npm**, **pnpm** ou **yarn**
- Conta gratuita no [Supabase](https://supabase.com/) (opcional para testes locais, mas recomendada para persistência em nuvem)

### 1. Clonar o Repositório
```bash
git clone https://github.com/bmalossi/luvea.git
cd luvea
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo e preencha com as suas chaves:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon-publica"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"

# WhatsApp (Evolution API / Baileys)
WHATSAPP_API_URL="http://localhost:8080"
WHATSAPP_API_KEY="sua-chave-api"
WHATSAPP_INSTANCE_NAME="luvea-01"

# Gateway Pix (Mercado Pago / Asaas)
PIX_PROVIDER="mercadopago"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-seu-token"
ASAAS_API_KEY="$aact_seu-token"
PIX_WEBHOOK_SECRET="seu-webhook-secret"
```

### 4. Executar o Script SQL no Supabase
1. Acesse o painel do seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá até o **SQL Editor**.
3. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql), cole o conteúdo e clique em **Run**.
4. O script criará todas as tabelas, tipos enumerados, índices, políticas de segurança RLS, canais Realtime e dados sementes de demonstração.

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Testes e Qualidade de Código

O projeto conta com suíte automatizada de testes cobrindo todos os módulos canônicos de negócio:

```bash
# Executa todos os testes de domínio
npm test

# Executa verificação estrita de tipagem TypeScript
npm run typecheck

# Executa lint de conformidade
npm run lint

# Compila o projeto em modo de produção
npm run build
```

---

## 📂 Estrutura do Projeto

```text
luvea/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Pipeline de integração contínua (CI)
│   ├── ISSUE_TEMPLATE/          # Templates para bugs e novas features
│   └── pull_request_template.md # Template para Pull Requests
├── docs/
│   └── adr/                     # Registros de Decisões Arquiteturais (ADRs)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── pix/create/      # Endpoint gerador de Pix Copia e Cola
│   │   │   └── whatsapp/send/   # Endpoint integrador WhatsApp 2-way
│   │   ├── globals.css          # Estilos globais e tokens de cores
│   │   ├── layout.tsx           # Layout raiz com fontes e suppressHydrationWarning
│   │   └── page.tsx             # Ponto de entrada da aplicação
│   ├── components/
│   │   └── agendaste/
│   │       ├── agendaste-app.tsx # Orquestrador central e persistência dupla
│   │       ├── sidebar.tsx       # Menu lateral colapsável com dropdowns reativos
│   │       └── views/
│   │           ├── calendar-view.tsx             # Agenda, Drawers e Slots
│   │           ├── catalog-view.tsx              # Serviços, Pacotes e Recursos
│   │           ├── clients-view.tsx              # Prontuário, Anamnese e Fotos
│   │           ├── get-started-and-reception.tsx # Onboarding, Bio Link e Recepção
│   │           ├── marketing-and-settings-view.tsx # Campanhas e Configurações
│   │           ├── payments-view.tsx             # PDV, Faturas e Venda Rápida
│   │           └── team-view.tsx                 # Equipe, Ponto e Repasses
│   └── lib/
│       ├── __tests__/            # Testes unitários e de integração
│       ├── agendaste-store.ts    # Motor de domínio e lógica de agendamento
│       └── supabase/
│           ├── agendaste-sync.ts # Camada de hidratação e sincronização em nuvem
│           └── client.ts         # Cliente Supabase isomórfico
├── supabase/
│   └── schema.sql                # Schema PostgreSQL completo com RLS e Realtime
├── .env.example                  # Modelo de variáveis de ambiente
├── package.json                  # Manifesto do projeto e dependências
├── tailwind.config.ts            # Configuração do Tailwind CSS
└── tsconfig.json                 # Configuração do TypeScript
```

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Para colaborar:

1. Faça um Fork do projeto (`fork`).
2. Crie uma branch para sua funcionalidade:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Commit suas alterações com mensagens claras e semânticas:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
4. Envie sua branch para o repositório remoto:
   ```bash
   git push origin feature/minha-feature
   ```
5. Abra um **Pull Request**.

Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para mais detalhes.

---

## 🛡️ Segurança

Para relatar vulnerabilidades de segurança, consulte nossa política em [SECURITY.md](SECURITY.md).

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
Desenvolvido com foco em precisão, elegância e alta performance para estúdios e clínicas no Brasil.
</div>
