import type { PrismaClient } from '@prisma/client'
import type { AiService } from '../ai/ai.service.js'
import type { ExerciseRoutineInfo } from '../ai/ai.prompts.js'
import { Diet } from './diet.model.js'
import { FoodItem } from '../food/food.model.js'
import { RefreshLog } from './refresh-log.model.js'
import { AppError, NotFoundError } from '../../shared/utils/errors.js'
import { calculateBMR, calculateWeeklyAvgTDEE, adjustForGoal } from '../../shared/utils/tdee.js'
import { calculateFoodMacros, calculateEquivalentGrams, formatQuantity } from '../food/food.service.js'

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

// Limites de refresh de refeição por dia
const REFRESH_LIMITS: Record<string, number> = {
  FREE: 2,    // 2 refreshes/dia
  PRO: 10,    // 10 refreshes/dia
  ADMIN: -1,  // ilimitado
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

    // 3. Calcula TDEE se o perfil tem dados suficientes
    let bmr: number | null = null
    let tdee: number | null = null
    let adjustedTdee: number | null = null
    let exerciseRoutine: ExerciseRoutineInfo[] = []

    const profile = user.profile
    if (profile?.weight && profile?.height && profile?.birthDate && profile?.gender) {
      const age = Math.floor(
        (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      )

      const routines = await this.prisma.exerciseRoutine.findMany({
        where: { profileId: profile.id },
      })

      bmr = Math.round(calculateBMR({
        weight: profile.weight,
        height: profile.height,
        age,
        gender: profile.gender,
      }))

      tdee = calculateWeeklyAvgTDEE({
        weight: profile.weight,
        height: profile.height,
        age,
        gender: profile.gender,
        routines: routines.map(r => ({
          met: r.met,
          daysPerWeek: r.daysPerWeek,
          durationMinutes: r.durationMinutes,
          intensity: r.intensity,
        })),
      })

      const goal = profile.goal || 'MAINTAIN'
      adjustedTdee = adjustForGoal(tdee, goal)

      exerciseRoutine = routines.map(r => ({
        exerciseName: r.exerciseName,
        daysPerWeek: r.daysPerWeek,
        durationMinutes: r.durationMinutes,
        intensity: r.intensity,
      }))
    }

    // 4. Monta os dados para o prompt (agora com TDEE)
    const promptInput = {
      name: user.name,
      weight: profile?.weight,
      height: profile?.height,
      goal: profile?.goal,
      activityLevel: profile?.activityLevel,
      restrictions: profile?.restrictions,
      gender: profile?.gender,
      bmr,
      tdee,
      adjustedTdee,
      exerciseRoutine,
    }

    // 5. Chama a IA para gerar a dieta
    const generated = await this.aiService.generateDiet(promptInput)

    // 6. Salva no MongoDB
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
  // TROCA DE ALIMENTOS
  // ==========================================
  // Substitui um alimento na dieta por outro da base TACO,
  // calculando a quantidade equivalente em calorias.
  async swapFood(
    dietId: string,
    userId: string,
    mealIndex: number,
    foodIndex: number,
    newFoodId: string,
  ) {
    // 1. Busca e valida a dieta
    const diet = await Diet.findById(dietId)
    if (!diet) {
      throw new NotFoundError('Dieta não encontrada')
    }
    if (diet.userId !== userId) {
      throw new AppError('Acesso negado', 403)
    }

    // 2. Valida índices
    if (mealIndex < 0 || mealIndex >= diet.meals.length) {
      throw new AppError('Refeição não encontrada', 400)
    }
    const meal = diet.meals[mealIndex]

    if (foodIndex < 0 || foodIndex >= meal.foods.length) {
      throw new AppError('Alimento não encontrado na refeição', 400)
    }
    const oldFood = meal.foods[foodIndex]

    // 3. Busca o novo alimento na base TACO
    const newFoodItem = await FoodItem.findById(newFoodId).lean()
    if (!newFoodItem) {
      throw new NotFoundError('Alimento não encontrado na base')
    }

    // 4. Calcula quantidade equivalente (mesmas calorias)
    const targetCalories = oldFood.calories
    const equivalentGrams = calculateEquivalentGrams(targetCalories, newFoodItem)

    // 5. Calcula macros para a quantidade equivalente
    const newFood = calculateFoodMacros(newFoodItem, equivalentGrams)
    newFood.quantity = formatQuantity(equivalentGrams, newFoodItem)

    // 6. Substitui o alimento
    meal.foods[foodIndex] = newFood

    // 7. Recalcula totais da refeição e da dieta
    meal.totalCalories = Math.round(
      meal.foods.reduce((sum, f) => sum + f.calories, 0),
    )
    diet.totalCalories = diet.meals.reduce((sum, m) => sum + m.totalCalories, 0)
    diet.totalProtein = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.protein, 0), 0),
    )
    diet.totalCarbs = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.carbs, 0), 0),
    )
    diet.totalFat = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.fat, 0), 0),
    )

    // 8. Salva
    await diet.save()

    return diet.toObject()
  }

  // ==========================================
  // REFRESH DE REFEIÇÃO (com IA)
  // ==========================================
  // Regenera uma refeição com ingredientes diferentes mas
  // mesmas calorias. Usa Gemini para gerar a nova refeição.
  // Controla limites por dia baseado no plano do usuário.
  async refreshMeal(
    dietId: string,
    userId: string,
    mealIndex: number,
  ): Promise<{ diet: any; refreshesRemaining: number }> {
    // 1. Busca e valida a dieta
    const diet = await Diet.findById(dietId)
    if (!diet) throw new NotFoundError('Dieta não encontrada')
    if (diet.userId !== userId) throw new AppError('Acesso negado', 403)

    // 2. Valida índice
    if (mealIndex < 0 || mealIndex >= diet.meals.length) {
      throw new AppError('Refeição não encontrada', 400)
    }

    // 3. Busca role e restrições do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })
    const role = user?.role || 'FREE'

    // 4. Verifica limite de refreshes
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const refreshLog = await RefreshLog.findOneAndUpdate(
      { userId, date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true },
    )

    const limit = REFRESH_LIMITS[role] ?? 2
    if (limit !== -1 && refreshLog.count > limit) {
      throw new AppError(
        `Limite de ${limit} atualizações/dia atingido. Faça upgrade para o plano PRO.`,
        429,
      )
    }

    // 5. Monta input para a IA
    const currentMeal = diet.meals[mealIndex]
    const mealProtein = currentMeal.foods.reduce((s, f) => s + f.protein, 0)
    const mealCarbs = currentMeal.foods.reduce((s, f) => s + f.carbs, 0)
    const mealFat = currentMeal.foods.reduce((s, f) => s + f.fat, 0)

    const refreshInput = {
      mealName: currentMeal.name,
      mealTime: currentMeal.time,
      targetCalories: currentMeal.totalCalories,
      targetProtein: Math.round(mealProtein),
      targetCarbs: Math.round(mealCarbs),
      targetFat: Math.round(mealFat),
      currentFoodNames: currentMeal.foods.map(f => f.name),
      restrictions: user?.profile?.restrictions || [],
    }

    // 6. Gera nova refeição com IA
    const newMeal = await this.aiService.generateSingleMeal(refreshInput)

    // 7. Substitui na dieta
    diet.meals[mealIndex] = {
      name: newMeal.name,
      time: newMeal.time,
      foods: newMeal.foods,
      totalCalories: newMeal.totalCalories,
    } as any

    // 8. Recalcula totais da dieta
    diet.totalCalories = diet.meals.reduce((sum, m) => sum + m.totalCalories, 0)
    diet.totalProtein = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.protein, 0), 0),
    )
    diet.totalCarbs = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.carbs, 0), 0),
    )
    diet.totalFat = Math.round(
      diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.fat, 0), 0),
    )

    // 9. Salva
    await diet.save()

    const refreshesRemaining = limit === -1 ? -1 : Math.max(0, limit - refreshLog.count)

    return { diet: diet.toObject(), refreshesRemaining }
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
