import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@prisma/client'
import type { RegisterInput, LoginInput } from './auth.validator.js'
import type { AuthResponse, SafeUser } from './auth.types.js'
import { ConflictError, UnauthorizedError } from '../../shared/utils/errors.js'

// ====================================================
// AUTH SERVICE
// ====================================================
// Esta classe contém TODA a lógica de autenticação.
// Ela não sabe nada de HTTP (req, res, status codes).
// Recebe dados limpos, processa, retorna resultado.
//
// Por que uma classe e não funções soltas?
// Porque precisamos INJETAR o Prisma (banco de dados).
// "Injeção de Dependência" significa: ao invés do service
// criar sua própria conexão com o banco, ele RECEBE ela
// de fora. Isso permite:
// 1. Nos testes, injetar um banco FALSO (mock)
// 2. Em produção, injetar o banco REAL
// 3. Trocar o banco sem mudar o service

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

export class AuthService {
  // "private readonly" significa:
  // - private: só essa classe acessa (encapsulamento)
  // - readonly: não pode ser reatribuído depois de criado
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. Verifica se o email já existe
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existing) {
      throw new ConflictError('Email já cadastrado')
    }

    // 2. Faz o hash da senha
    // bcrypt.hash(senha, saltRounds)
    // saltRounds = 12 → significa que o algoritmo roda 2^12 = 4096 iterações
    // Quanto maior, mais seguro (mais lento para um atacante tentar por força bruta)
    // mas também mais lento para o nosso servidor. 12 é um bom equilíbrio.
    const hashedPassword = await bcrypt.hash(input.password, 12)

    // 3. Cria o usuário no banco
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    })

    // 4. Gera os tokens JWT
    const tokens = this.generateTokens(user.id)

    // 5. Retorna usuário (sem senha!) + tokens
    return {
      user: this.toSafeUser(user),
      tokens,
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // 1. Busca o usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      // SEGURANÇA: mensagem genérica para não revelar se o email existe
      throw new UnauthorizedError('Credenciais inválidas')
    }

    // 2. Compara a senha digitada com o hash no banco
    // bcrypt.compare faz o hash da senha digitada e compara com o armazenado
    // NUNCA comparamos strings diretamente — sempre via bcrypt
    const passwordValid = await bcrypt.compare(input.password, user.password)

    if (!passwordValid) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    // 3. Gera tokens e retorna
    const tokens = this.generateTokens(user.id)

    return {
      user: this.toSafeUser(user),
      tokens,
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS (auxiliares internos)
  // ==========================================

  // Gera o par de tokens JWT.
  //
  // POR QUE DOIS TOKENS?
  // - accessToken: vida curta (15min). Usado em cada request.
  //   Se for roubado, o atacante tem pouco tempo de uso.
  // - refreshToken: vida longa (7 dias). Usado APENAS para
  //   pedir um novo accessToken quando o atual expira.
  //   Fica guardado de forma mais segura (httpOnly cookie).
  //
  // jwt.sign(payload, secret, options)
  // - payload: dados que ficam DENTRO do token (ex: userId)
  // - secret: chave secreta para assinar (se alguém alterar o token, a assinatura quebra)
  // - expiresIn: quando o token expira
  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, {
      expiresIn: '15m',
    })

    const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    })

    return { accessToken, refreshToken }
  }

  // Remove campos sensíveis do usuário antes de retornar.
  // NUNCA retornamos a senha, mesmo que seja um hash.
  private toSafeUser(user: any): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }
  }
}
