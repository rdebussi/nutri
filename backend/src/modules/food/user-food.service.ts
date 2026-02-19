import { UserFood } from './user-food.model.js'
import type { IUserFood } from './user-food.model.js'
import { AppError, NotFoundError } from '../../shared/utils/errors.js'
import type { CreateUserFoodInput } from './user-food.validator.js'

// ====================================================
// USER FOOD SERVICE
// ====================================================
// CRUD de alimentos customizados do usuário.
//
// Conversão por porção → per-100g:
//   Se o input inclui caloriesPerServing + servingSize,
//   converte: per100g = (perServing / servingSize) * 100
//
// Isso permite que o usuário informe "1 panqueca de 80g = 200 kcal"
// e o sistema calcule automaticamente: 250 kcal/100g.

export class UserFoodService {

  async create(userId: string, data: CreateUserFoodInput): Promise<IUserFood> {
    const normalized = this.normalizeMacros(data)

    const userFood = await UserFood.create({
      userId,
      ...normalized,
    })

    return userFood
  }

  async list(
    userId: string,
    search?: string,
    category?: string,
  ): Promise<IUserFood[]> {
    const filter: Record<string, unknown> = { userId }

    if (category) {
      filter.category = category
    }

    if (search) {
      filter.name = new RegExp(search, 'i')
    }

    return UserFood.find(filter)
      .sort({ name: 1 })
      .lean() as unknown as IUserFood[]
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateUserFoodInput>,
  ): Promise<IUserFood> {
    const existing = await UserFood.findById(id)
    if (!existing) throw new NotFoundError('Alimento não encontrado')
    if (existing.userId !== userId) throw new AppError('Acesso negado', 403)

    const normalized = this.normalizeMacros(data)

    const updated = await UserFood.findByIdAndUpdate(
      id,
      { $set: normalized },
      { new: true, runValidators: true },
    )

    return updated!
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await UserFood.findById(id)
    if (!existing) throw new NotFoundError('Alimento não encontrado')
    if (existing.userId !== userId) throw new AppError('Acesso negado', 403)

    await UserFood.findByIdAndDelete(id)
  }

  async getById(id: string): Promise<IUserFood | null> {
    return UserFood.findById(id).lean() as unknown as IUserFood | null
  }

  /**
   * Converte macros por porção para per-100g se necessário.
   * Se já vier per-100g, retorna como está.
   */
  private normalizeMacros(data: Partial<CreateUserFoodInput>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    if (data.name !== undefined) result.name = data.name
    if (data.category !== undefined) result.category = data.category
    if (data.ingredients !== undefined) result.ingredients = data.ingredients

    // Input por porção: converter para per-100g
    if (data.caloriesPerServing !== undefined && data.servingSize) {
      const factor = 100 / data.servingSize
      result.caloriesPer100g = round1(data.caloriesPerServing * factor)
      result.proteinPer100g = round1((data.proteinPerServing || 0) * factor)
      result.carbsPer100g = round1((data.carbsPerServing || 0) * factor)
      result.fatPer100g = round1((data.fatPerServing || 0) * factor)
      result.servingSize = data.servingSize
      result.servingName = data.servingName
    }
    // Input direto por 100g
    else {
      if (data.caloriesPer100g !== undefined) result.caloriesPer100g = data.caloriesPer100g
      if (data.proteinPer100g !== undefined) result.proteinPer100g = data.proteinPer100g
      if (data.carbsPer100g !== undefined) result.carbsPer100g = data.carbsPer100g
      if (data.fatPer100g !== undefined) result.fatPer100g = data.fatPer100g
      if (data.servingSize !== undefined) result.servingSize = data.servingSize
      if (data.servingName !== undefined) result.servingName = data.servingName
    }

    return result
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
