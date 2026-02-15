import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { UserService } from './user.service.js'
import { updateProfileSchema } from './user.validator.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'

// ====================================================
// USER ROUTES
// ====================================================
// Todas as rotas aqui são PROTEGIDAS (precisam de autenticação).
// O onRequest hook roda o authMiddleware antes de cada rota.
//
// "hook" é uma função que roda em um momento específico
// do ciclo de vida da request no Fastify:
// onRequest → preParsing → preValidation → preHandler → handler → onSend

export async function userRoutes(app: FastifyInstance, opts: { prisma: PrismaClient }) {
  const userService = new UserService(opts.prisma)

  // Aplica autenticação em TODAS as rotas deste plugin
  app.addHook('onRequest', authMiddleware)

  // GET /api/v1/users/me
  // Retorna o perfil do usuário logado.
  // Por que "/me" e não "/:id"?
  // Porque o usuário só deve ver SEUS dados.
  // O ID vem do token JWT, não da URL (mais seguro).
  app.get('/me', async (request) => {
    const user = await userService.getProfile(request.userId!)
    return { success: true, data: user }
  })

  // PUT /api/v1/users/me/profile
  // Cria ou atualiza o perfil nutricional.
  // PUT = "substituir recurso" (idempotente: chamar 2x tem o mesmo efeito)
  app.put('/me/profile', async (request) => {
    const data = updateProfileSchema.parse(request.body)
    const profile = await userService.updateProfile(request.userId!, data)
    return { success: true, data: profile }
  })
}
