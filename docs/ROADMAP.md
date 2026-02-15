# Nutri - Roadmap

## Fase 0: Fundação ✅
- [x] Definir stack tecnológica
- [x] Criar estrutura de documentação
- [x] Configurar agentes especializados
- [x] Inicializar repositório Git
- [x] Setup do backend (Fastify + TypeScript + Vitest)
- [x] Setup do frontend (Nuxt 3 + Pinia + Vitest)

## Fase 1: Core MVP - Autenticação & Perfil ✅
**Objetivo:** Usuário consegue criar conta, fazer login e preencher seu perfil nutricional.

### Backend
- [x] Fastify com TypeScript
- [x] PostgreSQL com Prisma (usuários, perfis)
- [x] Autenticação JWT (register, login, refresh token)
- [x] CRUD de perfil do usuário (peso, altura, objetivo, restrições)
- [x] Validação de inputs com Zod
- [x] Testes unitários e de integração

### Frontend
- [x] Páginas: Landing, Login, Register, Dashboard
- [x] Página de perfil nutricional (/profile) com Nuxt UI
- [x] Autenticação (store Pinia + middleware Nuxt)
- [x] Nuxt UI (componentes + Tailwind CSS) — light mode forçado
- [x] Testes de stores

## Fase 2: Geração de Dietas com IA ✅
**Objetivo:** Usuário gera uma dieta personalizada baseada no seu perfil.

### Backend
- [x] ~~Integração com OpenAI API~~ → Migrado para Google Gemini (2.5 Flash)
  - SDK: @google/generative-ai (substituiu openai)
  - responseMimeType: 'application/json' garante JSON válido
  - Thinking tokens do Gemini 2.5 requerem maxOutputTokens alto (16384)
  - Normalização de totais pós-IA (recalcula macros a partir dos foods)
- [x] MockAiService como fallback quando GEMINI_API_KEY não está configurada
- [x] Prompt engineering para geração de dietas
- [x] Limites de geração por plano (FREE=3/mês, PRO=ilimitado)
- [x] Salvar dietas geradas no MongoDB (Mongoose)
- [x] Endpoints: gerar dieta, listar dietas, ver dieta
- [ ] Cache de respostas no Redis

### Frontend
- [x] Tela de geração de dieta com loading
- [x] Visualização da dieta gerada (refeições, macros, calorias)
- [x] Histórico de dietas
- [x] Testes

## Fase 3: Acompanhamento & Engajamento (ATUAL)
**Objetivo:** Usuário acompanha e adapta sua dieta no dia a dia com precisão.

### 3.1 Check-in Diário ✅
- [x] Check-in diário (comeu/não comeu cada refeição)
- [x] Dashboard com progresso semanal
- [x] Streak de dias consecutivos
- [x] Testes backend (27) + frontend (6)

### 3.2 Registro de Exercícios & Gasto Calórico ✅
**Objetivo:** Dietas consideram o gasto calórico real (TMB + exercícios), não só a TMB.

- [x] Base de dados de exercícios com gasto calórico pré-calculado
  - 30 exercícios com MET (seed idempotente via MongoDB)
  - Categorias: strength, cardio, sports, flexibility, daily
  - Busca por nome + filtro por categoria (GET /exercises)
- [x] Calculadora TDEE (Mifflin-St Jeor + MET por exercício)
  - TMB, gasto por exercício, média semanal, ajuste por objetivo
  - Campo activityLevel removido (redundante com rotina real)
- [x] Rotina semanal de exercícios no perfil do usuário
  - CRUD completo (GET/PUT /users/me/routines)
  - Estratégia "replace all" com transação Prisma
  - Cálculo automático do TDEE (GET /users/me/tdee)
- [x] Registro de exercícios avulsos no check-in
  - Exercício extra com cálculo de calorias por MET
  - Campo totalCaloriesBurned no check-in
- [x] Integração com o prompt da IA
  - TMB, TDEE e Calorias Alvo no prompt de geração
  - Rotina de exercícios detalhada no contexto da IA
- [x] Frontend: página /profile/exercises + TDEE no dashboard
- [x] Testes: 86 backend + 24 frontend = 110 total

### 3.3 Refeições Adaptativas ✅
**Objetivo:** A dieta se adapta ao longo do dia conforme o que o usuário realmente come.

- [x] Motor de recálculo de refeições
  - Funções puras: parseQuantity, scaleQuantity, recalculateMeals
  - Redistribuição proporcional de macros/calorias entre refeições pendentes
  - Escala de quantidades ("150g" × 1.18 → "177g")
  - 23 testes unitários do motor
- [x] Pular refeição
  - Status enum: pending → completed | skipped (substitui boolean `completed`)
  - Opção "Pulei" no check-in com timestamp (skippedAt)
  - Redistribui calorias/macros da refeição pulada nas restantes
  - Quantidades dos alimentos recalculadas automaticamente
- [x] Exercício avulso impacta as refeições
  - Exercícios extra (isExtra=true) aumentam a meta calórica do dia
  - Refeições pendentes se adaptam para compensar o gasto
  - Formulário de exercício extra na página de check-in
- [x] Recálculo em cascata
  - API retorna adaptedMeals + summary em POST e GET /check-ins
  - Summary: consumed, remaining, dailyTarget, exerciseBonus
  - Cada refeição adaptada mostra scaleFactor e quantidades originais
- [ ] Editar refeição (adiado para 3.4 — depende da base de alimentos)
  - Trocar alimento por outro com recálculo automático
- [x] Frontend: redesign completo da página /check-in
  - Cards expandíveis com detalhes dos alimentos (nome, qtd, macros)
  - Botões "Comi"/"Pulei" por refeição com auto-save
  - Badge "Adaptado +X%" em refeições recalculadas
  - Quantidades originais riscadas com novas destacadas
  - Resumo de macros: consumido | restante | meta do dia
  - Seção de exercício extra com seleção e registro
- [x] Testes: 115 backend + 26 frontend = 141 total

### 3.4 Mapeamento de Alimentos
**Objetivo:** Base de dados nutricional para troca e edição inteligente de alimentos.

- [ ] Base de dados de alimentos com valores nutricionais
  - Calorias, proteína, carboidratos, gordura por 100g
  - Categorias: grãos, proteínas, laticínios, frutas, vegetais, etc.
  - Fonte: TACO (Tabela Brasileira de Composição de Alimentos) ou similar
- [ ] Busca de alimentos com autocomplete
  - Busca por nome no frontend com resultados em tempo real
  - Filtros por categoria
- [ ] Troca inteligente de alimentos na dieta
  - Usuário seleciona "trocar macarrão por arroz"
  - Sistema calcula a quantidade de arroz equivalente em macros
  - Recalcula o restante da refeição e do dia
- [ ] Sugestões de substituição
  - Ao trocar um alimento, sugerir equivalentes (mesma categoria, macros similares)
  - Ex: trocar frango → sugerir peixe, carne magra, tofu

### 3.5 Micronutrientes
**Objetivo:** Dietas consideram vitaminas e minerais, não só macronutrientes.

- [ ] Adicionar micronutrientes ao prompt da IA
  - Vitaminas: A, B (complexo), C, D, E, K
  - Minerais: ferro, cálcio, magnésio, zinco, potássio
  - Instrução no prompt: balancear micros conforme RDA (Recommended Daily Allowance)
- [ ] Exibir micronutrientes na visualização da dieta
  - Tabela ou gráfico com % da RDA atingida
  - Alertas quando algum micro está abaixo de 70%
- [ ] Formulário de preferências do usuário (futuro)
  - Alimentos que gosta / não gosta
  - Alergias e intolerâncias detalhadas
  - Preferências de culinária (cozinha brasileira, japonesa, etc.)
  - Horários de refeição preferidos
  - UX intuitiva e progressiva (não sobrecarregar no onboarding)

### 3.6 Notificações & Lembretes
- [ ] Lembrete visual no dashboard (horário da próxima refeição)
- [ ] Notificações push (futuro — depende de service worker ou app mobile)

---

## Fase 4: Monetização
**Objetivo:** Modelo freemium com Stripe.

- [ ] Integração Stripe (checkout, webhooks)
- [ ] Planos: Free (3 dietas/mês), Pro (ilimitado + features extras)
- [ ] Portal do cliente Stripe
- [ ] Controle de acesso por plano

## Fase 5: App Mobile
**Objetivo:** App consumindo a mesma API.

- [ ] Escolha da tecnologia (React Native / Flutter)
- [ ] App com features essenciais
- [ ] Push notifications

---

## Métricas de Sucesso por Fase
| Fase | Critério de Conclusão |
|------|----------------------|
| 0 | Projeto roda localmente com testes passando ✅ |
| 1 | Usuário cria conta e preenche perfil ✅ |
| 2 | Dieta gerada pela IA e exibida na tela ✅ |
| 3 | Usuário acompanha dieta, troca alimentos, registra exercícios e vê micros |
| 4 | Pagamento funcional end-to-end |
| 5 | App publicado nas stores |
