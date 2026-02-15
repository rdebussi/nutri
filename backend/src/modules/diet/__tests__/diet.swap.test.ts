import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DietService } from '../diet.service.js'

// ====================================================
// TESTES DE SWAP DE ALIMENTOS
// ====================================================
// Verifica que a troca de alimento na dieta:
// 1. Calcula quantidade equivalente em calorias
// 2. Recalcula macros da refeição e totais da dieta
// 3. Valida ownership e índices

// Mock do Prisma (DietService precisa dele no constructor)
const mockPrisma = {
  user: { findUnique: vi.fn() },
} as any

const mockAiService = {
  generateDiet: vi.fn(),
} as any

// Mock do Diet model (Mongoose)
const mockDietSave = vi.fn()
const mockDietFindById = vi.fn()

vi.mock('../diet.model.js', () => ({
  Diet: {
    create: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ({ lean: vi.fn() })) })),
    findById: (...args: any[]) => mockDietFindById(...args),
    countDocuments: vi.fn(),
  },
}))

// Mock do FoodItem model (MongoDB)
const mockFoodFindById = vi.fn()

vi.mock('../../food/food.model.js', () => ({
  FoodItem: {
    findById: (...args: any[]) => mockFoodFindById(...args),
  },
}))

// Dieta fake com 2 refeições
function makeFakeDiet() {
  return {
    _id: 'diet-1',
    userId: 'user-1',
    title: 'Dieta Teste',
    meals: [
      {
        name: 'Café da manhã',
        time: '07:00',
        foods: [
          { name: 'Arroz branco cozido', quantity: '200g', calories: 256, protein: 5, carbs: 56.2, fat: 0.4 },
          { name: 'Ovo cozido', quantity: '2 unidades', calories: 146, protein: 13.3, carbs: 0.6, fat: 9.5 },
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
    ],
    totalCalories: 650,
    totalProtein: 66.3,
    totalCarbs: 56.8,
    totalFat: 13.7,
    goal: 'MAINTAIN',
    save: mockDietSave,
    toObject: function () {
      const { save, toObject, ...rest } = this
      return rest
    },
  }
}

// FoodItem da base TACO
const batatadoce = {
  _id: 'food-batata',
  name: 'Batata doce cozida',
  category: 'grains',
  caloriesPer100g: 77,
  proteinPer100g: 0.6,
  carbsPer100g: 18.4,
  fatPer100g: 0.1,
  commonPortions: [{ name: '1 unidade média', grams: 150 }],
}

describe('DietService — swapFood', () => {
  let dietService: DietService

  beforeEach(() => {
    vi.clearAllMocks()
    dietService = new DietService(mockPrisma, mockAiService)
    mockDietSave.mockResolvedValue(undefined)
  })

  it('should swap food and calculate equivalent grams', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockFoodFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    const result = await dietService.swapFood('diet-1', 'user-1', 0, 0, 'food-batata')

    // Arroz tinha 256 kcal → batata doce 77 kcal/100g
    // Equivalente: (256/77) × 100 = 332.5 → arredonda para 335g
    const swappedFood = result.meals[0].foods[0]
    expect(swappedFood.name).toBe('Batata doce cozida')
    expect(swappedFood.calories).toBeGreaterThan(0)

    // Totais devem ser recalculados
    expect(result.meals[0].totalCalories).toBe(
      Math.round(result.meals[0].foods.reduce((s: number, f: any) => s + f.calories, 0)),
    )
    expect(mockDietSave).toHaveBeenCalled()
  })

  it('should recalculate diet totals after swap', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockFoodFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    const result = await dietService.swapFood('diet-1', 'user-1', 0, 0, 'food-batata')

    // totalCalories da dieta = soma de todas as meals
    const expectedTotal = result.meals.reduce((s: number, m: any) => s + m.totalCalories, 0)
    expect(result.totalCalories).toBe(expectedTotal)
  })

  it('should throw 404 if diet not found', async () => {
    mockDietFindById.mockResolvedValue(null)

    await expect(
      dietService.swapFood('nonexistent', 'user-1', 0, 0, 'food-batata'),
    ).rejects.toThrow('Dieta não encontrada')
  })

  it('should throw 403 if diet belongs to another user', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)

    await expect(
      dietService.swapFood('diet-1', 'other-user', 0, 0, 'food-batata'),
    ).rejects.toThrow('Acesso negado')
  })

  it('should throw 400 if meal index is out of range', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)

    await expect(
      dietService.swapFood('diet-1', 'user-1', 99, 0, 'food-batata'),
    ).rejects.toThrow('Refeição não encontrada')
  })

  it('should throw 400 if food index is out of range', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)

    await expect(
      dietService.swapFood('diet-1', 'user-1', 0, 99, 'food-batata'),
    ).rejects.toThrow('Alimento não encontrado na refeição')
  })

  it('should throw 404 if new food not in database', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockFoodFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    await expect(
      dietService.swapFood('diet-1', 'user-1', 0, 0, 'nonexistent'),
    ).rejects.toThrow('Alimento não encontrado na base')
  })

  it('should keep other foods unchanged after swap', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockFoodFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    const result = await dietService.swapFood('diet-1', 'user-1', 0, 0, 'food-batata')

    // O ovo (index 1) deve permanecer igual
    expect(result.meals[0].foods[1].name).toBe('Ovo cozido')
    expect(result.meals[0].foods[1].calories).toBe(146)

    // O almoço (meal index 1) deve permanecer igual
    expect(result.meals[1].foods[0].name).toBe('Frango grelhado')
    expect(result.meals[1].totalCalories).toBe(248)
  })
})
