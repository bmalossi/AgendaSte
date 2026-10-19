# Checklist de Pré-Lançamento do Site Institucional & SaaS AgendaSte

Este documento reúne todos os pré-requisitos comerciais, jurídicos e operacionais que devem ser validados antes de iniciar campanhas de tráfego pago, prospecção ativa de clientes e cobrança de assinaturas na plataforma AgendaSte.

---

## 1. Dados Legais & Corporativos (LGPD / Marco Civil)

| Item | Descrição | Status Atual | Ação Necessária |
| :--- | :--- | :---: | :--- |
| **Razão Social & Nome Fantasia** | Definição da pessoa jurídica detentora do software AgendaSte. | 🟡 Provisório (`AgendaSte Tecnologia Ltda.`) | Atualizar em `src/lib/legal-config.ts` |
| **CNPJ** | Inscrição no Cadastro Nacional da Pessoa Jurídica da Receita Federal. | 🔴 Pendente (`00.000.000/0000-00`) | Preencher CNPJ ativo e regular |
| **Endereço da Sede** | Endereço físico completo da sede para citação e atendimento ao consumidor. | 🔴 Pendente (`[a preencher]`) | Informar logradouro, cidade, UF e CEP |
| **E-mail de Suporte e Contato** | Canal oficial para dúvidas de contratação, faturamento e cancelamento. | 🟡 Provisório (`suporte@agendaste.com.br`) | Ativar caixa postal de suporte |
| **Encarregado de Dados (DPO)** | Nome e e-mail do Encarregado pelo Tratamento de Dados Pessoais (LGPD Art. 41). | 🔴 Pendente (`dpo@agendaste.com.br`) | Designar responsável e canal de privacidade |

> **Nota técnica:** A aplicação possui um sistema de detecção automática de pendências em `src/lib/legal-config.ts`. Enquanto houver campos pendentes, um banner discreto e elegante de rascunho de pré-lançamento alerta o administrador sobre a necessidade de preenchimento, exibindo `[a preencher]` nos campos em aberto.

---

## 2. Revisão Jurídica Formal

| Documento | Cláusulas Críticas Inclusas | Status Atual | Ação Necessária |
| :--- | :--- | :---: | :--- |
| **Termos de Uso** (`/termos-de-uso`) | • Modelo SaaS (licença temporária, revogável, não exclusiva)<br>• Regras de agendamento e Sinal Pix obrigatório<br>• Limites de uso aceitável da IA e anti-spam<br>• Política de renovação mensal/anual e rescisão<br>• Limitação de responsabilidade por no-show | 🟢 Minuta Completa (11 cláusulas) | Validação e rubrica por advogado especialista em Direito Digital e SaaS |
| **Política de Privacidade** (`/politica-de-privacidade`) | • Conformidade estrita com LGPD (Lei 13.709/2018)<br>• Tratamento de dados sensíveis de saúde (prontuários, anamnese)<br>• Armazenamento e isolamento de fotos antes/depois<br>• Relação de Subprocessadores (Mercado Pago, Meta, Cloudflare R2, Vercel)<br>• Direitos dos titulares e canal do Encarregado (DPO) | 🟢 Minuta Completa (11 cláusulas) | Validação e adequação às rotinas operacionais com advogado |

---

## 3. Comercial & Conversão

| Canal | Configuração | Status Atual | Ação Necessária |
| :--- | :--- | :---: | :--- |
| **WhatsApp de Demonstração** | Variável `NEXT_PUBLIC_DEMO_WHATSAPP` no ambiente de produção. | 🟡 Fallback Seguro (direciona para `/app`) | Configurar número internacional no formato `5511999998888` na Vercel |
| **Mensagem de Conversão** | Texto pré-formatado no wa.me: *"Olá! Gostaria de agendar uma demonstração da AgendaSte..."* | 🟢 Configurado e testado | Confirmar se o atendente comercial está pronto para receber leads |
| **Período de Teste Grátis** | 14 dias sem exigência de cartão de crédito para novos cadastros. | 🟢 Ativo na interface e botões | Garantir gatilho de expiração após 14 dias no backend |

---

## 4. Tabela de Preços e Limites dos Planos

| Plano | Preço Mensal | Preço Anual (por mês) | Limites Chave | Status |
| :--- | :---: | :---: | :--- | :---: |
| **Essencial** | R$ 69 | R$ 59 (~14% off) | 1 profissional, recepção IA em teste, 0 créditos de disparo | 🟢 Pronto |
| **Gold** *(Mais Popular)* | R$ 149 | R$ 129 (~13% off) | Até 9 profissionais, 500 conversas IA/mês, 500 créditos | 🟢 Pronto |
| **Platinum** | R$ 399 | R$ 349 (~13% off) | Profissionais ilimitados, IA ilimitada, 2.500 créditos, suporte VIP | 🟢 Pronto |

> **Validação necessária:** Confirmar viabilidade da margem com base nos custos da Meta Cloud API (WhatsApp) e do modelo de IA (OpenAI / Claude / Gemini).

---

## 5. Infraestrutura, SEO e Segurança

| Item | Requisito | Status Atual | Verificação |
| :--- | :--- | :---: | :--- |
| **Bloqueio de Indexação do App** | `/app` e `/api/*` não devem aparecer nos motores de busca Google/Bing. | 🟢 Concluído | `robots.ts` disallow `/app`, tag `<meta name="robots" content="noindex, nofollow">` |
| **Sitemap XML** | `sitemap.xml` gerado dinamicamente para as 4 páginas públicas. | 🟢 Concluído | Verificado via `/sitemap.xml` |
| **Metatags & OpenGraph** | Título, descrição, canônica e Open Graph por página. | 🟢 Concluído | Inspecionado nas 4 rotas (`/`, `/precos`, `/termos-de-uso`, `/politica-de-privacidade`) |
| **Acessibilidade & Teclado** | Navegação por Tab, Esc para fechar menus, foco visível, contraste WCAG AA. | 🟢 Concluído | Suporte a teclado no header, carrossel e FAQ |
| **Mercado Pago Produção** | `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` reais. | 🟡 Modo Sandbox/Teste | Substituir credenciais nas variáveis de ambiente de produção |
| **Cloudflare R2 Produção** | Credenciais R2 e bucket oficial para uploads de fotos de alta resolução. | 🟡 Fallback Seguro (Mock) | Configurar bucket e chaves de acesso R2 |
| **WhatsApp Cloud API** | ID do número de telefone e token permanente da Meta Business Suite. | 🟡 Fallback Mock Ativo | Homologar número e templates transacionais na Meta |

---

## 6. Procedimento de Lançamento (Go-Live)

1. Preencher os dados corporativos em `src/lib/legal-config.ts` (ou via variáveis de ambiente).
2. Adicionar `NEXT_PUBLIC_DEMO_WHATSAPP` no painel da Vercel.
3. Obter parecer jurídico favorável dos Termos e da Política de Privacidade.
4. Apontar os registros DNS de `agendaste.com.br` para o CNAME da Vercel.
5. Realizar o primeiro teste de compra e emissão de Pix no ambiente de produção.
