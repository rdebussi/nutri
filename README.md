# Nutri - Dietas Personalizadas com IA

> Sua dieta pensada por inteligência artificial, adaptada em tempo real, e servida em milissegundos.

**Nutri** transforma dados do seu corpo, rotina de exercícios e preferências alimentares em um plano alimentar completo — gerado pelo Google Gemini 2.5 Flash. Pulou o almoço? O jantar se adapta. Correu 5km a mais? Suas refeições compensam. Não curte brócolis? Troque por couve-flor com um clique.

---

## O que o Nutri faz

**Geração inteligente de dietas** — Você preenche seu perfil (peso, altura, objetivo, restrições) e a IA monta um plano com refeições detalhadas, quantidades em gramas e macros calculados.

**Cache por perfil equivalente** — Perfis com TDEE, objetivo e restrições parecidos compartilham um pool de 5 dietas no Redis. Da 6a geração em diante, a resposta vem em ~1ms ao invés de ~3s. Economia brutal de API.

**Refeições adaptativas** — O check-in diário rastreia o que você comeu, pulou e se exercitou. Pulou o café? As calorias são redistribuídas proporcionalmente nas refeições pendentes, com quantidades recalculadas automaticamente.

**Troca de alimentos** — Não gosta de um ingrediente? A base TACO (~100 alimentos brasileiros) sugere substitutos da mesma categoria com calorias similares, calculando a quantidade equivalente em gramas.

**Refresh com IA** — Quer uma refeição totalmente diferente mantendo os mesmos macros? O Gemini regenera a refeição inteira sob demanda.

**Exercícios e TDEE real** — 30 exercícios com valores MET pré-calculados. Seu TDEE é calculado pela fórmula Mifflin-St Jeor + gasto real da sua rotina semanal — nada de "moderadamente ativo".

---

## Stack

```
Frontend                    Backend                     Infra
─────────                   ───────                     ─────
Nuxt 3                      Node.js + TypeScript        PostgreSQL 16
Vue 3 + Pinia               Fastify 5                   MongoDB 7
Nuxt UI + Tailwind          Prisma (PostgreSQL)         Redis 7
TypeScript                  Mongoose (MongoDB)          Docker Compose
Vitest                      ioredis (Redis)
                            Google Gemini 2.5 Flash
                            Zod (validação)
                            JWT + bcrypt (auth)
                            Vitest (207 testes)
```

### Por que 3 bancos?

| Banco | Pra quê | Por quê |
|-------|---------|---------|
| **PostgreSQL** | Usuários, perfis, rotinas de exercício | Dados relacionais com transações ACID. Prisma dá type-safety. |
| **MongoDB** | Dietas, check-ins, alimentos, logs | Estrutura flexível — cada dieta tem formato diferente dependendo do prompt. |
| **Redis** | Cache de dietas, sessões, rate limiting | Leitura em ~1ms. Pool de variantes por perfil nutricional equivalente. |

---

## Como rodar

### Pré-requisitos

- Node.js 20+ (testado com v20 e v22)
- Docker e Docker Compose
- Uma chave do [Google Gemini](https://aistudio.google.com/apikey) (opcional — sem ela, usa mock)

### 1. Clone e instale

```bash
git clone <repo-url> nutri
cd nutri
```

```bash
# Backend
cd backend
cp .env.example .env    # edite com suas chaves
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../frontend
npm install
```

### 2. Suba os bancos

```bash
# Na raiz do projeto
docker compose up -d
```

Isso sobe PostgreSQL, MongoDB e Redis com volumes persistentes e health checks.

### 3. Rode

```bash
# Terminal 1 — Backend (porta 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 3001)
cd frontend
npm run dev
```

Abra `http://localhost:3001` e crie uma conta.

### 4. Variáveis de ambiente

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Bancos
DATABASE_URL=postgresql://nutri:nutri123@localhost:5432/nutri
MONGODB_URI=mongodb://localhost:27017/nutri
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=troque-esse-segredo
JWT_REFRESH_SECRET=troque-esse-tambem

# IA (opcional — sem ela usa MockAiService)
GEMINI_API_KEY=sua-chave-aqui

# Cache (opcional — padrão 6h)
DIET_CACHE_TTL=21600

# Stripe (futuro)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Sem `GEMINI_API_KEY`, o sistema usa um `MockAiService` que retorna uma dieta fake — perfeito pra desenvolver a interface sem gastar créditos.

---

## Testes

TDD desde o primeiro commit. Todos os módulos têm testes unitários.

```bash
# Backend (169 testes)
cd backend
npm test

# Frontend (38 testes)
cd frontend
npm test

# Com coverage
npm run test:coverage
```

---

## Arquitetura

```
┌──────────────┐
│   Nuxt 3     │  ← SPA com Pinia stores e Nuxt UI
│  :3001       │
└──────┬───────┘
       │ REST API v1
       ▼
┌──────────────┐     ┌─────────┐
│   Fastify    │────▶│ Gemini  │  ← Geração de dietas e refresh
│  :3000       │     │ 2.5     │
└──┬───┬───┬───┘     └─────────┘
   │   │   │
   ▼   ▼   ▼
 PG  Mongo Redis
```

### Módulos do backend

```
backend/src/modules/
├── auth/       → Register, login, refresh token (JWT + bcrypt)
├── user/       → Perfil, rotinas de exercício, TDEE
├── diet/       → Geração, listagem, swap, refresh, cache
├── checkin/    → Check-in diário, adaptação, food overrides
├── exercise/   → Base de 30 exercícios com MET
├── food/       → Base TACO (~100 alimentos), sugestões
└── ai/         → Integração Gemini + MockAiService
```

### Fluxo de geração de dieta

```
POST /api/v1/diets/generate
  │
  ├─ 1. Busca perfil (PostgreSQL)
  ├─ 2. Calcula BMR + TDEE (Mifflin-St Jeor + rotina real)
  ├─ 3. Monta cache key: goal + bucket(TDEE, 50) + restrições
  ├─ 4. Redis LLEN → pool cheio (5 variantes)?
  │     ├─ SIM → LINDEX aleatório → ~1ms
  │     └─ NÃO → Gemini 2.5 Flash → ~3s → LPUSH no pool
  ├─ 5. Normaliza macros (recalcula a partir dos alimentos)
  ├─ 6. Salva no MongoDB (cada user tem sua cópia)
  └─ 7. Retorna dieta
```

### Cache inteligente

O TDEE é arredondado para o múltiplo de 50 mais próximo. Isso significa que alguém com TDEE de 1680 e outro com 1720 compartilham o mesmo pool de dietas (bucket 1700). A diferença de 25 kcal é clinicamente irrelevante.

Cada pool guarda até 5 variantes. As primeiras 5 gerações sempre chamam a IA. Da 6a em diante, o Redis retorna uma variante aleatória instantaneamente. TTL de 6 horas renova o pool naturalmente.

Se o Redis cair, tudo continua funcionando — o Gemini é chamado normalmente. Cache é otimização, não dependência.

---

## API

Base: `http://localhost:3000/api/v1`

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login (retorna access + refresh token) |
| POST | `/auth/refresh` | Renovar access token |

### Usuário
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users/me` | Perfil do usuário |
| PUT | `/users/me` | Atualizar perfil |
| GET | `/users/me/routines` | Rotina de exercícios |
| PUT | `/users/me/routines` | Definir rotina semanal |
| GET | `/users/me/tdee` | Calcular TDEE |

### Dietas
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/diets/generate` | Gerar dieta com IA |
| GET | `/diets` | Listar dietas |
| GET | `/diets/:id` | Ver dieta |
| PATCH | `/diets/:id/meals/:meal/foods/:food/swap` | Trocar alimento (permanente) |
| POST | `/diets/:id/meals/:meal/refresh` | Regenerar refeição com IA |

### Check-in
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/check-ins` | Criar/atualizar check-in do dia |
| GET | `/check-ins` | Listar check-ins |
| GET | `/check-ins/:id` | Ver check-in com adaptações |
| PATCH | `/check-ins/foods/swap` | Trocar alimento no dia (não altera dieta base) |

### Exercícios e Alimentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/exercises` | Buscar exercícios (nome + categoria) |
| GET | `/foods` | Buscar alimentos (nome + categoria) |
| GET | `/foods/:id/suggestions` | Sugestões de substituição |

---

## Planos e Limites

| Feature | FREE | PRO | ADMIN |
|---------|------|-----|-------|
| Dietas por mês | 3 | Ilimitado | Ilimitado |
| Refresh por dia | 2 | 10 | Ilimitado |

---

## Roadmap

- [x] Autenticação JWT + perfil de usuário
- [x] Geração de dietas com IA (Gemini 2.5 Flash)
- [x] Check-in diário com progresso semanal
- [x] Exercícios, TDEE e rotina semanal
- [x] Refeições adaptativas em tempo real
- [x] Base de alimentos TACO + troca inteligente
- [x] Refresh de refeição com IA
- [x] Cache Redis por perfil equivalente
- [ ] Micronutrientes no prompt da IA
- [ ] Notificações e lembretes
- [ ] Integração Stripe (pagamentos)
- [ ] App mobile

---

## Projeto pedagógico

O Nutri é também uma ferramenta de aprendizado. Cada módulo foi construído com TDD, cada decisão de arquitetura está documentada em ADRs, e o código é comentado de forma didática quando a lógica não é óbvia.

Se você está aprendendo Node.js, TypeScript, Fastify, Prisma, MongoDB, Redis, Vue 3, Nuxt 3, ou integração com APIs de IA — este repositório é um exemplo prático de como essas peças se encaixam em um produto real.

---

## Licença

Projeto pessoal de aprendizado. Uso livre para fins educacionais.
