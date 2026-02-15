// ====================================================
// ERROS CUSTOMIZADOS
// ====================================================
// Por que criar classes de erro próprias?
// Porque o Error padrão do JS só tem "message".
// Nós precisamos também de um "statusCode" HTTP.
//
// Quando o service lança um AppError, o error handler
// global sabe qual status HTTP retornar (400, 401, 404...).
// Sem isso, todo erro seria 500 (Internal Server Error).

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}
