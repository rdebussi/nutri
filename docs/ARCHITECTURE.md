# Nutri - Arquitetura

## Visão Geral

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend    │     │  Mobile App │     │  Outros      │
│  (Nuxt 3)   │     │  (Futuro)   │     │  Clientes    │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                    │
       └───────────┬───────┴────────────────────┘
                   │ HTTPS / REST API v1
                   ▼
          ┌────────────────┐
          │   API Gateway  │
          │  Rate Limiting │
          │   (Redis)      │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │   Backend API  │
          │  (Node + TS)   │
          └───┬───┬───┬────┘
              │   │   │
     ┌────────┘   │   └────────┐
     ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│PostgreSQL│ │ MongoDB │ │  Redis   │
│Usuários  │ │ Dietas  │ │ Cache    │
│Pagamentos│ │ Receitas│ │ Sessões  │
│Perfis    │ │ IA Resp │ │ Rate Lim │
└─────────┘ └─────────┘ └──────────┘
                  │
          ┌───────▼────────┐
          │  APIs Externas  │
          │ OpenAI │ Stripe │
          └────────────────┘
```

## Por que dois bancos de dados?

### PostgreSQL (dados estruturados)
- Usuários, autenticação, perfis
- Planos de assinatura, pagamentos
- Dados que precisam de relações fortes e transações ACID
- **Quando usar:** Dados com schema fixo, que precisam de JOINs e integridade referencial

### MongoDB (dados flexíveis)
- Dietas geradas pela IA (estrutura pode variar)
- Receitas (ingredientes, modos de preparo - schema flexível)
- Logs de interação com a IA
- **Quando usar:** Dados com schema variável, documentos aninhados, dados da IA

### Redis (cache e tempo real)
- Cache de respostas da OpenAI (economia de custos)
- Sessões de usuário
- Rate limiting (controle de requisições por IP/usuário)
- Filas de processamento (geração assíncrona de dietas)
- **Quando usar:** Dados temporários, contadores, cache, pub/sub

## Estrutura de Módulos do Backend

```
backend/src/
├── modules/
│   ├── auth/           # Autenticação e autorização
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.test.ts
│   ├── user/           # Perfil do usuário
│   ├── diet/           # Geração e gestão de dietas
│   ├── subscription/   # Planos e pagamentos (Stripe)
│   └── ai/             # Integração com OpenAI
├── shared/
│   ├── middleware/      # Auth, rate limit, error handler
│   ├── database/       # Conexões PG, Mongo, Redis
│   ├── validators/     # Schemas Zod compartilhados
│   └── utils/          # Helpers genéricos
└── config/
    ├── env.ts          # Variáveis de ambiente tipadas
    └── constants.ts    # Constantes da aplicação
```

## Padrões de Design

### Camadas do Backend
1. **Routes** → Define os endpoints e middlewares
2. **Controllers** → Recebe request, valida, chama service, retorna response
3. **Services** → Lógica de negócio (testável independentemente)
4. **Repositories** → Acesso ao banco de dados

### Autenticação
- JWT com access token (curta duração: 15min) + refresh token (longa duração: 7 dias)
- Refresh tokens armazenados no Redis (permite invalidação)
- Passwords com bcrypt (salt rounds: 12)

### Rate Limiting
```
Free:  100 req/min geral, 3 gerações de dieta/mês
Pro:   500 req/min geral, ilimitado gerações
```

### Estratégia de Cache (OpenAI)
- Hash dos parâmetros do usuário como chave
- TTL de 24h para dietas similares
- Invalidação quando perfil muda
