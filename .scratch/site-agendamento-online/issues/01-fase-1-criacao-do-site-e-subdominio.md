# Ticket 01: Fase 1 — Criação do Site de Agendamento Online (Nome do negócio, 6 Temas com Desktop/Mobile, Subdomínio e Tela de Celebração)

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Ao clicar em **"Seja encontrado e agendado online"** no Cartão 1 de Primeiros Passos no painel operacional, abrir o assistente de criação em tela cheia com as 4 etapas da Fase 1 (*Set up website*):
1. **Nome do negócio:** campo de texto inicializado com o nome atual do negócio, refletindo instantaneamente a marca na janela de navegador simulada ao lado, com botões *Voltar*, *Alterar depois* e *Avançar*.
2. **Personalização e Tema:** escolha entre os 6 temas editoriais (*Billboard*, *Canvas*, *Classic*, *Energy*, *Organic*, *Play*), com *Classic* selecionado por padrão e alternador de visualização **Desktop / Mobile** que atualiza o mockup ao vivo.
3. **Endereço do site (Subdomínio):** campo para o **Profissional** digitar o subdomínio desejado antes do sufixo `.agendaste.com.br`, higienizando caracteres inválidos/espaços automaticamente e atualizando a barra de endereço do navegador de preview em tempo real, com ação primária **Reivindicar URL** (*Claim*).
4. **Tela de celebração de publicação:** tela de confirmação em fundo verde informando que o novo site está no ar (*"Pronto! Seu novo site está no ar!"*), acompanhada da notificação *"URL atualizada com sucesso"* e dos botões **Visualizar site** e **Configurar serviços e agendamento**, marcando o Cartão 1 (`booking_site`) como **Tudo pronto!** (*All set!*).

## Acceptance criteria

- [x] Clicar no Cartão 1 ("Seja encontrado e agendado online") abre o assistente em tela cheia na Etapa 1 da Fase 1.
- [x] Alterar o nome do negócio na Etapa 1 atualiza imediatamente o preview do navegador e persiste no estado do estúdio ao avançar.
- [x] A Etapa 2 permite selecionar qualquer um dos 6 temas (*Billboard*, *Canvas*, *Classic*, *Energy*, *Organic*, *Play*) e alternar o preview entre *Desktop* e *Mobile*.
- [x] A Etapa 3 exibe o sufixo `.agendaste.com.br`, normaliza o subdomínio digitado para formato de slug válido (minúsculas, sem espaços ou símbolos inválidos) e atualiza a URL mostrada no preview.
- [x] Clicar em **Reivindicar URL** exibe a Etapa 4 (tela verde de celebração com toast *"URL atualizada com sucesso"*, botão **Visualizar site** e botão **Configurar serviços e agendamento**), marca o site como publicado e conclui o passo `booking_site` (`1/3 concluídos` e selo **Tudo pronto!** no Cartão 1).
- [x] Testes automatizados de domínio cobrem a atualização de nome, seleção dos 6 temas, higienização de subdomínio e conclusão do passo `booking_site`.

## Blocked by

- None — can start immediately
