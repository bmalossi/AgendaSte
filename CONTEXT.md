# Gestão de Salão, Estética e Bem-Estar (LUVEA Brasil)

Plataforma integrada de agendamento, ponto de venda (POS), relacionamento com clientes (CRM), catálogo de serviços e gestão de equipe para profissionais autônomos e estúdios de beleza, estética e bem-estar no Brasil.

## Language

**Profissional (Provider)**:
O especialista ou membro da equipe que executa o serviço e possui coluna de agenda, regras de comissão e controle de ponto próprios.
_Avoid_: Usuário, Funcionário, Prestador

**Cliente (Client)**:
A pessoa atendida pelo negócio, vinculada a histórico de agendamentos, fichas/notas de atendimento, galeria de fotos auto-organizada, pacotes e assinaturas.
_Avoid_: Paciente, Consumidor, Conta

**Sinal / Taxa de Reserva (Deposit)**:
Valor antecipado via Pix ou cartão exigido antes da data do atendimento para garantir a reserva do horário e proteger contra faltas (no-show).
_Avoid_: Adiantamento, Caução

**Recepção IA (Reception)**:
Agente automatizado de atendimento e triagem via WhatsApp (pareado por QR Code) e voz/texto que responde dúvidas de agendamento 24/7, envia lembretes (24h/2h) e sincroniza confirmações ou reagendamentos diretamente na agenda.
_Avoid_: Chatbot, Disparador de mensagens

**Evento de Agenda (Calendar Event)**:
Alocação de tempo na grade de um Profissional, classificada em quatro tipos: Agendamento de cliente (`Appointment`), Bloqueio Pessoal (`Personal Block`), Horário de Trabalho (`Working Hours`) ou Entrada na Lista de Espera (`Waitlist Entry`).
_Avoid_: Slot, Compromisso

**Lista de Espera (Waitlist)**:
Fila de solicitações de clientes aguardando disponibilidade de horário em datas ou períodos específicos, permitindo encaixe rápido em caso de desistência.
_Avoid_: Fila de espera, Backlog de clientes

**Fatura (Invoice)**:
Ordem de cobrança discriminada por itens (serviços, produtos, pacotes ou valores avulsos) com cronograma de vencimento, descontos e link de pagamento enviado por WhatsApp, SMS ou e-mail.
_Avoid_: Boleto, Conta a receber

**Venda Rápida (Quick Sale)**:
Fluxo de checkout imediato no ponto de venda (POS) para cobrança de serviços, produtos ou valores avulsos via Pix Dinâmico, cartão ou dinheiro, com ou sem agendamento prévio.
_Avoid_: Caixa avulso, Cobrança solta

**Vale-Presente (Gift Card)**:
Crédito pré-pago emitido pelo estúdio que pode ser adquirido por clientes e utilizado como meio de pagamento parcial ou total no checkout.
_Avoid_: Cupom, Voucher de desconto

**Ficha de Atendimento (Chart / Notes & Forms)**:
Registro estruturado no perfil do cliente contendo anamnese, alergias, fórmulas aplicadas, preferências e histórico clínico por visita.
_Avoid_: Observação solta, Comentário

**Galeria Auto-Organizada (Auto-Sorted Photos)**:
Repositório visual do cliente onde fotos enviadas (incluindo comparativos Antes & Depois) são automaticamente agrupadas e rotuladas pela data e serviço do agendamento correspondente.
_Avoid_: Anexo de arquivo, Pasta de imagens

**Tempo de Processamento (Processing Time)**:
Intervalo intermediário dentro da execução de um serviço (ex.: tempo de ação química ou anestésico) no qual o Profissional fica livre na grade para atender outro cliente em paralelo.
_Avoid_: Pausa morta, Intervalo de almoço

**Tempo de Bloqueio (Block Time)**:
Minutos reservados automaticamente após o término de um atendimento para higienização de cabine, preparação de materiais ou checkout, impedindo novos agendamentos imediatos.
_Avoid_: Atraso, Folga

**Recurso Físico (Resource)**:
Sala, cabine, cadeira ou equipamento limitado do estúdio vinculado a determinados serviços para impedir conflitos de reserva simultânea (double booking).
_Avoid_: Ativo, Insumo de estoque

**Pacote (Package)**:
Conjunto pré-pago de sessões de serviços ou produtos adquirido pelo cliente com controle automático de saldo de créditos e prazo de validade.
_Avoid_: Combo avulso, Promoção

**Assinatura (Membership)**:
Plano de cobrança recorrente que concede ao cliente créditos periódicos de serviços ou descontos exclusivos enquanto estiver ativo.
_Avoid_: Mensalidade solta, Fidelidade

**Política de Comissão (Commission Policy)**:
Regra de remuneração variável configurada por Profissional (separada entre Serviços e Produtos) e acompanhada contra uma meta semanal de faturamento.
_Avoid_: Porcentagem avulsa, Rateio

**Fechamento de Repasse (Payroll)**:
Apuração consolidada por período de pagamento que soma comissões de serviços/produtos, gorjetas e horas trabalhadas de cada Profissional para liquidação via Pix ou transferência.
_Avoid_: Holerite manual, Adiantamento

**Folha de Ponto (Timesheet / Time Tracking)**:
Registro cronológico de entrada (`Check in`), intervalos (`Break`) e saída (`Check out`) da jornada diária do Profissional, sincronizado automaticamente com o Fechamento de Repasse.
_Avoid_: Livro de ponto, Relógio manual

**Campanha de Marketing (Marketing Campaign)**:
Disparo segmentado de e-mail ou mensagem de texto/WhatsApp assistido por IA para promoção de serviços, datas comemorativas ou reativação de clientes ausentes.
_Avoid_: Mala direta, Spam

**Site de Agendamento Online (Booking Site)**:
Vitrine digital pública do estúdio (link da bio) onde clientes visualizam o menu de serviços, escolhem horários vagos em tempo real e pagam o Sinal via Pix para confirmar a reserva.
_Avoid_: Landing page institucional, Formulário de contato

**Site Institucional (Marketing Site)**:
Páginas públicas da própria LUVEA (homepage, preços, Termos de Uso, Política de Privacidade) que apresentam o produto a profissionais e estúdios interessados em contratá-lo. Distinto do Site de Agendamento Online, que pertence a cada estúdio e é voltado ao Cliente final.
_Avoid_: Landing page, Site de Agendamento (reservado ao Booking Site)

**Plano (Plan)**:
Nível de contratação da LUVEA pelo estúdio, que define limites de Profissionais e quais módulos ficam disponíveis. Os níveis são Essencial, Gold e Platinum, com cobrança mensal ou anual.
_Avoid_: Pacote (reservado a Package), Assinatura (reservado a Membership), Licença

**Teste Grátis (Free Trial)**:
Período inicial de 14 dias em que o estúdio usa a LUVEA sem cobrança e sem cartão, antes de escolher um Plano.
_Avoid_: Plano gratuito, Freemium

**Encarregado de Dados (DPO)**:
Pessoa ou canal indicado pela LUVEA como ponto de contato com titulares de dados e com a ANPD, nos termos da LGPD.
_Avoid_: Suporte de privacidade

**TV Kiosk (Painel de Recepção)**:
Tela de exibição passiva da agenda do dia em tempo real, projetada para monitores e Smart TVs do estúdio com layout escuro de alto contraste e dados anonimizados em conformidade com a LGPD.
_Avoid_: Painel da TV, Dashboard público, Telão de senha

**Pareamento de TV (TV Pairing)**:
Processo de autorização de um novo dispositivo de exibição mediante geração de código numérico de 6 dígitos com expiração de 10 minutos inserido pela gestora no painel LUVEA.
_Avoid_: Login na TV, Conexão remota

**Token de Dispositivo (Device Token)**:
Identificador único (UUID) gerado na autorização do pareamento e armazenado localmente na Smart TV, validado a cada requisição de sincronização no backend.
_Avoid_: Chave de API, Senha da TV, Sessão de usuário








