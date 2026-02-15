import type { PrismaClient } from '@prisma/client'
import type { UpdateProfileInput, UpdateRoutinesInput } from './user.validator.js'
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js'
import { calculateBMR, calculateWeeklyAvgTDEE, adjustForGoal } from '../../shared/utils/tdee.js'

// ====================================================
// USER SERVICE
// ====================================================
// Gerencia o perfil do usuário e seus dados nutricionais.
// Mesma ideia do AuthService: lógica de negócio pura,
// sem saber nada de HTTP.

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    // findUnique + include → busca o usuário E o perfil numa só query.
    // Sem o include, precisaríamos de 2 queries separadas.
    // O Prisma gera um JOIN otimizado no SQL.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      throw new NotFoundError('Usuário não encontrado')
    }

    // Retorna sem a senha
    const { password, ...safeUser } = user
    return safeUser
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // "upsert" é uma operação atômica (INSERT ou UPDATE).
    // Se o perfil já existe para esse userId → UPDATE
    // Se não existe → INSERT (cria novo)
    //
    // É mais seguro que fazer findFirst + create/update separados,
    // porque evita race conditions (duas requests simultâneas
    // tentando criar o mesmo perfil).
    const profile = await this.prisma.nutritionProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return profile
  }

  // ====================================================
  // ROTINA DE EXERCÍCIOS
  // ====================================================

  private async getProfileOrThrow(userId: string) {
    const profile = await this.prisma.nutritionProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundError('Perfil nutricional não encontrado. Preencha seu perfil primeiro.')
    }
    return profile
  }

  async getRoutines(userId: string) {
    const profile = await this.getProfileOrThrow(userId)

    return this.prisma.exerciseRoutine.findMany({
      where: { profileId: profile.id },
    })
  }

  async updateRoutines(userId: string, input: UpdateRoutinesInput) {
    const profile = await this.getProfileOrThrow(userId)

    // Estratégia "replace all" dentro de uma transação:
    // 1. Deleta todas as rotinas existentes
    // 2. Cria as novas
    // Isso é mais simples que diff/merge e garante consistência.
    await this.prisma.$transaction(async (tx) => {
      await tx.exerciseRoutine.deleteMany({
        where: { profileId: profile.id },
      })

      if (input.routines.length > 0) {
        await tx.exerciseRoutine.createMany({
          data: input.routines.map((r) => ({
            profileId: profile.id,
            exerciseName: r.exerciseName,
            category: r.category,
            met: r.met,
            daysPerWeek: r.daysPerWeek,
            durationMinutes: r.durationMinutes,
            intensity: r.intensity,
          })),
        })
      }
    })

    // Retorna as rotinas recém-criadas
    return this.prisma.exerciseRoutine.findMany({
      where: { profileId: profile.id },
    })
  }

  // ====================================================
  // TDEE (Total Daily Energy Expenditure)
  // ====================================================

  async calculateTDEE(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user?.profile) {
      throw new NotFoundError('Perfil nutricional não encontrado.')
    }

    const { profile } = user

    // Precisa de peso, altura, data de nascimento e gênero para calcular
    if (!profile.weight || !profile.height || !profile.birthDate || !profile.gender) {
      throw new ValidationError('Perfil incompleto. Preencha peso, altura, data de nascimento e gênero.')
    }

    // Calcula idade a partir da data de nascimento
    const age = Math.floor(
      (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    )

    // Busca rotinas do perfil
    const routines = await this.prisma.exerciseRoutine.findMany({
      where: { profileId: profile.id },
    })

    const bmr = calculateBMR({
      weight: profile.weight,
      height: profile.height,
      age,
      gender: profile.gender,
    })

    const tdee = calculateWeeklyAvgTDEE({
      weight: profile.weight,
      height: profile.height,
      age,
      gender: profile.gender,
      routines: routines.map((r) => ({
        met: r.met,
        daysPerWeek: r.daysPerWeek,
        durationMinutes: r.durationMinutes,
        intensity: r.intensity,
      })),
    })

    const goal = profile.goal || 'MAINTAIN'
    const adjustedTdee = adjustForGoal(tdee, goal)

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedTdee: Math.round(adjustedTdee),
      goal,
      age,
      routines: routines.length,
    }
  }
}
