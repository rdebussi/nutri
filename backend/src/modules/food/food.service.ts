import type { IFoodItem } from './food.model.js'
import type { IFood } from '../diet/diet.model.js'

// ====================================================
// FOOD SERVICE
// ====================================================
// Funções puras para cálculo de macros e equivalência
// calórica. Usadas quando o usuário troca um alimento
// na sua dieta por outro da base TACO.
//
// Todas são funções puras (sem side effects, sem banco)
// → fáceis de testar e reutilizar.

/**
 * Calcula os macros de um alimento para uma quantidade específica em gramas.
 *
 * Conversão: valor por 100g × (gramas / 100)
 * Ex: Arroz (128 kcal/100g) × 200g = 256 kcal
 */
export function calculateFoodMacros(food: IFoodItem, grams: number): IFood {
  const factor = grams / 100

  return {
    name: food.name,
    quantity: `${grams}g`,
    calories: round1(food.caloriesPer100g * factor),
    protein: round1(food.proteinPer100g * factor),
    carbs: round1(food.carbsPer100g * factor),
    fat: round1(food.fatPer100g * factor),
  }
}

/**
 * Calcula quantos gramas de um alimento equivalem a X calorias.
 *
 * Fórmula: (targetCalories / caloriesPer100g) × 100
 * Arredonda para o múltiplo de 5g mais próximo (praticidade na cozinha).
 * Mínimo: 5g.
 *
 * Se o alimento tem 0 calorias/100g (ex: chá verde), retorna 100g como fallback.
 */
export function calculateEquivalentGrams(
  targetCalories: number,
  food: IFoodItem,
): number {
  if (food.caloriesPer100g === 0) return 100

  const rawGrams = (targetCalories / food.caloriesPer100g) * 100
  const rounded = Math.round(rawGrams / 5) * 5

  return Math.max(5, rounded)
}

/**
 * Formata a quantidade em gramas usando porções comuns quando possível.
 *
 * Se a quantidade está dentro de 10% de uma porção comum, usa o nome dela.
 * Ex: 160g de arroz → "1 xícara (160g)"
 * Ex: 250g de arroz → "250g" (não bate com nenhuma porção)
 */
export function formatQuantity(grams: number, food: IFoodItem): string {
  if (!food.commonPortions || food.commonPortions.length === 0) {
    return `${grams}g`
  }

  // Busca a porção mais próxima (dentro de 10% de tolerância)
  for (const portion of food.commonPortions) {
    const diff = Math.abs(grams - portion.grams) / portion.grams
    if (diff <= 0.1) {
      return `${portion.name} (${grams}g)`
    }
  }

  return `${grams}g`
}

// Arredonda para 1 casa decimal
function round1(value: number): number {
  return Math.round(value * 10) / 10
}
