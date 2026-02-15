import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../utils/errors.js'
import { ZodError } from 'zod'

// ====================================================
// ERROR HANDLER GLOBAL
// ====================================================
// No Fastify, quando qualquer rota lança um erro,
// ele cai aqui. É o "último recurso" antes da resposta.
//
// O Fastify às vezes encapsula o erro original dentro
// de error.cause. Por isso checamos ambos.

function getOriginalError(error: Error): unknown {
  if ('cause' in error && error.cause instanceof Error) {
    return error.cause
  }
  return error
}

export function errorHandler(
  error: Error,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const err = getOriginalError(error)

  // Erros da nossa aplicação (AppError, UnauthorizedError, etc.)
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({
      success: false,
      error: {
        code: err.name,
        message: err.message,
      },
    })
  }

  // Erros de validação do Zod (input inválido do usuário)
  if (err instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    })
  }

  // Erros do Fastify (parsing de JSON, validação de schema, etc.)
  // FastifyError tem statusCode próprio — respeitamos ele.
  const fastifyErr = error as Error & { statusCode?: number; code?: string }
  if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
    return reply.status(fastifyErr.statusCode).send({
      success: false,
      error: {
        code: fastifyErr.code || 'REQUEST_ERROR',
        message: fastifyErr.message,
      },
    })
  }

  // Qualquer outro erro → 500 genérico
  console.error('Unhandled error:', error)

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
    },
  })
}
