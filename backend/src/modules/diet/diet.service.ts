import type { PrismaClient } from '@prisma/client'
import type { AiService } from '../ai/ai.service.js'
import { Diet } from './diet.model.js'
import { AppError } from '../../shared/utils/errors.js'

// ====================================================
// DIET SERVICE
// ====================================================
// Orquestra a geração de dietas. Combina:
// - Prisma (buscar perfil do usuário no PostgreSQL)
// - AiService (gerar dieta via OpenAI)
// - Mongoose/Diet (salvar resultado no MongoDB)
//
// Este é um bom exemplo de um "service de orquestração":
// ele não tem lógica complexa própria, mas coordena
// vários outros serviços para completar um fluxo.

// Limites de geração por plano
const GENERATION_LIMITS: Record<string, number> = {
  FREE: 3,   // 3 dietas por mês
  PRO: -1,   // ilimitado (-1)
  ADMIN: -1,
}

export class DietService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiService: AiService
  ) {}

  async generate(userId: string) {
    // 1. Busca o usuário + perfil nutricional
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    // 2. Verifica limites de geração
    await this.checkGenerationLimit(userId, user.role)

    // 3. Monta os dados para o prompt
    const promptInput = {
      name: user.name,
      weight: user.profile?.weight,
      height: user.profile?.height,
      goal: user.profile?.goal,
      activityLevel: user.profile?.activityLevel,
      restrictions: user.profile?.restrictions,
      gender: user.profile?.gender,
    }

    // 4. Chama a IA para gerar a dieta
    const generated = await this.aiService.generateDiet(promptInput)

    // 5. Salva no MongoDB
    const diet = await Diet.create({
      userId,
      ...generated,
      goal: user.profile?.goal || 'HEALTH',
    })

    return diet
  }

  async listByUser(userId: string) {
    // .sort({ createdAt: -1 }) → mais recentes primeiro
    // .lean() → retorna objetos JS puros ao invés de documentos Mongoose
    //   (mais rápido, usa menos memória, ideal quando não vamos .save())
    return Diet.find({ userId }).sort({ createdAt: -1 }).lean()
  }

  async getById(dietId: string, userId: string) {
    const diet = await Diet.findById(dietId).lean()

    if (!diet) {
      throw new AppError('Dieta não encontrada', 404)
    }

    // Segurança: verifica se a dieta pertence ao usuário
    if (diet.userId !== userId) {
      throw new AppError('Acesso negado', 403)
    }

    return diet
  }

  // ==========================================
  // CONTROLE DE CUSTOS
  // ==========================================
  // Cada chamada à OpenAI custa dinheiro.
  // Limitamos o número de gerações por mês conforme o plano.
  private async checkGenerationLimit(userId: string, role: string) {
    const limit = GENERATION_LIMITS[role]

    // -1 = ilimitado
    if (limit === -1) return

    // Conta quantas dietas o usuário gerou neste mês
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const count = await Diet.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    })

    if (count >= limit) {
      throw new AppError(
        `Limite de ${limit} dietas/mês atingido. Faça upgrade para o plano PRO.`,
        429 // 429 = Too Many Requests
      )
    }
  }
}
