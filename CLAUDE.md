# Nutri - Plataforma de Dietas com IA

## Sobre o Projeto
Nutri é uma plataforma para montagem de dietas personalizadas usando IA (OpenAI).
O usuário fornece seus dados (peso, altura, objetivo, restrições alimentares, etc.)
e a IA gera um plano alimentar completo. A plataforma também ajuda o usuário a
manter e seguir a dieta com acompanhamento.

## Objetivo Pedagógico
Este projeto é também uma ferramenta de **aprendizado**. O usuário (desenvolvedor)
está aprendendo as tecnologias utilizadas. Sempre que possível, explique conceitos,
padrões e decisões de forma didática.

## Stack Tecnológica

### Backend
- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Banco Relacional:** PostgreSQL (dados estruturados: usuários, planos, pagamentos)
- **Banco Documental:** MongoDB (dados flexíveis: receitas, dietas geradas pela IA)
- **Cache/Filas:** Redis (sessões, rate limiting, cache de respostas da IA)
- **Framework:** Express.js ou Fastify (a definir na implementação)

### Frontend
- **Framework:** Vue 3 + Nuxt.js 3
- **State Management:** Pinia
- **Linguagem:** TypeScript
- **UI:** A definir (Tailwind CSS recomendado)

### APIs de Terceiros
- **Stripe:** Pagamentos e assinaturas
- **OpenAI:** Geração de dietas personalizadas via GPT

## Princípios do Projeto

### Arquitetura
- **API-First:** A API é o produto principal. Será consumida pelo frontend web
  e futuramente por um app mobile
- **RESTful:** Endpoints seguem padrões REST com versionamento (v1)
- **Modular:** Separação clara de responsabilidades (controllers, services, repositories)

### Qualidade
- **TDD:** Testes primeiro, código depois. Sempre.
- **Testes unitários** em cada módulo desde o dia 1
- **Testes de integração** para fluxos críticos
- **Coverage mínimo:** 80%

### Segurança
- Rate limiting por IP e por usuário (Redis)
- Autenticação JWT com refresh tokens
- Validação rigorosa de inputs (Zod/Joi)
- Proteção contra OWASP Top 10
- Sanitização de dados antes de enviar à OpenAI
- Secrets nunca no código (dotenv + variáveis de ambiente)

### Custos
- Cache agressivo de respostas da OpenAI (Redis)
- Limites de uso por tier de assinatura
- Monitoramento de custos da API OpenAI
- Debounce/throttle em chamadas custosas

### Documentação
- Cada etapa do projeto está documentada em `/docs`
- Decisões arquiteturais registradas como ADRs (Architecture Decision Records)
- API documentada com OpenAPI/Swagger

## Estrutura do Projeto (planejada)
```
nutri/
├── CLAUDE.md              # Este arquivo - contexto do projeto
├── docs/                  # Documentação
│   ├── ROADMAP.md         # Fases e objetivos
│   ├── ARCHITECTURE.md    # Decisões de arquitetura
│   └── adr/               # Architecture Decision Records
├── backend/               # API Node + TypeScript
│   ├── src/
│   │   ├── modules/       # Módulos por domínio
│   │   ├── shared/        # Código compartilhado
│   │   └── config/        # Configurações
│   └── tests/
├── frontend/              # Nuxt.js 3
│   ├── pages/
│   ├── components/
│   ├── composables/
│   ├── stores/            # Pinia stores
│   └── tests/
└── .claude/agents/        # Agentes especializados
```

## Convenções
- **Commits:** Conventional Commits (feat:, fix:, docs:, test:, etc.)
- **Branches:** feature/, fix/, docs/
- **Idioma do código:** Inglês
- **Idioma da documentação:** Português (BR)
- **Idioma de comunicação:** Português (BR)
