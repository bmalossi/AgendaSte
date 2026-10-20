# DESIGN.md — LUVEA Editorial Design System (Edição Brasil)

## 1. Direção Estética & Filosofia Visual
O sistema visual consolida a linguagem de design da **LUVEA**: **Editorial Clean & Luxury Salon OS**.
- **Superfícies Claras e Respiráveis**: Área de trabalho principal em branco puro (`#FFFFFF`) com containers secundários em cinza quente sutil (`#F5F5F7`) e bordas finas (`1px solid #E5E7EB`).
- **Heros Editoriais Ilustrados**: Telas de apresentação de módulos utilizam um card quadrado à esquerda com gradiente lavanda/periwinkle (`linear-gradient(180deg, #A599FF 0%, #DFDCFF 100%)`) contendo um mockup escuro de interface (`#141416`), pareado à direita com tipografia Serif Editorial ampla (`36px–44px`) e chamadas de ação em pílula preta.
- **Contraste Tátil em Pílulas (`Pill Primitives`)**:
  - Botão Primário: Fundo carvão profundo (`#1C1C1E`), texto branco (`#FFFFFF`), `border-radius: 9999px`, `padding: 10px 20px`, `font-weight: 600`.
  - Botão Secundário: Fundo branco (`#FFFFFF`), borda `1px solid #D4D4D8`, texto `#1C1C1E`, `border-radius: 9999px`.
  - Badge `Gold`: Pílula dourada (`#C69214` / `#B78103`) com texto branco em caixa alta/média (`11px`, `font-weight: 700`).
  - Badge `Beta`: Pílula roxa vibrante (`#6E56CF`) com texto branco (`11px`, `font-weight: 600`).
  - Badge `Novo` (`New`): Pílula azul celeste (`#BAE6FD`) com texto `#0369A1`.

## 2. Tipografia
- **Display Editorial (`--font-serif` / `Instrument Serif` / `Playfair Display` / `Newsreader`)**:
  - Usada nos títulos de Heros Editoriais (`"Apresentando a Recepção"`, `"Expanda suas opções flexíveis de pagamento com faturas"`, `"Faça cada cliente se sentir o seu favorito"`, `"Evite conflitos de horário e aproveite ao máximo seu espaço"`).
- **Interface & Operação (`--font-sans` / `Plus Jakarta Sans` / `Inter`)**:
  - Usada na navegação lateral, cabeçalhos de página (`22px`, `font-weight: 700`), tabelas, formulários, drawers e botões.
- **Numerais Tabulares (`--font-mono` / `tabular-nums`)**:
  - Aplicados em preços (`R$ 230,00`), cronômetro de ponto (`04:21:18`), grade de horários (`9:15 am`) e barras de metas (`R$ 1.450,50 de R$ 5.800,00`).

## 3. Paleta de Cores & Tokens Semânticos
- **Workspace & Navegação**:
  - `--bg-canvas`: `#FFFFFF`
  - `--bg-subtle`: `#F6F6F8`
  - `--nav-active-bg`: `#ECE9FE` (destaque lavanda suave do item ativo na sidebar)
  - `--nav-group-border`: `#6E56CF` (contorno roxo suave quando um grupo de submenu está expandido e focado)
- **Acentos & Indicadores**:
  - `--accent-purple`: `#6E56CF` (switches ativos em Catálogo/Preferências, ícones de destaque)
  - `--accent-magenta`: `#E11D8F` (pílula e linha de horário atual na Agenda `9:15`, switches de Controle de Ponto)
  - `--accent-gold`: `#C28E1E` (badges `Gold`)
  - `--status-verified-bg`: `#86EFAC` / `--status-verified-fg`: `#14532D` (badge `Verificado` com micro-indicador circular)
- **Avatares e Categorias**:
  - Rosa Quartzo: `#FBCFE8` (texto `#831843`) — ex.: avatar `S` de Stefany e categoria `Equipamentos`.
  - Verde Sálvia: `#BBF7D0` (texto `#14532D`) — ex.: categoria `Salas`.
  - Lavanda: `#DDD6FE` (texto `#4C1D95`).

## 4. Padrões de Layout & Navegação
1. **Sidebar Esquerda Fixa (`240px`)**:
   - Topo com seletor de conta (`Bruno Fernandes...`) e botão de recolher sidebar.
   - Item `0/3 Primeiros Passos` no topo.
   - Seção `Colegas de IA` (`Recepção`).
   - Seção `Negócio` (`Agenda`, `Pagamentos`, `Clientes`, `Catálogo`, `Equipe`, `Marketing`, `Relatórios`, `Estoque`, `Prontuários`).
   - Rodapé com `Indique e ganhe R$ 150`, `Configurações` e `Ajuda`.
2. **Drawers Deslizantes à Direita (`420px–460px`)**:
   - Usados na **Agenda** (`Novo agendamento`, `Lista de espera`, `Detalhes do Agendamento`, `Venda rápida`) e em **Clientes** (Perfil completo com 5 abas de ícones).
3. **Editores de Página Inteira com Sub-navegação Lateral (`Left Anchor Subnav`)**:
   - Usados em `Novo serviço`, `Novo pacote`, `Nova Fatura` e `Configurações`, com coluna esquerda de âncoras em pílula cinza (`#D4D4D8` / `#E4E4E7` quando ativa) e coluna central de formulário limpo.
4. **Toast Escuro Flutuante**:
   - Barra flutuante centralizada na base da tela (`#1C1C1E`, texto branco, ícone de check e botão `×`) para confirmações imediatas (ex.: `"Cliente Stefany criado com sucesso!"`).

## 5. Diretrizes de Interface & Padrão Fino (Anti-AI Slop)

O projeto segue rigorosamente a estética editorial de luxo (**Editorial Clean & Luxury Salon OS** inspirada em Apple e Linear). NUNCA utilizar padrões genéricos conhecidos como "AI Slop":

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

