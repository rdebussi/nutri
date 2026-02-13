# Nutri - Roadmap

## Fase 0: Fundação (ATUAL)
- [x] Definir stack tecnológica
- [x] Criar estrutura de documentação
- [x] Configurar agentes especializados
- [ ] Inicializar repositório Git
- [ ] Setup do backend (Node + TypeScript + testes)
- [ ] Setup do frontend (Nuxt 3 + Pinia + testes)
- [ ] Configurar CI básico (lint + testes)

## Fase 1: Core MVP - Autenticação & Perfil
**Objetivo:** Usuário consegue criar conta, fazer login e preencher seu perfil nutricional.

### Backend
- [ ] Setup Express/Fastify com TypeScript
- [ ] Configurar PostgreSQL (usuários, perfis)
- [ ] Autenticação JWT (register, login, refresh token)
- [ ] CRUD de perfil do usuário (peso, altura, objetivo, restrições)
- [ ] Validação de inputs com Zod
- [ ] Rate limiting básico com Redis
- [ ] Testes unitários e de integração

### Frontend
- [ ] Páginas: Landing, Login, Register, Dashboard
- [ ] Formulário de perfil nutricional
- [ ] Autenticação (store Pinia + middleware Nuxt)
- [ ] Testes de componentes

## Fase 2: Geração de Dietas com IA
**Objetivo:** Usuário gera uma dieta personalizada baseada no seu perfil.

### Backend
- [ ] Integração com OpenAI API
- [ ] Prompt engineering para geração de dietas
- [ ] Cache de respostas no Redis
- [ ] Limites de geração por usuário
- [ ] Salvar dietas geradas no MongoDB
- [ ] Endpoints: gerar dieta, listar dietas, ver dieta

### Frontend
- [ ] Tela de geração de dieta (com loading/streaming)
- [ ] Visualização da dieta gerada (refeições, macros, calorias)
- [ ] Histórico de dietas
- [ ] Testes

## Fase 3: Acompanhamento & Engajamento
**Objetivo:** Usuário acompanha sua dieta no dia a dia.

- [ ] Check-in diário (comeu/não comeu cada refeição)
- [ ] Dashboard com progresso semanal
- [ ] Notificações/lembretes
- [ ] Ajuste de dieta baseado no feedback

## Fase 4: Monetização
**Objetivo:** Modelo freemium com Stripe.

- [ ] Integração Stripe (checkout, webhooks)
- [ ] Planos: Free (1 dieta/mês), Pro (ilimitado + features extras)
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
| 0 | Projeto roda localmente com testes passando |
| 1 | Usuário cria conta e preenche perfil |
| 2 | Dieta gerada pela IA e exibida na tela |
| 3 | Usuário acompanha dieta por 1 semana |
| 4 | Pagamento funcional end-to-end |
| 5 | App publicado nas stores |
