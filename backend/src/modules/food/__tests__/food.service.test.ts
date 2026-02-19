import { describe, it, expect } from 'vitest'
import {
  calculateFoodMacros,
  calculateEquivalentGrams,
  formatQuantity,
} from '../food.service.js'
import type { IFoodItem } from '../food.model.js'

// ====================================================
// TESTES DO FOOD SERVICE
// ====================================================
// Funções puras para cálculo de macros e equivalência.
// Não dependem de banco — só matemática.

// Helper para criar um FoodItem fake (sem precisar de Mongoose Document)
function makeFoodItem(overrides: Partial<IFoodItem> = {}): IFoodItem {
  return {
    _id: '1',
    name: 'Arroz branco cozido',
    category: 'grains',
    caloriesPer100g: 128,
    proteinPer100g: 2.5,
    carbsPer100g: 28.1,
    fatPer100g: 0.2,
    // Micronutrientes per 100g (TACO + USDA)
    fiberPer100g: 1.6,
    omega3Per100g: 0,
    cholesterolPer100g: 0,
    vitaminAPer100g: 0,
    vitaminB1Per100g: 0.02,
    vitaminB2Per100g: 0.01,
    vitaminB3Per100g: 0.4,
    vitaminB5Per100g: 0.39,
    vitaminB6Per100g: 0.05,
    vitaminB9Per100g: 2,
    vitaminB12Per100g: 0,
    vitaminCPer100g: 0,
    vitaminDPer100g: 0,
    vitaminEPer100g: 0,
    vitaminKPer100g: 0,
    calciumPer100g: 4,
    ironPer100g: 0.1,
    magnesiumPer100g: 5,
    phosphorusPer100g: 33,
    potassiumPer100g: 32,
    sodiumPer100g: 1,
    zincPer100g: 0.5,
    copperPer100g: 0.06,
    manganesePer100g: 0.4,
    seleniumPer100g: 7.5,
    commonPortions: [
      { name: '1 xícara', grams: 160 },
      { name: '1 colher de servir', grams: 45 },
    ],
    ...overrides,
  } as IFoodItem
}

describe('FoodService — calculateFoodMacros', () => {
  it('should calculate macros for a given quantity in grams', () => {
    const food = makeFoodItem()
    const result = calculateFoodMacros(food, 200)

    // 200g de arroz (128 kcal/100g) = 256 kcal
    expect(result.name).toBe('Arroz branco cozido')
    expect(result.quantity).toBe('200g')
    expect(result.calories).toBe(256)
    expect(result.protein).toBe(5)     // 2.5 × 2 = 5
    expect(result.carbs).toBe(56.2)    // 28.1 × 2 = 56.2
    expect(result.fat).toBe(0.4)       // 0.2 × 2 = 0.4
  })

  it('should round macros to 1 decimal place', () => {
    const food = makeFoodItem({ proteinPer100g: 3.33 })
    const result = calculateFoodMacros(food, 150)

    // 3.33 × 1.5 = 4.995 → 5.0
    expect(result.protein).toBe(5)
  })

  it('should handle small quantities', () => {
    const food = makeFoodItem()
    const result = calculateFoodMacros(food, 30)

    // 30g de arroz = 38.4 kcal
    expect(result.calories).toBe(38.4)
    expect(result.quantity).toBe('30g')
  })

  it('should calculate micronutrients for a given quantity', () => {
    const food = makeFoodItem()
    const result = calculateFoodMacros(food, 200)

    // 200g de arroz: micros per 100g × 2
    expect(result.micronutrients).toBeDefined()
    expect(result.micronutrients!.fiber).toBe(3.2)       // 1.6 × 2
    expect(result.micronutrients!.calcium).toBe(8)        // 4 × 2
    expect(result.micronutrients!.iron).toBe(0.2)         // 0.1 × 2
    expect(result.micronutrients!.sodium).toBe(2)         // 1 × 2
    expect(result.micronutrients!.potassium).toBe(64)     // 32 × 2
    expect(result.micronutrients!.magnesium).toBe(10)     // 5 × 2
    expect(result.micronutrients!.vitaminA).toBe(0)
    expect(result.micronutrients!.vitaminC).toBe(0)
    // Novos nutrientes
    expect(result.micronutrients!.vitaminB1).toBe(0)      // 0.02 × 2 = 0.04 → 0
    expect(result.micronutrients!.vitaminB3).toBe(0.8)    // 0.4 × 2
    expect(result.micronutrients!.phosphorus).toBe(66)    // 33 × 2
    expect(result.micronutrients!.zinc).toBe(1)           // 0.5 × 2
    expect(result.micronutrients!.selenium).toBe(15)      // 7.5 × 2
    expect(result.micronutrients!.manganese).toBe(0.8)    // 0.4 × 2
    expect(result.micronutrients!.cholesterol).toBe(0)
    expect(result.micronutrients!.omega3).toBe(0)
  })

  it('should handle food without micro fields (defaults to 0)', () => {
    // Simula alimento antigo sem campos de micro (todos undefined)
    const food = {
      _id: '1',
      name: 'Alimento legado',
      category: 'others',
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 10,
      fatPer100g: 5,
      commonPortions: [],
    } as IFoodItem
    const result = calculateFoodMacros(food, 100)

    // Todos os 25 micros devem ser 0 (fallback via ?? 0)
    expect(result.micronutrients!.fiber).toBe(0)
    expect(result.micronutrients!.calcium).toBe(0)
    expect(result.micronutrients!.iron).toBe(0)
    expect(result.micronutrients!.sodium).toBe(0)
    expect(result.micronutrients!.vitaminD).toBe(0)
    expect(result.micronutrients!.zinc).toBe(0)
    expect(result.micronutrients!.cholesterol).toBe(0)
    expect(result.micronutrients!.omega3).toBe(0)
    expect(result.micronutrients!.selenium).toBe(0)
  })

  it('should calculate micronutrients for a food rich in micros', () => {
    const espinafre = makeFoodItem({
      name: 'Espinafre cozido',
      category: 'vegetables',
      caloriesPer100g: 22,
      proteinPer100g: 2.6,
      carbsPer100g: 3.1,
      fatPer100g: 0.2,
      fiberPer100g: 2.1,
      calciumPer100g: 136,
      ironPer100g: 1.4,
      sodiumPer100g: 52,
      potassiumPer100g: 466,
      magnesiumPer100g: 87,
      vitaminAPer100g: 524,
      vitaminCPer100g: 10,
      vitaminKPer100g: 483,
      vitaminB9Per100g: 146,
      manganesePer100g: 0.9,
    })
    const result = calculateFoodMacros(espinafre, 150)

    // 150g: factor = 1.5
    expect(result.micronutrients!.fiber).toBe(3.2)        // 2.1 × 1.5 = 3.15 → 3.2
    expect(result.micronutrients!.calcium).toBe(204)       // 136 × 1.5
    expect(result.micronutrients!.iron).toBe(2.1)          // 1.4 × 1.5
    expect(result.micronutrients!.potassium).toBe(699)     // 466 × 1.5
    expect(result.micronutrients!.magnesium).toBe(130.5)   // 87 × 1.5
    expect(result.micronutrients!.vitaminA).toBe(786)      // 524 × 1.5
    // Novos nutrientes
    expect(result.micronutrients!.vitaminK).toBe(724.5)    // 483 × 1.5
    expect(result.micronutrients!.vitaminB9).toBe(219)     // 146 × 1.5
    expect(result.micronutrients!.manganese).toBe(1.4)     // 0.9 × 1.5 = 1.35 → 1.4
  })

  it('should calculate cholesterol and omega3 for animal protein', () => {
    const ovo = makeFoodItem({
      name: 'Ovo cozido',
      category: 'proteins',
      caloriesPer100g: 155,
      proteinPer100g: 13,
      carbsPer100g: 1.1,
      fatPer100g: 11,
      cholesterolPer100g: 373,
      omega3Per100g: 0.1,
      vitaminB12Per100g: 1.1,
      vitaminDPer100g: 2.2,
      seleniumPer100g: 30,
      zincPer100g: 1.3,
    })
    const result = calculateFoodMacros(ovo, 50) // 1 ovo ≈ 50g

    // 50g: factor = 0.5
    expect(result.micronutrients!.cholesterol).toBe(186.5) // 373 × 0.5
    expect(result.micronutrients!.omega3).toBe(0.1)        // 0.1 × 0.5 = 0.05 → 0.1
    expect(result.micronutrients!.vitaminB12).toBe(0.6)    // 1.1 × 0.5 = 0.55 → 0.6
    expect(result.micronutrients!.vitaminD).toBe(1.1)      // 2.2 × 0.5
    expect(result.micronutrients!.selenium).toBe(15)       // 30 × 0.5
    expect(result.micronutrients!.zinc).toBe(0.7)          // 1.3 × 0.5 = 0.65 → 0.7
  })
})

describe('FoodService — calculateEquivalentGrams', () => {
  it('should calculate equivalent grams to match target calories', () => {
    // Quero 260 kcal de batata doce (77 kcal/100g)
    const batatadoce = makeFoodItem({ caloriesPer100g: 77 })
    const grams = calculateEquivalentGrams(260, batatadoce)

    // 260 / 77 × 100 = 337.66 → arredonda para 340g (múltiplo de 5)
    expect(grams).toBe(340)
  })

  it('should round to nearest 5g', () => {
    // 200 kcal de frango (159 kcal/100g)
    const frango = makeFoodItem({ caloriesPer100g: 159 })
    const grams = calculateEquivalentGrams(200, frango)

    // 200 / 159 × 100 = 125.78 → 125g
    expect(grams).toBe(125)
  })

  it('should return at least 5g', () => {
    // Edge case: alimento com muitas calorias, target baixo
    const azeite = makeFoodItem({ caloriesPer100g: 884 })
    const grams = calculateEquivalentGrams(10, azeite)

    // 10 / 884 × 100 = 1.13 → mínimo 5g
    expect(grams).toBe(5)
  })

  it('should handle zero calorie foods', () => {
    // Chá verde (0 kcal/100g) — não dá para calcular equivalência
    const cha = makeFoodItem({ caloriesPer100g: 0 })
    const grams = calculateEquivalentGrams(100, cha)

    // Retorna 100g como fallback razoável
    expect(grams).toBe(100)
  })
})

describe('FoodService — formatQuantity', () => {
  it('should use common portion when grams match closely', () => {
    const food = makeFoodItem() // tem "1 xícara" = 160g
    const result = formatQuantity(160, food)

    expect(result).toBe('1 xícara (160g)')
  })

  it('should use closest common portion within 10% tolerance', () => {
    const food = makeFoodItem() // tem "1 xícara" = 160g
    const result = formatQuantity(155, food)

    // 155g está a 3% de 160g (dentro de 10%) → usa a porção
    expect(result).toBe('1 xícara (155g)')
  })

  it('should fallback to plain grams when no portion matches', () => {
    const food = makeFoodItem() // tem "1 xícara" = 160g, "1 colher" = 45g
    const result = formatQuantity(250, food)

    // 250g não está próximo de nenhuma porção
    expect(result).toBe('250g')
  })

  it('should fallback to plain grams when no common portions exist', () => {
    const food = makeFoodItem({ commonPortions: [] })
    const result = formatQuantity(200, food)

    expect(result).toBe('200g')
  })
})
