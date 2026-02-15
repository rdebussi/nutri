import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { PrismaClient } from '@prisma/client'
import { authRoutes } from './modules/auth/auth.routes.js'
import { userRoutes } from './modules/user/user.routes.js'
import { dietRoutes } from './modules/diet/diet.routes.js'
import { checkinRoutes } from './modules/checkin/checkin.routes.js'
import { exerciseRoutes } from './modules/exercise/exercise.routes.js'
import { foodRoutes } from './modules/food/food.routes.js'
import { errorHandler } from './shared/middleware/error-handler.js'

// ====================================================
// APP FACTORY
// ====================================================
// buildApp recebe opcionalmente um PrismaClient.
// - Em produção: recebe o Prisma real (conectado ao PostgreSQL)
// - Em testes: recebe um mock (banco falso)
//
// Isso é "Injeção de Dependência" na prática.
// O app não cria suas dependências, ele RECEBE de fora.

type AppOptions = {
  prisma?: PrismaClient
}

export function buildApp(opts: AppOptions = {}) {
  const app = Fastify({
    logger: true,
  })

  // Customiza o parser JSON para aceitar body vazio.
  // O $fetch (ofetch) do Nuxt envia Content-Type: application/json por padrão em POST,
  // mesmo quando não há body — sem isso, o Fastify rejeita com FST_ERR_CTP_EMPTY_JSON_BODY.
  // Solução: remove o parser padrão e adiciona um que trata body vazio como null.
  app.removeContentTypeParser('application/json')
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, null)
      return
    }
    try {
      done(null, JSON.parse(body as string))
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  // Plugins de segurança
  // CORS: precisamos declarar os métodos explicitamente porque
  // o @fastify/cors v11+ usa strictPreflight por padrão, que
  // tenta auto-detectar métodos por rota. Porém, rotas em plugins
  // filhos (app.register com prefix) não são visíveis no escopo raiz,
  // então o preflight retornaria apenas GET,HEAD,POST — bloqueando PUT/PATCH/DELETE.
  app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    strictPreflight: false,
  })
  // Helmet: headers de segurança. Os defaults são pensados para sites
  // que servem HTML. Como somos uma API consumida por outro domínio,
  // relaxamos crossOriginResourcePolicy (que bloqueia respostas cross-origin)
  // e crossOriginOpenerPolicy (irrelevante para APIs).
  app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  })

  // Error handler global — captura todos os erros
  app.setErrorHandler(errorHandler)

  // Health check — endpoint simples para verificar se a API está no ar.
  // Usado por load balancers, Docker, Kubernetes, etc.
  app.get('/api/v1/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Rotas de autenticação
  // O "prefix" adiciona /api/v1/auth antes de cada rota do plugin.
  // Então /register vira /api/v1/auth/register
  if (opts.prisma) {
    app.register(authRoutes, { prefix: '/api/v1/auth', prisma: opts.prisma })
    app.register(userRoutes, { prefix: '/api/v1/users', prisma: opts.prisma })
    app.register(dietRoutes, { prefix: '/api/v1/diets', prisma: opts.prisma })
    app.register(checkinRoutes, { prefix: '/api/v1/check-ins', prisma: opts.prisma })
  }

  // Rotas PÚBLICAS (não dependem de Prisma, usam MongoDB)
  app.register(exerciseRoutes, { prefix: '/api/v1/exercises' })
  app.register(foodRoutes, { prefix: '/api/v1/foods' })

  return app
}
