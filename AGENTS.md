# Agent Configuration

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical triage role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/` at the repository root). See `docs/agents/domain.md`.

## Diretrizes de Interface & Padrão Fino (Anti-AI Slop)

O projeto segue rigorosamente a estética editorial de luxo (**Editorial Clean & Luxury Salon OS** inspirada em GlossGenius, Apple e Linear). NUNCA utilizar padrões genéricos conhecidos como "AI Slop":

1. **Zero Emoticons e Símbolos Unicode em Badges/Status**:
   - **PROIBIDO** usar caracteres avulsos como `✓`, `○`, `✔`, `★`, `✦`, `↗` soltos em badges de status ou botões.
   - **Padrão Obrigatório**: Micro-indicadores limpos e elegantes (ex: ponto circular sutil `w-2 h-2 rounded-full bg-emerald-500` com anel de opacidade `ring-2 ring-emerald-500/20`) pareado com texto sóbrio (`Conectado`, `Desconectado`). O badge deve ter fundo neutro e sutil (`bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E]`), sem caixas verde-limão/menta berrantes (`bg-[#DCFCE7] text-[#166534]`).

2. **Zero Cards Clichês de IA (Ícone Gigante em Caixa Colorida + Texto Prolixo)**:
   - **PROIBIDO** criar containers com quadrados gigantes coloridos (ex: caixas `w-14 h-14` com cantos arredondados contendo ícone de checkmark verde).
   - **Padrão Obrigatório**: Superfícies minimalistas (`bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl`), ícones discretos em caixas neutras de 36-40px (`bg-white border border-[#E5E5EA] text-[#1C1C1E]`) e hierarquia tipográfica precisa.

3. **Zero Botões com Bordas Vermelhas Estridentes para Desconexão**:
   - **PROIBIDO** usar botões de desconexão/cancelamento com bordas e textos vermelhos chamativos estilo alerta de erro barato (`border-red-200 text-red-600 bg-white hover:bg-red-50`).
   - **Padrão Obrigatório**: Utilizar a pílula secundária do projeto (`border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7]` com `px-4 py-2 rounded-full text-[12.5px] font-medium`) ou botão de texto elegante (`text-[#6E6E73] hover:text-[#1C1C1E]`).

4. **Redação Concisa & Editorial (Zero Jargão e Prolixidade de IA)**:
   - **PROIBIDO** textos de preenchimento redundantes ou expositivos de IA (ex: *"Sincronização bidirecional ativa. O sistema já está respondendo e confirmando agendamentos."*).
   - **Padrão Obrigatório**: Copy direto, editorial e refinado (ex: *"Disparos e confirmações ativos"*, *"Canal oficial para lembretes e confirmações"*).

