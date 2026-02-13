# ADR-001: Escolha da Stack Tecnológica

**Data:** 2026-02-13
**Status:** Aceito

## Contexto
Precisamos definir as tecnologias para o projeto Nutri. O objetivo é duplo:
construir um produto funcional E aprender tecnologias novas.

## Decisão

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Backend Runtime | Node.js | Ecossistema rico, async nativo, bom para APIs |
| Backend Language | TypeScript | Tipagem estática, menos bugs, melhor DX |
| DB Relacional | PostgreSQL | Robusto, ACID, ótimo para dados estruturados |
| DB Documental | MongoDB | Flexibilidade para dados da IA |
| Cache | Redis | Velocidade, rate limiting, filas |
| Frontend Framework | Vue 3 + Nuxt 3 | Reatividade, SSR, DX excelente |
| State Management | Pinia | Padrão oficial Vue 3, simples e tipado |
| Pagamentos | Stripe | Líder de mercado, boa documentação |
| IA | OpenAI GPT | Melhor qualidade de geração de texto |

## Consequências
- **Positivas:** Stack moderna, boa documentação, grande comunidade
- **Negativas:** Complexidade de manter 3 bancos de dados, curva de aprendizado
- **Riscos:** Custos da OpenAI podem escalar rápido → mitigado com cache Redis
