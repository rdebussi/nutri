import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { PrismaClient } from './generated/prisma/client.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { userRoutes } from './modules/user/user.routes.js'
import { dietRoutes } from './modules/diet/diet.routes.js'
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

  // Plugins de segurança
  app.register(cors)
  app.register(helmet)

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
  }

  return app
}
