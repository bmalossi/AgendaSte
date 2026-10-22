# Spec: LUVEA TV Kiosk — Painel de Agenda em Tempo Real

Status: ready-for-agent

## Problem Statement

Salões e clínicas de estética precisam de uma forma passiva de exibir a agenda do dia em tempo real em monitores de recepção e Smart TVs, sem que alguém precise operar o computador. Hoje a equipe depende de olhar o celular da gestora ou perguntar verbalmente quem é o próximo cliente — isso gera atrasos, confusão entre profissionais e uma experiência de espera ruim para o cliente.

## Solution

Uma rota dedicada (`/tv`) que transforma qualquer Smart TV, monitor ou dongle (Fire TV, Chromecast) num painel de agenda ao vivo. A TV é pareada com o estúdio via código de 6 dígitos digitado no painel da gestora, e passa a exibir a grade de agendamentos do dia organizada por Profissional, com atualização a cada 20 segundos via polling, proteção LGPD (apenas primeiro nome + inicial), tema escuro de alto contraste legível a 3-5 metros, e proteção contra burn-in. Zero interação necessária após o pareamento.

## User Stories

1. Como gestora do salão, quero parear uma Smart TV ao meu estúdio digitando um código de 6 dígitos no painel, para que a TV exiba minha agenda sem precisar fazer login na TV.
2. Como gestora, quero ver um QR Code na tela da TV que me leva direto para a tela de pareamento no meu celular, para que eu não precise navegar manualmente até as configurações.
3. Como gestora, quero que a TV exiba a grade de agendamentos do dia agrupada por Profissional em colunas, para que toda a equipe enxergue de relance quem está atendendo quem.
4. Como gestora, quero que o nome do cliente apareça mascarado (ex: "Mariana O." em vez de "Mariana da Silva Oliveira"), para cumprir a LGPD e proteger a privacidade dos clientes na área pública do salão.
5. Como gestora, quero que telefone, e-mail, CPF e valores financeiros nunca apareçam na TV, para conformidade total com a LGPD.
6. Como gestora, quero que quando eu alterar um agendamento no celular/PC, a TV reflita a mudança em até 20 segundos, para que a equipe sempre trabalhe com informação atualizada.
7. Como gestora, quero ver badges de status coloridos (Em Atendimento, Próximo, Atrasado, Concluído, Aguardando) para entender o estado de cada atendimento a distância.
8. Como gestora, quero que agendamentos cancelados e no-show não apareçam na TV, para manter a grade limpa e focada no que é acionável.
9. Como gestora, quero que a TV mostre um relógio digital em tempo real e a data por extenso no cabeçalho, para referência rápida.
10. Como gestora, quero ver um indicador de status de conexão na TV (conectado / reconectando), para saber se a TV está recebendo dados.
11. Como gestora, quero que a TV continue exibindo a última agenda carregada quando o Wi-Fi cair, com um aviso discreto de "reconectando", para que a equipe não fique sem informação.
12. Como gestora, quero gerenciar (listar e revogar) as TVs conectadas na tela de Configurações do painel, para manter controle de quais dispositivos têm acesso à minha agenda.
13. Como gestora, quero dar um nome a cada TV pareada (ex: "TV Recepção", "TV Sala VIP"), para identificá-las facilmente na lista.
14. Como gestora, quero que a TV pare de exibir dados automaticamente se minha assinatura da LUVEA for cancelada, para que ex-clientes não continuem com acesso.
15. Como gestora com 6 ou mais Profissionais, quero que a TV pagine automaticamente entre grupos de 5 colunas a cada 20 segundos, para que todos os profissionais sejam exibidos mesmo em telas menores.
16. Como gestora com apenas 1-2 Profissionais, quero que as colunas ocupem toda a largura da tela, para aproveitar o espaço sem ficar espremido.
17. Como gestora, quero que a TV não entre em modo de descanso enquanto o painel estiver ativo, para que eu não precise acordar a tela manualmente várias vezes ao dia.
18. Como gestora, quero que a tela tenha proteção contra burn-in (micro-movimentação imperceptível), para preservar a vida útil do meu monitor OLED/LED.
19. Como gestora, quero que quando não houver agendamentos no dia, a TV exiba uma mensagem elegante ("Sem agendamentos hoje"), para que não pareça que o sistema travou.
20. Como gestora, quero que quando todos os agendamentos do dia forem concluídos, a TV exiba "Agenda do dia concluída", para comunicar claramente que o expediente encerrou.
21. Como gestora, quero que o código de pareamento expire em 10 minutos e só funcione uma vez, para que ninguém abuse de um código que ficou exposto na tela.

## Implementation Decisions

### Modelagem de dados
- Nova tabela `tv_pairings` com `organization_id` (FK para `organizations`, não `businesses`), consistente com o modelo multi-tenant existente.
- Código de pareamento armazenado como 6 dígitos numéricos (`VARCHAR(6)`). Prefixo `LUV-` é renderizado apenas na UI.
- Timezone lido de `organizations.settings->>'timezone'`, default `America/Sao_Paulo`.
- RLS habilitado: policy de tenant isolation para autenticados, policy de `INSERT` anônimo restrita a `status = 'PENDING'` e `organization_id IS NULL`.

### Arquitetura de sync
- A TV **não acessa Supabase diretamente**. Zero credenciais Supabase no client da TV.
- Dados de agendamento servidos via API Route (`/api/tv/appointments`) usando `supabaseAdmin` server-side, retornando apenas dados LGPD-safe.
- Polling a cada 20 segundos para agendamentos. Polling a cada 3 segundos durante o pareamento.
- Sem Supabase Realtime no módulo inteiro — decisão motivada por ausência de auth na TV e compatibilidade com browsers de Smart TVs.

### Status derivado
- Não há novo status no schema de `appointments`. Os badges visuais (Em Atendimento, Próximo, Atrasado, etc.) são derivados por lógica temporal na API route comparando `starts_at`/`ends_at` com `now()`.
- Agendamentos `canceled` e `no_show` são filtrados na API e nunca chegam à TV.

### Segurança
- Token de device é UUID v4 (2¹²² combinações), validado server-side em cada request.
- Token sem expiração temporal, vinculado a `subscription_status` da organização. Revogável pela gestora.
- API route com rate limiting.
- Nomes mascarados server-side com skip de preposições brasileiras (da, de, do, das, dos, e).

### Rota e middleware
- `/tv` excluída do matcher do middleware Next.js — não precisa de refresh de sessão Supabase.
- Rota standalone com layout mínimo (fundo `#09090B`, sem navigation, sem sidebar).

### API routes
- `POST /api/tv/pair` — gera código de pareamento (anônimo)
- `POST /api/tv/authorize` — gestora autoriza código (autenticado)
- `GET /api/tv/appointments` — polling de agendamentos (token no header `Authorization: Bearer`)
- `GET+DELETE /api/tv/devices` — lista/revoga TVs (autenticado)

### Contrato de dados

```typescript
interface TVAppointmentDTO {
  id: string;
  startTime: string;      // "14:00"
  endTime: string;        // "15:30"
  clientName: string;     // "Mariana O." (LGPD-safe)
  serviceName: string;    // "Corte + Escova"
  status: "in_progress" | "next" | "delayed" | "completed" | "waiting";
  professionalId: string;
  professionalName: string;
}

interface TVPollingResponse {
  organizationName: string;
  logoUrl: string | null;
  timezone: string;
  professionals: {
    id: string;
    name: string;
    appointments: TVAppointmentDTO[];
  }[];
  serverTime: string;     // ISO 8601
}
```

### UI e compatibilidade
- Animações em CSS puro (sem framer-motion) — consistente com o projeto e otimizado para Smart TVs.
- Layout adaptativo: 1-5 Profissionais em colunas diretas, 6+ com paginação automática em grupos de 5 a cada 20s.
- QR Code via `qrcode.react` (~3KB, SVG inline).
- Wake Lock em camadas: Wake Lock API → vídeo 1px invisível → documentação.
- Gerenciamento de TVs como seção dentro de `settings-view.tsx`, com deep-link via query param.

## Testing Decisions

- Toda lógica de negócio extraída em funções puras num módulo `tv-kiosk` (sem I/O, sem Supabase), testadas com `node:test` + `node:assert/strict` — mesmo padrão dos 7 arquivos de teste existentes.
- Funções testadas: `maskNameLGPD`, `deriveAppointmentStatus`, `generatePairingCode`, `buildTVPollingResponse`, `paginateProfessionals`, `filterTVAppointments`.
- Bons testes: testam comportamento externo (dado input X, output Y), não detalhes de implementação. Cenários com nomes brasileiros reais, edge cases de timezone, profissionais com zero agendamentos, agendamentos em transição de status.
- API routes são wrappers finos — a lógica testável vive nas funções puras.

## Out of Scope

- Suporte a múltiplos dias (apenas dia atual)
- Customização visual por estúdio (logo custom, cores custom)
- TV como ponto de interação (touch, controle remoto)
- Modo landscape/portrait adaptativo (apenas landscape 16:9)
- Notificações sonoras na TV
- Histórico de conexões/desconexões de TVs
- Limite de TVs por plano (sem cap no MVP)
- Integração com sistemas de digital signage terceiros

## Further Notes

- ADR `0004-tv-kiosk-device-auth-and-polling.md` deve ser criado documentando as 3 decisões arquiteturais inéditas: token de device, exclusão do middleware, polling em vez de Realtime.
- Novos termos de domínio para `CONTEXT.md`: **TV Kiosk (Painel de Recepção)**, **Pareamento de TV (TV Pairing)**, **Token de Dispositivo (Device Token)**.
