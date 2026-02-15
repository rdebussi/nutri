import { describe, it, expect } from 'vitest'
import { applyFoodOverrides } from '../food-overrides.js'
import type { IMeal, IFood } from '../../../modules/diet/diet.model.js'

// ====================================================
// TESTES: applyFoodOverrides
// ====================================================
// Função pura que aplica food overrides (do check-in)
// nas meals da dieta original, retornando meals "efetivas"
// sem mutar o original.

function makeMeals(): IMeal[] {
  return [
    {
      name: 'Café da manhã',
      time: '07:00',
      foods: [
        { name: 'Arroz branco', quantity: '200g', calories: 256, protein: 5, carbs: 56, fat: 0.4 },
        { name: 'Ovo cozido', quantity: '100g', calories: 146, protein: 13, carbs: 0.6, fat: 9.5 },
      ],
      totalCalories: 402,
    },
    {
      name: 'Almoço',
      time: '12:00',
      foods: [
        { name: 'Frango grelhado', quantity: '150g', calories: 248, protein: 48, carbs: 0, fat: 3.8 },
      ],
      totalCalories: 248,
    },
  ]
}

const batatadoce: IFood = {
  name: 'Batata doce',
  quantity: '335g',
  calories: 258,
  protein: 2,
  carbs: 61.6,
  fat: 0.3,
}

const salada: IFood = {
  name: 'Salada verde',
  quantity: '200g',
  calories: 30,
  protein: 2,
  carbs: 5,
  fat: 0.5,
}

describe('applyFoodOverrides', () => {
  it('should return unmodified meals when no overrides', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [])

    expect(result).toEqual(meals)
  })

  it('should NOT mutate the original meals array', () => {
    const meals = makeMeals()
    const originalName = meals[0].foods[0].name

    applyFoodOverrides(meals, [{
      mealIndex: 0,
      foodIndex: 0,
      originalFood: meals[0].foods[0],
      newFood: batatadoce,
    }])

    // Original não foi alterado
    expect(meals[0].foods[0].name).toBe(originalName)
  })

  it('should replace a food at the correct position', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [{
      mealIndex: 0,
      foodIndex: 0,
      originalFood: meals[0].foods[0],
      newFood: batatadoce,
    }])

    expect(result[0].foods[0].name).toBe('Batata doce')
    expect(result[0].foods[0].calories).toBe(258)
    // Other food unchanged
    expect(result[0].foods[1].name).toBe('Ovo cozido')
  })

  it('should recalculate meal totalCalories after override', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [{
      mealIndex: 0,
      foodIndex: 0,
      originalFood: meals[0].foods[0],
      newFood: batatadoce,
    }])

    const expected = batatadoce.calories + meals[0].foods[1].calories
    expect(result[0].totalCalories).toBe(expected)
  })

  it('should handle multiple overrides in same meal', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [
      { mealIndex: 0, foodIndex: 0, originalFood: meals[0].foods[0], newFood: batatadoce },
      { mealIndex: 0, foodIndex: 1, originalFood: meals[0].foods[1], newFood: salada },
    ])

    expect(result[0].foods[0].name).toBe('Batata doce')
    expect(result[0].foods[1].name).toBe('Salada verde')
    expect(result[0].totalCalories).toBe(batatadoce.calories + salada.calories)
  })

  it('should handle overrides across different meals', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [
      { mealIndex: 0, foodIndex: 0, originalFood: meals[0].foods[0], newFood: batatadoce },
      { mealIndex: 1, foodIndex: 0, originalFood: meals[1].foods[0], newFood: salada },
    ])

    expect(result[0].foods[0].name).toBe('Batata doce')
    expect(result[1].foods[0].name).toBe('Salada verde')
    expect(result[1].totalCalories).toBe(salada.calories)
  })

  it('should skip overrides with out-of-range indices', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [
      { mealIndex: 99, foodIndex: 0, originalFood: meals[0].foods[0], newFood: batatadoce },
    ])

    // Nenhuma alteração
    expect(result[0].foods[0].name).toBe('Arroz branco')
  })

  it('should use last override when same position is overridden twice', () => {
    const meals = makeMeals()
    const result = applyFoodOverrides(meals, [
      { mealIndex: 0, foodIndex: 0, originalFood: meals[0].foods[0], newFood: batatadoce },
      { mealIndex: 0, foodIndex: 0, originalFood: meals[0].foods[0], newFood: salada },
    ])

    // Último override ganha
    expect(result[0].foods[0].name).toBe('Salada verde')
  })
})
