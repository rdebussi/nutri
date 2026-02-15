import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { AuthService } from './auth.service.js'
import { registerSchema, loginSchema } from './auth.validator.js'

// ====================================================
// AUTH ROUTES
// ====================================================
// No Fastify, rotas são registradas como "plugins".
// Um plugin é uma função que recebe a instância do Fastify
// e adiciona rotas nela. É como um módulo autocontido.
//
// Por que plugin e não só app.post() direto?
// Porque plugins são ENCAPSULADOS. As rotas, hooks e
// decorators registrados aqui não vazam para outros plugins.
// Isso mantém o código organizado conforme o projeto cresce.

export async function authRoutes(app: FastifyInstance, opts: { prisma: PrismaClient }) {
  const authService = new AuthService(opts.prisma)

  // POST /api/v1/auth/register
  // Cria um novo usuário e retorna tokens JWT
  app.post('/register', async (request, reply) => {
    // 1. Valida o body com Zod (se inválido, lança ZodError → error handler pega)
    const input = registerSchema.parse(request.body)

    // 2. Chama o service (lógica de negócio)
    const result = await authService.register(input)

    // 3. Retorna 201 (Created) com os dados
    // 201 significa "recurso criado com sucesso"
    // (diferente de 200 que é "operação ok")
    return reply.status(201).send({ success: true, data: result })
  })

  // POST /api/v1/auth/login
  // Autentica usuário e retorna tokens JWT
  app.post('/login', async (request, reply) => {
    const input = loginSchema.parse(request.body)
    const result = await authService.login(input)
    return reply.send({ success: true, data: result })
  })
}
