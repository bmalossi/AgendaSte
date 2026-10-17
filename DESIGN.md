---
name: Veloce OS
description: Terminal operacional de agendamento de alta velocidade, checkout e retenção em 1 toque
colors:
  primary: "#0d0e0d"
  neutral-bg: "#f4f4f2"
  surface: "#ffffff"
  line: "#d4d4ce"
  confirmed: "#15803d"
  pending: "#d97706"
  risk: "#dc2626"
typography:
  display:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "Chivo Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "2px"
  md: "2px"
spacing:
  sm: "8px"
  md: "16px"
---

# Design System: Veloce OS

## Overview

**Creative North Star: "Swiss Timetable & Precision POS Terminal"**

O Veloce OS adota a disciplina visual de tabelas horárias ferroviárias suíças combinada com a objetividade tátil de terminais de ponto de venda (POS). Elimina por completo os clichês estéticos de IA generativa (pílulas pastéis verdes/amarelas, cantos excessivamente arredondados e ícones decorativos).

A hierarquia é construída sobre uma grade estrutural exposta de 1px com tipografia de alta densidade e indicadores funcionais sólidos.

**Key Characteristics:**
- Grade arquitetônica contínua de 1px com cantos secos de 2px.
- Sinalização semântica por pontos LED sólidos (Verde `#15803d`, Âmbar `#d97706`, Carmim `#dc2626`), sem fundos pastéis.
- Numerais em `Chivo Mono` tabular para horários e valores monetários.

## Colors

Paleta operacional austera baseada em contraste neutro puro com sinalização semântica funcional estrita.

### Primary
- **Carbon Black** (`#0d0e0d`): Chassi de comando e botões de ação prioritária.

### Neutral
- **Architectural Paper** (`#f4f4f2`): Fundo de baixa fadiga visual.
- **Pure Surface** (`#ffffff`): Células de dados e painéis operacionais.
- **Hairline Border** (`#d4d4ce`): Grade ortogonal divisória de 1px.

### Semantic Status
- **Signal Emerald** (`#15803d`): Horário confirmado e sinal Pix liquidado.
- **Amber Warning** (`#d97706`): Pendência de sinal ou confirmação 2h antes.
- **Signal Red** (`#dc2626`): Risco de no-show ou falta confirmada.

## Typography

**Display / Interface Font:** Public Sans (sans-serif)
**Data / Numeric Font:** Chivo Mono (monospace tabular)

## Layout

Grade exposta com três colunas no desktop (Sidebar 232px, Tabela Central de Despacho e Painel de Retenção 348px) e navegação inferior de 1 toque no mobile.

## Elevation & Depth

Surperfície plana (flat) por padrão. A profundidade é comunicada através de linhas de grade de 1px e contraste tonal, sem sombras decorativas difusas.

## Shapes

Cantos vivos de 2px (`rounded-sm`), reforçando o caráter industrial de terminal de trabalho.

## Do's and Don'ts

### Do:
- **Do** utilizar numerais tabulares (`Chivo Mono`) para valores, horários e códigos Pix.
- **Do** manter botões e gatilhos de ação direta com no máximo 1 a 2 toques.
- **Do** utilizar pontos LED sólidos para codificação de status.

### Don't:
- **Don't** utilizar badges ou pílulas coloridas em tons pastéis com ícones decorativos.
- **Don't** criar caixas arredondadas coloridas ao redor dos horários da agenda.
- **Don't** utilizar cards aninhados dentro de cards.
