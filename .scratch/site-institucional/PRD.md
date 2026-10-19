# PRD: Site Institucional AgendaSte (Homepage, Preços e Páginas Legais)

Status: ready-for-agent

## Problem Statement

Hoje a raiz do domínio abre direto o painel operacional. Um profissional ou estúdio de beleza, estética e bem-estar que chega à AgendaSte pela primeira vez não encontra nenhuma página que explique o produto, mostre o que cada **Plano** inclui, quanto custa, como funciona o **Teste Grátis** ou como seus dados e os de seus **Clientes** são tratados. Sem isso, o produto não pode ser vendido como SaaS: não há onde converter visitantes em testes, não há tabela de preços e não há Termos de Uso nem Política de Privacidade (LGPD), que são obrigatórios antes de cobrar clientes e de tratar dados sensíveis de saúde (Fichas de Atendimento, Galeria Auto-Organizada).

## Solution

Construir o **Site Institucional (Marketing Site)** da AgendaSte, distinto do **Site de Agendamento Online** de cada estúdio, em um layout editorial moderno e requintado inspirado na estrutura de uma plataforma de referência, mas com identidade, vocabulário, preços, conteúdo e módulos 100% da AgendaSte:

- **Homepage** com hero, seção "Como funciona" em carrossel, fatos verificáveis do produto, casos de uso por perfil, seção "Para quem é" e chamada final.
- **Preços** com 3 **Planos** (Essencial, Gold, Platinum), alternância mensal/anual, tabela "Comparar planos", benefícios e FAQ.
- **Termos de Uso** e **Política de Privacidade (LGPD)** redigidos para o nosso produto, lendo os dados legais de uma configuração única e exibindo `[a preencher]` onde faltar informação.
- **Header com mega menu** (Como funciona, Negócios), rodapé enxuto e botões de conversão (**Entrar**, **Agendar demonstração** via WhatsApp, **Começar teste grátis**).
- O painel passa a viver em `/app` (ADR 0003).

## User Stories

1. Como **Visitante**, quero abrir a raiz do site e entender em segundos o que é a AgendaSte, para que eu decida se ela serve ao meu negócio.
2. Como **Visitante**, quero ver um hero com título claro, subtítulo e botões de ação, para que eu saiba imediatamente como começar.
3. Como **Visitante**, quero iniciar um **Teste Grátis** de 14 dias sem cartão a partir de qualquer página, para que eu experimente sem risco.
4. Como **Visitante**, quero clicar em **Agendar demonstração** e cair em uma conversa de WhatsApp com mensagem pré-escrita, para que eu fale com uma pessoa pelo canal que já uso.
5. Como **Visitante**, quero que "Agendar demonstração" nunca fique quebrado, mesmo sem o WhatsApp comercial configurado, para que eu sempre tenha um caminho de conversão.
6. Como **Visitante**, quero um mega menu **Como funciona** com as categorias Agentes, Agendamento, Marketing e CRM, Pagamentos e PDV, Equipe e Negócio, e Prontuário, para que eu veja o que o produto cobre.
7. Como **Visitante**, quero que cada categoria do mega menu mostre a lista de módulos correspondente e um card de destaque, para que eu explore sem sair da página.
8. Como **Visitante**, quero que clicar em um item do menu me leve à seção correspondente da homepage com rolagem suave, para que eu leia sobre aquele módulo.
9. Como **Visitante**, quero um mega menu **Negócios** com "Por segmento" e "Por porte", para que eu me reconheça no produto.
10. Como **Visitante**, quero que nenhum item do menu leve a link morto ou página "em breve", para que eu confie no site.
11. Como **Visitante** no celular, quero um menu hambúrguer com as mesmas opções, para que eu navegue sem dificuldade.
12. Como **Visitante** usando teclado, quero abrir, percorrer e fechar o mega menu com Tab, setas e Esc, para que o site seja acessível.
13. Como **Visitante**, quero ver na seção "Como funciona" um carrossel de blocos coloridos com mockups das telas reais (Recepção IA, Agenda, Pagamentos, Equipe, Marketing), para que eu veja o produto de verdade.
14. Como **Visitante**, quero avançar e voltar no carrossel com botões e por arraste/rolagem horizontal, para que eu veja todos os blocos.
15. Como **Visitante**, quero que os textos dos mockups estejam em português e usem R$, Pix e WhatsApp, para que eu me identifique com o mercado brasileiro.
16. Como **Visitante**, quero ver números de destaque verdadeiros (24/7 de Recepção IA, 30 segundos para reservar, 14 dias de teste), para que eu confie nas promessas.
17. Como **Visitante**, quero ver casos de uso por perfil (autônomo, estúdio, clínica com equipe), para que eu entenda como o produto resolve o meu caso.
18. Como **Visitante**, quero uma seção "Para quem é" com perfis por segmento e porte, para que eu encontre o meu.
19. Como **Visitante**, quero uma chamada final com os botões de conversão, para que eu aja depois de ler a página.
20. Como **Visitante**, quero acessar `/precos` e ver os 3 **Planos** lado a lado com preço, público-alvo e destaques, para que eu compare.
21. Como **Visitante**, quero alternar entre cobrança mensal e anual e ver o preço anual com o desconto e o preço mensal riscado, para que eu entenda a economia.
22. Como **Visitante**, quero ver o Gold com o selo "Mais popular", para que eu saiba qual plano a maioria escolhe.
23. Como **Visitante**, quero ver na tabela "Comparar planos" os recursos agrupados (Colegas de IA, Agendamento, Pagamentos, Clientes, Equipe, Marketing) com a coluna Gold destacada, para que eu veja o que cada plano libera.
24. Como **Visitante**, quero que limites (Profissionais, conversas, créditos) apareçam claramente na tabela, para que eu escolha o plano certo.
25. Como **Visitante**, quero ver seção de benefícios e FAQ em português com 8 perguntas, para que eu resolva dúvidas sem falar com ninguém.
26. Como **Visitante**, quero que as respostas da FAQ sobre taxas e cancelamento não prometam valores não definidos, para que eu não seja enganado.
27. Como **Visitante**, quero ler os **Termos de Uso** em português claro, para que eu saiba as regras do serviço antes de contratar.
28. Como **Visitante**, quero ler a **Política de Privacidade (LGPD)** com os dados coletados, finalidades, direitos do titular, retenção e terceiros, para que eu saiba como meus dados são tratados.
29. Como **Profissional**, quero que a política explique que a AgendaSte armazena Fichas de Atendimento e fotos (dado sensível de saúde) e qual é o papel de Controlador e Operador, para que eu cumpra a LGPD com meus **Clientes**.
30. Como **Titular de dados**, quero saber como contatar o **Encarregado de Dados**, para que eu exerça meus direitos.
31. Como **Visitante**, quero acessar Termos e Política a partir do rodapé de qualquer página, para que eu os encontre facilmente.
32. Como **Responsável pelo produto**, quero que preços, limites e a matriz de recursos venham de uma única fonte, para que eu ajuste valores em um só lugar e os cards e a tabela nunca divirjam.
33. Como **Responsável pelo produto**, quero que os dados legais da empresa venham de uma configuração única, para que eu os preencha uma vez e as duas páginas se atualizem.
34. Como **Responsável pelo produto**, quero ser impedido de publicar o site enquanto houver `[a preencher]` nas páginas legais, para que eu não lance com texto incompleto.
35. Como **Responsável pelo produto**, quero um checklist de pré-lançamento (dados legais, revisão jurídica, WhatsApp comercial, preços finais), para que nada seja esquecido.
36. Como **Visitante**, quero que o painel continue funcionando em `/app` sem perder funcionalidades, para que clientes atuais não sejam afetados.
37. Como **Visitante**, quero que **Entrar** e **Começar teste grátis** me levem ao painel, para que eu comece de imediato.
38. Como **Visitante** ou buscador, quero títulos, descrições e dados de compartilhamento próprios por página, para que o site apareça bem em buscas e redes.
39. Como **Visitante** com leitor de tela ou baixa visão, quero contraste adequado, foco visível e estrutura semântica, para que eu use o site.
40. Como **Visitante** em qualquer tela (celular, tablet, desktop), quero um layout responsivo sem rolagem horizontal indevida, para que a leitura seja confortável.

## Implementation Decisions

- **Rotas (ADR 0003):** Site Institucional na raiz e em `/precos`, `/termos-de-uso`, `/politica-de-privacidade`; painel em `/app`. Mesmo projeto Next.js, com grupos de rota e layouts separados (institucional com header/rodapé públicos; painel com a sidebar atual).
- **Marca:** AgendaSte. O Aura Studio aparece apenas dentro dos mockups, como estúdio de exemplo. Nenhum texto, número ou depoimento de plataforma de terceiros é copiado.
- **Identidade:** layout da referência com a identidade AgendaSte: Instrument Serif nos títulos grandes, Plus Jakarta Sans no corpo/menu/botões, JetBrains Mono em preços e números; carvão `#1C1C1E`, lavanda, dourado para Gold; blocos sálvia e limão suavizados. Sem glassmorphism, translucidez ou emojis.
- **Módulo de conteúdo do Site Institucional (seam único de teste):** concentra (a) catálogo de **Planos** com preço mensal, preço anual com desconto (~14%), selo "Mais popular", limites e matriz "Comparar planos"; (b) configuração do menu (categorias, itens, destinos âncora ou rota); (c) resolvedor de botões de conversão; (d) configuração legal com detecção de campos pendentes.
- **Planos (provisórios):** Essencial (R$ 69 mensal, R$ 59 anual por mês), Gold (R$ 149 / R$ 129), Platinum (R$ 399 / R$ 349). Sem plano grátis; Teste Grátis de 14 dias sem cartão. Valores e limites ajustáveis em uma única fonte.
- **Matriz de recursos:** apenas módulos existentes no produto (Recepção IA, Assistente de Marketing IA, Site de Agendamento Online, Agenda, Recursos Físicos, Lista de Espera, Venda Rápida e Pix Dinâmico, Faturas e Vale-Presente, Pacotes e Assinaturas, Cadastro/Fichas/Galeria, Profissionais, Comissões/Folha de Ponto/Repasse, Campanhas). Limites provisórios: Profissionais 1/9/ilimitado; Recepção IA teste/500 conversas/ilimitada; créditos de campanha 0/500/2.500.
- **Sem segmentação:** sem abas "Beleza" versus "Estética" na pricing; um único público (beleza, estética e bem-estar).
- **Mega menu:** "Como funciona" com 6 categorias adaptadas aos módulos (Agentes → Recepção IA; Agendamento; Marketing e CRM; Pagamentos e PDV; Equipe e Negócio; Prontuário). "Negócios" com "Por segmento" e "Por porte". Itens levam a âncoras da homepage; itens sem destino real não aparecem.
- **Mídia:** mockups do produto são componentes em código que reproduzem telas reais; hero com foto de fundo gerada (sem texto, sem rostos reconhecíveis) e fallback em gradiente editorial, com o celular do produto desenhado em código; depoimentos substituídos por casos de uso por perfil, sem fotos nem citações.
- **Prova social:** somente fatos verificáveis do produto (24/7, 30 segundos, 14 dias). Nenhuma métrica, cliente ou depoimento inventado.
- **Botões de conversão:** **Começar teste grátis** e **Entrar** levam a `/app` (sem login real nesta etapa). **Agendar demonstração** abre WhatsApp comercial (`wa.me`) com mensagem pré-escrita, número vindo de variável de ambiente pública, com fallback para `/app`.
- **Textos legais:** redigidos do zero para a AgendaSte (que armazena Fichas e fotos, dados sensíveis de saúde; usa WhatsApp, Mercado Pago, armazenamento de imagens e hospedagem), com papéis de Controlador e Operador, direitos do art. 18 da LGPD, retenção, incidentes e **Encarregado de Dados**. Cláusulas agressivas de terceiros (bloqueio por disputa societária, aceitação tácita irrevogável) não são replicadas. Dados da empresa (razão social, CNPJ, endereço, foro, e-mail do encarregado, suporte, vigência) vêm de uma configuração única; campo vazio mostra `[a preencher]`.
- **Rodapé:** logotipo, links de âncora, Preços, Entrar, Começar teste grátis, Termos, Política e direitos autorais. Sem links mortos.
- **Glossário:** termos Site Institucional, Plano, Teste Grátis e Encarregado de Dados já registrados no contexto do domínio; "Plano" não substitui Pacote nem Assinatura.

## Testing Decisions

- **O que é um bom teste:** verifica comportamento externo do módulo de conteúdo (preços exibidos, destinos de links, resolução de botões, pendências legais), nunca detalhes de renderização ou estrutura interna.
- **Seam único:** o módulo de conteúdo do Site Institucional.
- **Casos cobertos:** (1) preço anual igual ao mensal com o desconto definido e Gold como único "Mais popular"; (2) toda linha da matriz referencia um módulo existente e um Plano válido; (3) todo item de menu aponta para âncora ou rota declarada; (4) sem a variável de WhatsApp o botão de demonstração cai em `/app`, e com ela gera o link com a mensagem; (5) a configuração legal informa quais campos estão pendentes.
- **Arte prévia:** os testes de domínio existentes com o executor de testes nativo do Node sobre módulos TypeScript, incluindo os de rotas de API.
- **Fora de teste automatizado:** hero, carrossel e mockups, verificados por checagem de tipos, build de produção e conferência manual no navegador.

## Out of Scope

- Autenticação e cadastro reais, cobrança real de assinaturas e checkout dos Planos.
- Páginas dedicadas por recurso, por segmento ou por porte; blog, central de ajuda e item "Recursos" do menu.
- Multiunidade, Growth Analyst, financiamento, antecipação e demais recursos que a AgendaSte não possui.
- Formulário próprio de contato ou CRM de vendas.
- Revisão jurídica dos textos (obrigatória, mas conduzida pelo responsável fora do código).
- Testes automatizados de renderização de componentes e testes visuais.
- Internacionalização além do português do Brasil.

## Further Notes

- **Bloqueios de publicação (não de construção):** preencher os dados legais reais e revisar Termos e Política com advogado; configurar o WhatsApp comercial; confirmar preços e limites definitivos dos Planos.
- Os textos redigidos são rascunho técnico e não substituem aconselhamento jurídico.
- Referências visuais fornecidas pelo responsável (homepage, pricing, comparação de planos e mega menus) servem de guia de estrutura; seu conteúdo textual e numérico não é reutilizado.
