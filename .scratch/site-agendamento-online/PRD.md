# PRD: Criação do Site de Agendamento Online com Subdomínio, Regras de Reserva e Configuração de Pagamentos

Status: ready-for-agent

## Problem Statement

No painel operacional da AgendaSte, o bloco de Primeiros Passos ("Vamos começar") exibe 3 cartões de ativação do estúdio: **"Seja encontrado e agendado online"**, **"Adicione seus serviços"** e **"Comece a receber"**. Porém, hoje o botão de "Seja encontrado e agendado online" abre diretamente um modal estático de agendamento como se o usuário já fosse o **Cliente** final, sem permitir que o **Profissional** crie e personalize seu próprio **Site de Agendamento Online**, escolha seu subdomínio exclusivo para enviar aos **Clientes**, defina seu endereço físico ou atendimento a domicílio, configure seus **Horários de Trabalho** por dia da semana, estabeleça regras de aprovação e de **Sinal / Taxa de Reserva** (Pix ou cartão) ou cadastre sua conta bancária e Chave Pix para recebimento. Além disso, o **Cliente** final não possui uma página pública dedicada acessível pelo subdomínio/endereço escolhido pelo **Profissional** que reflita o tema visual, o menu de serviços, o endereço, os horários permitidos e os meios de pagamento aceitos pelo negócio.

## Solution

Construir a jornada guiada completa de criação e publicação do **Site de Agendamento Online** e ativação do estúdio em 3 fases integradas aos 3 cartões de Primeiros Passos do painel, além da página pública do estúdio acessível por subdomínio/endereço próprio para envio aos **Clientes**:

1. **Fase 1 — Configurar Site (`Set up website`, vinculada ao Cartão 1: "Seja encontrado e agendado online"):**
   - **Etapa 1 (Nome do negócio):** Definição do nome do estúdio/negócio com pré-visualização instantânea em mockup de navegador ao vivo.
   - **Etapa 2 (Personalização e Tema):** Escolha entre 6 temas editoriais (*Classic*, *Billboard*, *Canvas*, *Energy*, *Organic*, *Play*) com alternador de visualização *Desktop* e *Mobile* em tempo real.
   - **Etapa 3 (Endereço do site / Subdomínio):** Escolha e reivindicação do subdomínio exclusivo (`<subdominio>.agendaste.com.br`) com atualização ao vivo na barra de endereço do preview.
   - **Etapa 4 (Tela de celebração de publicação):** Tela de confirmação em destaque informando que o novo site está no ar, com toast de confirmação da URL e ações para **Visualizar site** ou avançar para **Configurar serviços e agendamento**.

2. **Fase 2 — Configurar Agendamento e Serviços (`Set up booking`, vinculada ao Cartão 2: "Adicione seus serviços"):**
   - **Etapa 5 (Localização do atendimento):** Chaves seletoras para **Tenho um endereço fixo** (com campos de Endereço Linha 1 obrigatório, Linha 2 opcional, Cidade obrigatória, CEP obrigatório e Estado obrigatório) e **Atendo a domicílio**.
   - **Etapa 6 (Horários de Trabalho do negócio):** Grade dos 7 dias da semana (segunda a domingo) com ativação/desativação por dia e seletores de horário de início e término (ex.: `08:00` às `17:00`), restringindo os horários ofertados aos **Clientes** no **Site de Agendamento Online**.
   - **Etapa 7 (Experiência de agendamento online do Cliente):** Configuração de aprovação de agendamentos (**Aprovar sempre automaticamente** vs. **Aprovação manual**) e exigência de garantia para reservar online (**Sinal via Pix Dinâmico Anti-No-Show**, **Cartão em arquivo para todos os Clientes** cobrado apenas no checkout, ou **Sem exigência prévia**).
   - **Etapa 8 (Adição de serviços e sugestões por IA):** Seleção em 1 clique de serviços sugeridos por IA para o negócio (com botão **Regenerar**), listagem dos **Serviços adicionados** com selo de confirmação e opção **Criar meus próprios serviços** que direciona ao catálogo completo.

3. **Fase 3 — Configurar Pagamentos Aceitos (`Set up payments`, vinculada ao Cartão 3: "Comece a receber"):**
   - **Etapa 9 (Apresentação de taxas e meios de pagamento):** Resumo transparente das vantagens de processamento (Pix Dinâmico instantâneo, cartões com repasse rápido e proteção contra faltas com **Sinal / Taxa de Reserva** e taxas de cancelamento/no-show), acompanhado de mockup visual de checkout por aproximação e Pix.
   - **Etapa 10 (Conta de repasse e Chave Pix):** Configuração do destino dos recebimentos do **Profissional**, permitindo alternar entre **Chave Pix** (padrão brasileiro: CPF/CNPJ, e-mail, celular ou chave aleatória + instituição) e **Conta Bancária / Cartão de Débito** (banco, agência/routing e número da conta).
   - **Etapa 11 (Verificação de identidade):** Etapa de verificação cadastral de conformidade financeira (via gateway integrado Stripe / Mercado Pago) com avisos de correspondência de titularidade bancária e fiscal, botão de verificação e opção de verificar depois.

4. **Progresso nos 3 Cartões de Primeiros Passos e Página Pública do Estúdio:**
   - Conforme cada fase é concluída, o respectivo cartão em "Vamos começar" / "Conclua a configuração" passa ao estado **Tudo pronto!** (*All set!*), atualizando a barra de progresso (`0/3` a `3/3 concluídos`) e exibindo o alerta de pendência no cartão de pagamentos caso a verificação tenha sido adiada.
   - O **Site de Agendamento Online** público do estúdio (acessível pelo botão **Meu site de agendamento** no topo do painel e por rota pública dedicada com o subdomínio/slug do usuário) renderiza a vitrine com o tema escolhido, nome do negócio, endereço/domicílio, **Horários de Trabalho**, menu de serviços e fluxo completo de reserva online pelo **Cliente** respeitando as regras de horário, aprovação e pagamento (Pix Dinâmico ou cartão em arquivo).

## User Stories

1. Como **Profissional**, quero clicar em **"Seja encontrado e agendado online"** no painel de Primeiros Passos e abrir o assistente de criação do meu **Site de Agendamento Online**, para que eu configure minha própria página pública antes de enviá-la aos meus **Clientes**.
2. Como **Profissional**, quero informar ou editar o nome do meu negócio na primeira etapa e ver esse nome refletido instantaneamente no mockup de navegador ao lado, para que eu visualize como minha marca aparecerá no site.
3. Como **Profissional**, quero ter a opção de clicar em **"Alterar depois"** ou **"Avançar"** na etapa de nome do negócio, para que eu não fique travado caso queira decidir o nome definitivo mais tarde em Configurações.
4. Como **Profissional**, quero escolher o tema visual do meu **Site de Agendamento Online** entre 6 opções (*Billboard*, *Canvas*, *Classic*, *Energy*, *Organic*, *Play*), para que a estética da página combine com o estilo do meu estúdio.
5. Como **Profissional**, quero alternar a pré-visualização do tema entre **Desktop** e **Mobile**, para que eu veja exatamente como meus **Clientes** enxergarão o site tanto no computador quanto no celular.
6. Como **Profissional**, quero digitar o endereço desejado para o meu site (subdomínio antes de `.agendaste.com.br`) e ver a barra de URL do navegador de preview atualizar em tempo real, para que eu crie um link fácil de compartilhar no WhatsApp e na bio do Instagram.
7. Como **Profissional**, quero que o endereço do subdomínio seja higienizado automaticamente (letras minúsculas, números e hífens, sem espaços ou caracteres inválidos) e validado contra valores vazios, para que minha URL nunca gere um link quebrado.
8. Como **Profissional**, quero clicar em **"Reivindicar URL"** (*Claim*) e ver uma tela de celebração confirmando que meu novo site está no ar junto a uma notificação de que a URL foi atualizada com sucesso, para que eu tenha certeza de que meu endereço foi reservado.
9. Como **Profissional**, quero na tela de celebração poder clicar em **"Visualizar site"** para abrir minha página pública imediatamente ou em **"Configurar serviços e agendamento"** para continuar o passo a passo, para que eu tenha controle sobre meu fluxo de configuração.
10. Como **Profissional**, quero ativar a opção **"Tenho um endereço fixo"** e preencher Linha 1 (obrigatório), Linha 2 (opcional), Cidade (obrigatório), CEP (obrigatório) e Estado (obrigatório), para que o endereço completo do meu espaço apareça no meu **Site de Agendamento Online**.
11. Como **Profissional**, quero ativar a opção **"Atendo a domicílio"** isoladamente ou em conjunto com o endereço fixo, para que meus **Clientes** saibam que ofereço atendimento móvel/domiciliar.
12. Como **Profissional**, quero poder pular a etapa de endereço clicando em **"Pular esta etapa"**, para que eu possa concluir o cadastro mesmo se ainda não tiver local fixo definido.
13. Como **Profissional**, quero definir meus **Horários de Trabalho** para cada um dos 7 dias da semana (habilitando ou desabilitando dias de funcionamento e escolhendo o horário de início e término de cada dia), para que os **Clientes** só consigam agendar dentro da minha janela real de atendimento.
14. Como **Profissional**, quero configurar se os agendamentos feitos online devem ser **Aprovados sempre automaticamente** ou se exigem aprovação manual, para que eu escolha entre conveniência imediata na agenda ou triagem prévia.
15. Como **Profissional**, quero escolher se os **Clientes** devem fornecer garantia no agendamento online — podendo optar por **Sinal / Taxa de Reserva via Pix Dinâmico**, **Cartão obrigatório para todos os Clientes** (cobrado apenas no checkout) ou **Sem exigência prévia** —, para que eu proteja minha agenda contra faltas (*no-show*) da forma mais adequada ao público brasileiro.
16. Como **Profissional**, quero ver na etapa final de agendamento uma lista de **Serviços sugeridos por IA** com nome, duração e preço, podendo adicioná-los ao meu menu em um clique, para que eu monte meu catálogo em segundos.
17. Como **Profissional**, quero clicar em **"Regenerar"** nas sugestões de IA para receber novas opções de serviços estéticos e de beleza, para que eu encontre sugestões alinhadas à minha especialidade.
18. Como **Profissional**, quero ver na mesma tela a lista de **Serviços adicionados** com a indicação de confirmado e um atalho **"Criar meus próprios serviços"** que leva à página completa de catálogo, para que eu revise o que já está no menu do site ou cadastre serviços personalizados.
19. Como **Profissional**, quero iniciar a configuração de pagamentos e ver de forma clara as taxas de processamento, o prazo de recebimento e a proteção contra faltas (Pix Dinâmico, cartão e retenção de **Sinal / Taxa de Reserva**), para que eu entenda como receberei pelos atendimentos.
20. Como **Profissional**, quero cadastrar minha conta de recebimento escolhendo entre **Chave Pix** (CPF/CNPJ, e-mail, celular ou chave aleatória), **Conta Bancária** (banco, agência e conta) ou **Cartão de Débito**, para que todos os valores cobrados no **Site de Agendamento Online** e na **Venda Rápida** sejam repassados para mim.
21. Como **Profissional**, quero passar pela etapa de **Verificação de identidade** (com avisos claros sobre correspondência de titularidade bancária e informações fiscais), podendo iniciar a verificação no gateway (Mercado Pago / Stripe) ou escolher **"Verificar depois"**, para que minha conta cumpra as exigências regulatórias de pagamento.
22. Como **Profissional**, quero que, ao escolher **"Verificar depois"** ou pular a conta de repasse, o cartão **"Comece a receber"** no painel mostre o aviso de que a configuração de pagamentos está pendente/restrita com o botão **"Começar"**, para que eu lembre de concluir a verificação antes de liquidar repasses.
23. Como **Profissional**, quero ver no painel de Primeiros Passos o progresso atualizado (`1/3`, `2/3`, `3/3 concluídos`) e o selo **"Tudo pronto!"** (*All set!*) em cada cartão finalizado, para que eu acompanhe exatamente o que falta para ativar meu estúdio por completo.
24. Como **Profissional**, quero voltar a qualquer etapa anterior do assistente pelo botão **"Voltar"** ou fechar o assistente no botão **"X"** sem perder os dados já salvos, para que a navegação seja segura e reversível.
25. Como **Profissional**, quero copiar ou abrir o link público do meu **Site de Agendamento Online** (`<subdominio>.agendaste.com.br` / rota pública dedicada) a partir do painel, para que eu o envie diretamente aos meus **Clientes** por WhatsApp ou redes sociais.
26. Como **Cliente**, quero abrir o link enviado pelo **Profissional** e ver o **Site de Agendamento Online** renderizado com o tema escolhido, o nome do negócio, o endereço (ou indicação de atendimento a domicílio) e os **Horários de Trabalho**, para que eu reconheça o estúdio e confie na página.
27. Como **Cliente**, quero navegar pelas seções do site do estúdio (*Sobre*, *Serviços*, *Contato* e *Agendar agora*) tanto no celular quanto no computador, para que eu consulte preços, durações e localização antes de reservar.
28. Como **Cliente**, quero selecionar um serviço (e opcionais, quando houver), escolher o **Profissional**, selecionar uma data e ver apenas horários compatíveis com os **Horários de Trabalho** configurados pelo negócio, para que eu nunca tente reservar em um dia ou horário em que o estúdio está fechado.
29. Como **Cliente**, quero concluir minha reserva informando meu nome, WhatsApp e e-mail e realizando a garantia exigida pelo estúdio (**Sinal / Taxa de Reserva via Pix** ou **Cartão em arquivo**), para que meu agendamento seja registrado na agenda do **Profissional** com o status correspondente à regra de aprovação do estúdio.
30. Como **Profissional**, quero que todo agendamento feito pelo **Cliente** na minha página pública apareça imediatamente como um **Evento de Agenda** no meu calendário (como confirmado quando a aprovação automática estiver ativa, ou aguardando confirmação quando manual), respeitando a trava de **Recurso Físico** (ADR 0002) e o **Tempo de Processamento** / **Tempo de Bloqueio**, para que minha agenda nunca sofra conflito de horário.

## Implementation Decisions

- **Seam único no módulo de domínio do estúdio:** Toda a lógica de estado, validação e transição do assistente de 3 fases e do **Site de Agendamento Online** será centralizada no módulo de estado e domínio do estúdio já existente, mantendo um único ponto de verdade e de teste para o comportamento do negócio.
- **Estrutura de configuração do Site de Agendamento Online e Pagamentos no estado do estúdio:**
  ```ts
  type BookingSiteThemeId =
    | "classic"
    | "billboard"
    | "canvas"
    | "energy"
    | "organic"
    | "play";

  interface DayBusinessHours {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo .. 6 = Sábado
    label: string;
    isOpen: boolean;
    startTime: string; // "08:00"
    endTime: string;   // "17:00"
  }

  interface WebsiteBookingSetupConfig {
    theme: BookingSiteThemeId;
    subdomainSlug: string; // ex.: "brunofernandesmalossisilva"
    websitePublished: boolean;
    hasFixedAddress: boolean;
    doesHouseCalls: boolean;
    addressLine1: string;
    addressLine2: string;
    city: string;
    zipCode: string;
    state: string;
    businessHours: DayBusinessHours[];
    autoApproveAppointments: boolean; // true = Always, false = Manual
    onlineBookingGuarantee: "pix_deposit" | "card_on_file" | "none";
    paymentsSetup: {
      payoutMethod: "pix_key" | "bank_account" | "debit_card";
      pixKeyType: "cpf_cnpj" | "email" | "phone" | "random";
      pixKeyValue: string;
      bankName: string;
      routingOrAgency: string;
      accountNumber: string;
      debitCardLast4: string;
      identityVerified: boolean;
      setupCompleted: boolean;
    };
  }
  ```
- **Normalização e resolução de subdomínio:** O subdomínio escolhido pelo **Profissional** é normalizado para formato de slug válido (minúsculas, sem acentos, convertendo espaços em vazio ou hífen) e sincronizado com o identificador público do negócio. O domínio exibido na interface segue o formato `<subdominio>.agendaste.com.br` e é servido pela aplicação tanto via rota pública dedicada (`/site/<subdominio>`) quanto via visualização interativa no próprio app, garantindo que o link possa ser aberto e compartilhado em qualquer ambiente (desenvolvimento local ou produção).
- **Fidelidade às 3 fases do assistente e ao padrão estético do projeto:**
  - O assistente em tela cheia segue a estrutura exata das referências fornecidas: cabeçalho limpo com marca e botão fechar, barra de progresso segmentada na base, botões de ação inferiores (*Voltar*, ação secundária *Alterar depois / Pular esta etapa / Verificar depois*, e botão primário em pílula escura *Avançar / Reivindicar URL / Concluir*).
  - Nenhum elemento visual do tipo *"AI slop"* (gradientes pastel artificiais, caixas amarelas de alerta genéricas, ícones decorativos soltos ou brilhos/sparkles) será utilizado. Toda a interface segue o padrão **Editorial Clean & Luxury Salon OS** (tipografia Instrument Serif nos títulos de destaque, Plus Jakarta Sans na interface, JetBrains Mono nos dados técnicos/URLs/horários, paleta monocromática em carvão `#18181B`, branco puro, divisórias finas em `zinc-200` e verde editorial sólido na tela de celebração de publicação da URL).
- **Regras de negócio aplicadas ao Site de Agendamento Online público:**
  - Os horários disponíveis exibidos ao **Cliente** para uma data selecionada são filtrados pelos **Horários de Trabalho** configurados para aquele dia da semana (`isOpen`, `startTime` até `endTime`). Se o dia estiver marcado como fechado, nenhum horário de reserva é ofertado naquela data.
  - A criação do agendamento pelo site público (`bookFromPublicSite`) verifica se o horário solicitado está dentro do expediente configurado para o dia, além de manter a verificação de conflito de **Recurso Físico** e **Tempo de Processamento** (ADR 0002).
  - Quando `autoApproveAppointments` está ativo (`true`), o agendamento entra com status `confirmed`; quando desativado (`false`), entra com status `pending` aguardando aprovação do **Profissional**.
  - A etapa de garantia no checkout do **Site de Agendamento Online** se adapta à opção `onlineBookingGuarantee`: exibe cobrança de **Sinal via Pix Dinâmico** (integrada à rota de Pix existente), captura de **Cartão em arquivo** (sem cobrança imediata, apenas garantia contra *no-show*) ou confirmação direta sem exigência financeira prévia.
- **Sincronização com os 3 cartões de Primeiros Passos:**
  - Concluir ou reivindicar a URL na Fase 1 marca o passo `booking_site` como concluído.
  - Concluir a Fase 2 (endereço, horários, experiência e serviços) marca o passo `add_services` como concluído.
  - Concluir a Fase 3 (configuração de conta de repasse/Pix e verificação) marca o passo `start_getting_paid` como concluído; se o usuário pular ou escolher "Verificar depois", o cartão 3 permanece com indicador de restrição/pendência até a conclusão.

## Testing Decisions

- **O que define um bom teste:** Os testes devem validar exclusivamente o comportamento observável através das funções públicas do módulo de domínio do estúdio (estado retornado após cada operação, regras de bloqueio de horário fora do expediente, normalização de subdomínio, transição dos passos de onboarding e status do agendamento criado pelo **Cliente**), sem acoplamento a classes CSS ou detalhes internos de componentes React.
- **Seam único de teste:** O módulo de estado e domínio do estúdio (`agendaste-store`).
- **Casos que serão testados:**
  1. Atualização do nome do negócio, escolha de tema entre os 6 temas disponíveis e reivindicação de subdomínio (normalizando caracteres especiais/espaços e marcando o site como publicado e o passo `booking_site` como concluído).
  2. Configuração de localização (endereço fixo completo com Linha 1, Linha 2, Cidade, CEP, Estado e flag de atendimento a domicílio) e atualização dos **Horários de Trabalho** dos 7 dias da semana.
  3. Cálculo de horários disponíveis e validação em `bookFromPublicSite`: rejeitar agendamentos em dias marcados como fechados ou fora da janela `startTime`–`endTime` configurada pelo **Profissional**, e permitir agendamentos dentro da janela respeitando a trava de **Recurso Físico** (ADR 0002).
  4. Respeito às políticas da experiência de agendamento online: agendamentos criados pelo site público recebem status `confirmed` quando `autoApproveAppointments` é `true` e `pending` quando `false`, registrando o método de garantia (`pix_deposit`, `card_on_file` ou `none`).
  5. Adição de serviços sugeridos por IA e regeneração de sugestões durante o fluxo de configuração, marcando o passo `add_services` como concluído.
  6. Configuração de pagamentos e repasse (Chave Pix brasileira e Conta Bancária) e controle do status de verificação de identidade, refletindo no passo `start_getting_paid` (concluído quando verificado/configurado vs. pendente quando adiado).
- **Arte prévia:** Os testes unitários e de integração de domínio já presentes em `src/lib/__tests__/` executados via `node --test` (`npm test`).

## Out of Scope

- Provisionamento dinâmico de DNS curinga (`*.agendaste.com.br`) em provedor externo de domínio (a resolução por subdomínio/slug é tratada no roteamento da aplicação Next.js).
- Onboarding KYC real com envio de documentos de identidade para a API de produção do Stripe Connect (a etapa de verificação simula o fluxo de redirecionamento/verificação e persiste o status no estado do estúdio, mantendo a integração real de Pix via Mercado Pago já existente).
- Cobrança automática de multa no cartão de crédito em arquivo (o fluxo registra o cartão de garantia do **Cliente** para checkout posterior).

## Further Notes

- Todas as telas do assistente e do **Site de Agendamento Online** são apresentadas integralmente em português do Brasil (`pt-BR`), mantendo a estrutura visual, ergonomia e sequência exata das telas de referência enviadas pelo usuário, com suporte nativo ao ecossistema brasileiro (Pix Dinâmico, CEP, Estados brasileiros e WhatsApp).
