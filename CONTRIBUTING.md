# Guia de Contribuição — AgendaSte

Agradecemos o seu interesse em contribuir com o **AgendaSte**! Este documento fornece diretrizes e boas práticas para manter a qualidade, a estabilidade e a integridade da arquitetura do projeto.

---

## 🛠️ Ambiente de Desenvolvimento

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/bmalossi/AgendaSte.git
   cd AgendaSte
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env.local
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 📋 Padrões de Código e Diretrizes

### 1. Nomenclatura e Domínio
- O nome oficial da plataforma é **AgendaSte**. Nunca utilize nomes de plataformas concorrentes ou referências obsoletas em comentários, textos de tela ou código.
- Mantenha a terminologia alinhada ao vocabulário canônico do projeto (`CONTEXT.md` e ADRs em `docs/adr/`).

### 2. Design e UI/UX
- Siga os tokens de design do AgendaSte documentados em `DESIGN.md`.
- Evite "AI slop", como badges e cards excessivamente translúcidos ou com baixo contraste. Priorize fundos sólidos com excelente legibilidade e estados hover bem definidos.

### 3. Persistência e Sincronização
- Ao adicionar novas entidades ou modificar o estado, certifique-se de que as alterações passem pelo manipulador universal `handleUpdateStudioState` em `src/components/agendaste/agendaste-app.tsx` para garantir salvamento no `localStorage` e sincronização no Supabase.

---

## 🧪 Verificação de Qualidade Obrigatória

Antes de abrir um Pull Request, certifique-se de que todos os comandos abaixo passam sem erros:

```bash
# 1. Executar todos os testes de domínio
npm test

# 2. Validar tipagem TypeScript estrita
npm run typecheck

# 3. Executar o lint
npm run lint

# 4. Validar o build de produção Next.js
npm run build
```

---

## 🌿 Fluxo Git & Branches

1. Crie uma branch a partir de `main` com nome semântico:
   - `feat/nome-da-funcionalidade`
   - `fix/descricao-do-bug`
   - `refactor/modulo-alvo`
   - `docs/melhoria-na-documentacao`
2. Utilize commits convencionais (Conventional Commits):
   - `feat: adiciona filtro por profissional no PDV`
   - `fix: corrige cálculo de comissões em serviços combinados`
   - `docs: atualiza instruções de setup do Supabase`
3. Abra um Pull Request utilizando o modelo padrão (`pull_request_template.md`).
