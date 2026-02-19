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
- [x] Cache de respostas no Redis (diet-cache.service.ts)

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
- [x] Troca de alimento no check-in (não altera a dieta base)
  - foodOverrides no check-in: snapshot do original + alimento substituto
  - applyFoodOverrides(): função pura que aplica overrides sem mutar o original
  - PATCH /check-ins/foods/swap → salva no check-in, roda adaptação com overrides
- [x] Frontend: redesign completo da página /check-in
  - Cards expandíveis com detalhes dos alimentos (nome, qtd, macros)
  - Botões "Comi"/"Pulei" por refeição com auto-save
  - Badge "Adaptado +X%" em refeições recalculadas
  - Quantidades originais riscadas com novas destacadas
  - Resumo de macros: consumido | restante | meta do dia
  - Seção de exercício extra com seleção e registro
- [x] Testes: 115 backend + 26 frontend = 141 total

### 3.4 Mapeamento de Alimentos ✅
**Objetivo:** Base de dados nutricional para troca e edição inteligente de alimentos.

- [x] Base de dados de alimentos com valores nutricionais
  - ~100 alimentos brasileiros baseados na tabela TACO
  - Calorias, proteína, carboidratos, gordura por 100g
  - 10 categorias: grains, proteins, dairy, fruits, vegetables, legumes, fats, beverages, sweets, others
  - Porções comuns por alimento (ex: "1 xícara" = 160g)
  - Seed idempotente (MongoDB com upsert)
- [x] Busca de alimentos com filtros
  - GET /api/v1/foods com busca por nome (regex case-insensitive) e filtro por categoria
  - Frontend: input de busca com debounce (300ms) + chips de categoria
- [x] Troca inteligente de alimentos na dieta
  - PATCH /api/v1/diets/:id/meals/:mealIndex/foods/:foodIndex/swap
  - Equivalência calórica: calcula gramas do novo alimento para manter mesmas calorias
  - Arredondamento para múltiplos de 5g (praticidade na cozinha)
  - Recalcula macros da refeição e totais da dieta automaticamente
  - Funções puras: calculateFoodMacros, calculateEquivalentGrams, formatQuantity
- [x] Sugestões de substituição
  - GET /api/v1/foods/:id/suggestions
  - Retorna alimentos da mesma categoria com calorias ±30%
- [x] Frontend: modal de troca no check-in
  - Botão "trocar" em cada alimento da tabela de refeições
  - Modal com busca, filtros por categoria e preview de gramas equivalentes
  - Dieta atualiza em tempo real após confirmação
- [x] Testes: 142 backend + 32 frontend = 174 total

### 3.4b Separação de Swap (Check-in vs Base) + Meal Refresh ✅
**Objetivo:** Check-in swap não altera a dieta base. Dieta base tem swap permanente + refresh de refeição inteira via IA.

- [x] Check-in food overrides (swap per-day)
  - IFoodOverride no schema: mealIndex, foodIndex, originalFood, newFood
  - applyFoodOverrides(): função pura com deep clone
  - computeAdaptation() aplica overrides antes de recalcular
  - PATCH /check-ins/foods/swap → salva no check-in, não altera dieta base
- [x] Meal refresh com Gemini (regenera refeição inteira)
  - generateSingleMeal() no AiService (Gemini 2.5 Flash)
  - buildMealRefreshPrompt(): macros alvo, ingredientes a evitar, restrições
  - RefreshLog model: contador atômico por dia (findOneAndUpdate + $inc)
  - Rate limiting: FREE=2/dia, PRO=10/dia, ADMIN=ilimitado
  - POST /diets/:id/meals/:mealIndex/refresh
  - maxOutputTokens: 16384 (thinking tokens do Gemini 2.5 requerem margem)
- [x] FoodSwapModal.vue: componente compartilhado extraído do check-in
  - Props: open, targetFood (name + calories)
  - Search com debounce, category chips, preview de gramas equivalentes
  - Usado tanto no check-in quanto na tela de dieta
- [x] Frontend: redesign da tela de dieta (diets/[id].vue)
  - Migração para Nuxt UI (UCard, UButton, UBadge, UAlert)
  - Swap button (⇄) em cada alimento → altera a dieta base permanentemente
  - Refresh button (↻) em cada refeição → regenera via Gemini
  - Skeleton animation durante refresh, swap-flash animation
  - Badge com refreshesRemaining no topo
- [x] Testes: 169 backend + 38 frontend = 207 total

### 3.4c Edição de Refeição + Alimentos Customizados + Favoritos ✅
**Objetivo:** Usuário edita o que realmente comeu, cria alimentos próprios e marca favoritos.

#### Backend
- [x] Alimentos customizados (UserFood)
  - CRUD: POST/GET/PUT/DELETE /api/v1/foods/custom
  - Macros por 100g ou por porção (conversão automática per-serving → per-100g)
  - Index composto unique: { userId, name } + text index para busca
  - Validação Zod com refine (exige per-100g OU per-serving)
  - Ownership: apenas o dono pode editar/deletar
- [x] Favoritos (FoodFavorite)
  - Toggle pattern: POST /api/v1/foods/favorites (add/remove)
  - GET /api/v1/foods/favorites (lista populada com dados do alimento)
  - DELETE /api/v1/foods/favorites/:foodId
  - Suporte a ambas fontes: 'database' (FoodItem) e 'custom' (UserFood)
- [x] Edição de refeição no check-in (MealOverride)
  - PATCH /api/v1/check-ins/meals/edit
  - MealOverride substitui todos os foods de uma refeição no dia
  - Snapshot do original preservado para comparação
  - Prioridade: mealOverride > foodOverride (mesmo mealIndex)
  - Adaptação em cascata: refeições pendentes recalculam automaticamente
  - Dieta base NÃO é alterada (edição afeta apenas o check-in do dia)
- [x] Busca unificada de alimentos
  - GET /api/v1/foods?include=custom,favorites
  - Mergea FoodItem + UserFood quando autenticado + include=custom
  - Marca isFavorite quando include=favorites
  - Backward compatible: sem include, retorna apenas FoodItem
- [x] Funções puras: applyMealOverrides() (deep clone, sem mutação)
- [x] Testes: 249 backend total (59 novos — user-food, food-favorite, meal-overrides, meal-edit)

#### Frontend
- [x] CustomFoodModal.vue — formulário de alimento customizado
  - Duas tabs de input: por 100g e por porção
  - Preview em tempo real dos macros normalizados
  - Categoria, ingredientes (opcional)
- [x] MealEditModal.vue — editor completo de refeição
  - Lista editável de alimentos (editar quantidade, remover)
  - Recálculo proporcional de macros ao editar gramas
  - 3 tabs para adicionar: Buscar / Favoritos / Meus Alimentos
  - Busca unificada com ícone de favorito (estrela)
  - Badge "Meu" em alimentos customizados
  - Botão "Criar alimento" abre CustomFoodModal (nested)
  - Totais em tempo real (kcal, P, C, G)
- [x] Check-in page atualizada
  - 3 botões por refeição: Comi / Pulei / Editar
  - Badge "Editado" (azul) em refeições com mealOverride
  - Tooltip: "Original: X kcal → Editado: Y kcal"
  - Botão "Editar" abre MealEditModal
- [x] Food store estendido
  - customFoods, favorites, fetchFoodsUnified
  - createCustomFood, updateCustomFood, deleteCustomFood
  - toggleFavorite, fetchFavorites
- [x] Checkin store estendido
  - editMealInCheckIn → PATCH /check-ins/meals/edit
- [x] Testes: 79 frontend total (17 novos — food-store, custom-food, meal-edit-modal, checkin-store)

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
