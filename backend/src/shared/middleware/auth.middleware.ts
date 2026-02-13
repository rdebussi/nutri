import type { FastifyReply, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/errors.js'

// ====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ====================================================
// "Middleware" é uma função que roda ANTES da sua rota.
// Pense nele como um "porteiro":
//
// Request → [Middleware Auth] → [Controller] → Response
//              ↓ se não tem token
//          401 Unauthorized
//
// O middleware verifica se o request tem um token JWT válido.
// Se sim, extrai o userId e coloca no request para o controller usar.
// Se não, bloqueia o request antes de chegar no controller.

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// Estendemos o tipo do FastifyRequest para incluir o userId.
// Isso é TypeScript puro: dizemos ao compilador que, DEPOIS
// do middleware, o request vai ter um campo "userId".
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  // 1. Pega o header "Authorization: Bearer <token>"
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token não fornecido')
  }

  // 2. Extrai só o token (remove "Bearer ")
  const token = authHeader.substring(7)

  try {
    // 3. Verifica se o token é válido e não expirou
    // jwt.verify decodifica o token usando a mesma secret que usamos para assinar.
    // Se alguém alterar o token, a verificação FALHA (assinatura inválida).
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }

    // 4. Injeta o userId no request para o controller usar
    request.userId = payload.sub
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado')
  }
}
