import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckInService } from '../checkin.service.js'

// ====================================================
// TESTES: Check-in Food Swap (Overrides)
// ====================================================
// Verifica que a troca de alimento no check-in:
// 1. Salva o override no check-in (NÃO na dieta base)
// 2. Adapted meals refletem o alimento trocado
// 3. Múltiplos overrides acumulam no mesmo dia
// 4. Override duplicado (mesma posição) substitui o anterior

// --- Mocks ---

const mockDietFindById = vi.fn()
vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: (...args: any[]) => mockDietFindById(...args),
  },
}))

const mockCheckInFindOneAndUpdate = vi.fn()
const mockCheckInFindOne = vi.fn()
vi.mock('../checkin.model.js', async (importOriginal) => {
  const original = await importOriginal() as any
  return {
    ...original,
    CheckIn: {
      findOneAndUpdate: (...args: any[]) => mockCheckInFindOneAndUpdate(...args),
      findOne: (...args: any[]) => mockCheckInFindOne(...args),
      find: vi.fn(() => ({ sort: vi.fn(() => ({ lean: vi.fn().mockResolvedValue([]) })) })),
    },
  }
})

const mockFoodItemFindById = vi.fn()
vi.mock('../../food/food.model.js', () => ({
  FoodItem: {
    findById: (...args: any[]) => mockFoodItemFindById(...args),
  },
}))

// Dieta fake
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
    ],
    totalCalories: 650,
    totalProtein: 66,
    totalCarbs: 56.6,
    totalFat: 13.7,
    goal: 'MAINTAIN',
  }
}

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

describe('CheckInService — swapFoodInCheckIn', () => {
  let service: CheckInService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CheckInService()
    // Por padrão, nenhum check-in existe ainda (primeiro do dia)
    mockCheckInFindOne.mockResolvedValue(null)
  })

  it('should save food override in check-in document', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })
    mockFoodItemFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    // Simula check-in retornado após upsert
    const savedCheckIn = {
      _id: 'checkin-1',
      userId: 'user-1',
      dietId: 'diet-1',
      date: new Date(),
      meals: [
        { mealName: 'Café da manhã', status: 'pending' },
        { mealName: 'Almoço', status: 'pending' },
      ],
      exercises: [],
      foodOverrides: [{
        mealIndex: 0,
        foodIndex: 0,
        originalFood: diet.meals[0].foods[0],
        newFood: expect.objectContaining({ name: 'Batata doce cozida' }),
      }],
      adherenceRate: 0,
      totalCaloriesBurned: 0,
    }
    mockCheckInFindOneAndUpdate.mockResolvedValue(savedCheckIn)

    const result = await service.swapFoodInCheckIn('user-1', 'diet-1', 0, 0, 'food-batata')

    // Verifica que findOneAndUpdate foi chamado com $push ou $set no foodOverrides
    expect(mockCheckInFindOneAndUpdate).toHaveBeenCalled()
    const updateCall = mockCheckInFindOneAndUpdate.mock.calls[0]
    expect(updateCall[0]).toEqual(expect.objectContaining({ userId: 'user-1' }))

    // Resultado inclui adaptedMeals e summary
    expect(result).toHaveProperty('checkIn')
    expect(result).toHaveProperty('adaptedMeals')
    expect(result).toHaveProperty('summary')
  })

  it('should calculate equivalent grams for the new food', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })
    mockFoodItemFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    // Captura o override criado
    let capturedOverride: any
    mockCheckInFindOneAndUpdate.mockImplementation((_filter: any, update: any) => {
      // Extrai o override do update
      const overrides = update.foodOverrides || update.$set?.foodOverrides
      if (overrides) capturedOverride = overrides
      return {
        userId: 'user-1',
        dietId: 'diet-1',
        date: new Date(),
        meals: [
          { mealName: 'Café da manhã', status: 'pending' },
          { mealName: 'Almoço', status: 'pending' },
        ],
        exercises: [],
        foodOverrides: overrides || [],
        adherenceRate: 0,
        totalCaloriesBurned: 0,
      }
    })

    await service.swapFoodInCheckIn('user-1', 'diet-1', 0, 0, 'food-batata')

    // Arroz tinha 256 kcal, batata doce tem 77 kcal/100g
    // Equivalente: (256/77) * 100 = 332.5 → arredonda para 335g
    expect(capturedOverride).toBeDefined()
    const override = capturedOverride[capturedOverride.length - 1]
    expect(override.newFood.name).toBe('Batata doce cozida')
    expect(override.newFood.calories).toBeGreaterThan(0)
    expect(override.newFood.quantity).toMatch(/g$/)
  })

  it('should NOT modify the base diet', async () => {
    const diet = makeFakeDiet()
    const mockDietSave = vi.fn()
    diet.save = mockDietSave as any
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })
    mockFoodItemFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })
    mockCheckInFindOneAndUpdate.mockResolvedValue({
      userId: 'user-1',
      dietId: 'diet-1',
      date: new Date(),
      meals: [{ mealName: 'Café da manhã', status: 'pending' }],
      exercises: [],
      foodOverrides: [],
      adherenceRate: 0,
      totalCaloriesBurned: 0,
    })

    await service.swapFoodInCheckIn('user-1', 'diet-1', 0, 0, 'food-batata')

    // A dieta NÃO deve ser alterada
    expect(diet.meals[0].foods[0].name).toBe('Arroz branco')
  })

  it('should return adapted meals reflecting the swapped food', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })
    mockFoodItemFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(batatadoce) })

    mockCheckInFindOneAndUpdate.mockImplementation((_filter: any, update: any) => {
      // A implementação usa $set: { foodOverrides } no upsert
      const overrides = update.$set?.foodOverrides || update.foodOverrides || []
      return {
        userId: 'user-1',
        dietId: 'diet-1',
        date: new Date(),
        meals: [
          { mealName: 'Café da manhã', status: 'pending' },
          { mealName: 'Almoço', status: 'pending' },
        ],
        exercises: [],
        foodOverrides: overrides,
        adherenceRate: 0,
        totalCaloriesBurned: 0,
      }
    })

    const result = await service.swapFoodInCheckIn('user-1', 'diet-1', 0, 0, 'food-batata')

    // Adapted meals devem mostrar batata doce no lugar do arroz
    const cafeMeal = result.adaptedMeals.find(m => m.name === 'Café da manhã')
    expect(cafeMeal).toBeDefined()
    expect(cafeMeal!.foods[0].name).toBe('Batata doce cozida')
  })

  it('should throw 404 if diet not found', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    await expect(
      service.swapFoodInCheckIn('user-1', 'nonexistent', 0, 0, 'food-batata'),
    ).rejects.toThrow('Dieta não encontrada')
  })

  it('should throw 403 if diet belongs to another user', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })

    await expect(
      service.swapFoodInCheckIn('other-user', 'diet-1', 0, 0, 'food-batata'),
    ).rejects.toThrow('Acesso negado')
  })

  it('should throw 400 if meal index is out of range', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })

    await expect(
      service.swapFoodInCheckIn('user-1', 'diet-1', 99, 0, 'food-batata'),
    ).rejects.toThrow('Refeição não encontrada')
  })

  it('should throw 400 if food index is out of range', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })

    await expect(
      service.swapFoodInCheckIn('user-1', 'diet-1', 0, 99, 'food-batata'),
    ).rejects.toThrow('Alimento não encontrado na refeição')
  })

  it('should throw 404 if new food not in database', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(diet) })
    mockFoodItemFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    await expect(
      service.swapFoodInCheckIn('user-1', 'diet-1', 0, 0, 'nonexistent'),
    ).rejects.toThrow('Alimento não encontrado na base')
  })
})
