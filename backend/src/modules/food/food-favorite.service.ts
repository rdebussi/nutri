import { FoodFavorite } from './food-favorite.model.js'
import type { IFoodFavorite } from './food-favorite.model.js'
import { FoodItem } from './food.model.js'
import { UserFood } from './user-food.model.js'

// ====================================================
// FOOD FAVORITE SERVICE
// ====================================================
// Gerenciamento de alimentos favoritos do usuário.
//
// Toggle: se já é favorito, remove. Se não é, adiciona.
// List: retorna favoritos populados com dados completos do alimento.

export type PopulatedFavorite = {
  _id: string
  foodId: string
  foodSource: 'database' | 'custom'
  food: {
    _id: string
    name: string
    category: string
    caloriesPer100g: number
    proteinPer100g: number
    carbsPer100g: number
    fatPer100g: number
  } | null
}

export class FoodFavoriteService {

  /**
   * Toggle favorito: add se não existe, remove se existe.
   * Retorna { favorited: true/false } para o frontend saber o estado.
   */
  async toggle(
    userId: string,
    foodId: string,
    foodSource: 'database' | 'custom',
  ): Promise<{ favorited: boolean }> {
    const existing = await FoodFavorite.findOne({ userId, foodId })

    if (existing) {
      await FoodFavorite.findByIdAndDelete(existing._id)
      return { favorited: false }
    }

    await FoodFavorite.create({ userId, foodId, foodSource })
    return { favorited: true }
  }

  /**
   * Lista todos os favoritos do usuário, populados com dados do alimento.
   */
  async list(userId: string): Promise<PopulatedFavorite[]> {
    const favorites = await FoodFavorite.find({ userId })
      .sort({ createdAt: -1 })
      .lean()

    const populated: PopulatedFavorite[] = []

    for (const fav of favorites) {
      let food = null

      if (fav.foodSource === 'database') {
        food = await FoodItem.findById(fav.foodId)
          .select('name category caloriesPer100g proteinPer100g carbsPer100g fatPer100g')
          .lean()
      } else {
        food = await UserFood.findById(fav.foodId)
          .select('name category caloriesPer100g proteinPer100g carbsPer100g fatPer100g')
          .lean()
      }

      populated.push({
        _id: (fav as any)._id.toString(),
        foodId: fav.foodId,
        foodSource: fav.foodSource,
        food: food ? {
          _id: (food as any)._id.toString(),
          name: food.name,
          category: food.category as string,
          caloriesPer100g: food.caloriesPer100g,
          proteinPer100g: food.proteinPer100g,
          carbsPer100g: food.carbsPer100g,
          fatPer100g: food.fatPer100g,
        } : null,
      })
    }

    return populated
  }

  /**
   * Retorna Set de foodIds que o usuário favoritou.
   * Útil para marcar resultados de busca com isFavorite.
   */
  async getFavoriteIds(userId: string): Promise<Set<string>> {
    const favorites = await FoodFavorite.find({ userId })
      .select('foodId')
      .lean()

    return new Set(favorites.map(f => f.foodId))
  }
}
