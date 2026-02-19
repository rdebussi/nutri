import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CheckInService } from '../checkin.service.js'

// ====================================================
// TESTES DE EDIÇÃO DE REFEIÇÃO NO CHECK-IN
// ====================================================
// Testa o fluxo: usuário edita o que realmente comeu,
// sem alterar a dieta base. As outras refeições se adaptam.

// Mock do CheckIn model
const mockFindOneAndUpdate = vi.fn()
const mockCheckInFindOne = vi.fn()

vi.mock('../checkin.model.js', () => ({
  CheckIn: {
    findOneAndUpdate: (...args: any[]) => mockFindOneAndUpdate(...args),
    findOne: (...args: any[]) => mockCheckInFindOne(...args),
  },
}))

// Mock do Diet model
const mockDietFindById = vi.fn()

vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: (...args: any[]) => mockDietFindById(...args),
  },
}))

// Mock do FoodItem model
vi.mock('../../food/food.model.js', () => ({
  FoodItem: {
    findById: vi.fn(),
  },
  FOOD_CATEGORIES: [
    'grains', 'proteins', 'dairy', 'fruits', 'vegetables',
    'legumes', 'fats', 'beverages', 'sweets', 'others',
  ],
}))

const userId = 'user-123'
const dietId = 'diet-456'

const mockDiet = {
  _id: dietId,
  userId,
  meals: [
    {
      name: 'Café da manhã', time: '07:00', totalCalories: 400,
      foods: [
        { name: 'Pão integral', quantity: '100g', calories: 250, protein: 10, carbs: 40, fat: 3 },
        { name: 'Queijo branco', quantity: '30g', calories: 90, protein: 6, carbs: 1, fat: 7 },
        { name: 'Café', quantity: '200ml', calories: 60, protein: 1, carbs: 10, fat: 2 },
      ],
    },
    {
      name: 'Almoço', time: '12:00', totalCalories: 600,
      foods: [
        { name: 'Arroz', quantity: '200g', calories: 256, protein: 5, carbs: 56, fat: 0.4 },
        { name: 'Frango', quantity: '150g', calories: 239, protein: 48, carbs: 0, fat: 3.8 },
        { name: 'Salada', quantity: '100g', calories: 105, protein: 2, carbs: 12, fat: 5 },
      ],
    },
    {
      name: 'Jantar', time: '19:00', totalCalories: 500,
      foods: [
        { name: 'Salmão', quantity: '200g', calories: 400, protein: 40, carbs: 0, fat: 26 },
        { name: 'Batata doce', quantity: '150g', calories: 100, protein: 1, carbs: 24, fat: 0.1 },
      ],
    },
  ],
  totalCalories: 1500,
  totalProtein: 113,
  totalCarbs: 143,
  totalFat: 47.3,
}

// Mock check-in returned after upsert
function makeCheckInResult(overrides: any = {}) {
  return {
    _id: 'checkin-1',
    userId,
    dietId,
    date: new Date('2026-02-18'),
    meals: mockDiet.meals.map(m => ({ mealName: m.name, status: 'pending' })),
    exercises: [],
    foodOverrides: [],
    mealOverrides: [],
    adherenceRate: 0,
    totalCaloriesBurned: 0,
    ...overrides,
  }
}

describe('CheckInService — editMealInCheckIn', () => {
  let service: CheckInService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CheckInService()
  })

  it('should save a meal override with edited foods', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
    mockCheckInFindOne.mockResolvedValue(null)

    const editedFoods = [
      { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
      { name: 'Café com leite', quantity: '300ml', calories: 120, protein: 4, carbs: 15, fat: 5 },
    ]

    const checkInResult = makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0,
        originalFoods: mockDiet.meals[0].foods,
        editedFoods,
        totalCalories: 470,
        totalProtein: 9,
        totalCarbs: 60,
        totalFat: 23,
      }],
    })
    mockFindOneAndUpdate.mockResolvedValue(checkInResult)

    const result = await service.editMealInCheckIn(
      userId, dietId, 0, editedFoods, '2026-02-18',
    )

    expect(result.checkIn.mealOverrides).toHaveLength(1)
    expect(result.checkIn.mealOverrides[0].mealIndex).toBe(0)
    expect(result.checkIn.mealOverrides[0].editedFoods).toEqual(editedFoods)
    expect(result.adaptedMeals).toBeDefined()
    expect(result.summary).toBeDefined()
  })

  it('should preserve original foods as snapshot', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
    mockCheckInFindOne.mockResolvedValue(null)

    const editedFoods = [
      { name: 'Sonho', quantity: '1', calories: 300, protein: 4, carbs: 40, fat: 15 },
    ]

    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0,
        originalFoods: mockDiet.meals[0].foods,
        editedFoods,
        totalCalories: 300, totalProtein: 4, totalCarbs: 40, totalFat: 15,
      }],
    }))

    await service.editMealInCheckIn(userId, dietId, 0, editedFoods)

    // Verifica que o $set enviado contém originalFoods
    const setArg = mockFindOneAndUpdate.mock.calls[0][1].$set
    expect(setArg.mealOverrides[0].originalFoods).toHaveLength(3)
    expect(setArg.mealOverrides[0].originalFoods[0].name).toBe('Pão integral')
  })

  it('should replace previous override for the same mealIndex', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })

    // Já existe um override no meal 0
    mockCheckInFindOne.mockResolvedValue({
      mealOverrides: [{
        mealIndex: 0,
        originalFoods: [],
        editedFoods: [{ name: 'Old food', quantity: '1', calories: 100, protein: 1, carbs: 1, fat: 1 }],
        totalCalories: 100, totalProtein: 1, totalCarbs: 1, totalFat: 1,
      }],
      foodOverrides: [],
    })

    const newFoods = [
      { name: 'New food', quantity: '1', calories: 200, protein: 2, carbs: 2, fat: 2 },
    ]

    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0, originalFoods: mockDiet.meals[0].foods, editedFoods: newFoods,
        totalCalories: 200, totalProtein: 2, totalCarbs: 2, totalFat: 2,
      }],
    }))

    await service.editMealInCheckIn(userId, dietId, 0, newFoods)

    const setArg = mockFindOneAndUpdate.mock.calls[0][1].$set
    // Apenas 1 override (o antigo foi substituído)
    expect(setArg.mealOverrides).toHaveLength(1)
    expect(setArg.mealOverrides[0].editedFoods[0].name).toBe('New food')
  })

  it('should remove foodOverrides for the same mealIndex', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })

    // Existe food override no meal 0
    mockCheckInFindOne.mockResolvedValue({
      mealOverrides: [],
      foodOverrides: [
        { mealIndex: 0, foodIndex: 1, originalFood: {}, newFood: {} },
        { mealIndex: 1, foodIndex: 0, originalFood: {}, newFood: {} },
      ],
    })

    const editedFoods = [
      { name: 'Sonho', quantity: '1', calories: 300, protein: 4, carbs: 40, fat: 15 },
    ]

    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0, originalFoods: mockDiet.meals[0].foods, editedFoods,
        totalCalories: 300, totalProtein: 4, totalCarbs: 40, totalFat: 15,
      }],
      foodOverrides: [
        { mealIndex: 1, foodIndex: 0, originalFood: {}, newFood: {} },
      ],
    }))

    await service.editMealInCheckIn(userId, dietId, 0, editedFoods)

    const setArg = mockFindOneAndUpdate.mock.calls[0][1].$set
    // foodOverride do meal 0 foi removido, meal 1 permanece
    expect(setArg.foodOverrides).toHaveLength(1)
    expect(setArg.foodOverrides[0].mealIndex).toBe(1)
  })

  it('should adapt pending meals after editing', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
    mockCheckInFindOne.mockResolvedValue(null)

    // Café da manhã editado: 600 cal em vez de 400
    const editedFoods = [
      { name: 'Sonho gigante', quantity: '2 unidades', calories: 600, protein: 8, carbs: 70, fat: 30 },
    ]

    // O check-in retornado tem meal status = completed para café, pending pro resto
    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      meals: [
        { mealName: 'Café da manhã', status: 'completed' },
        { mealName: 'Almoço', status: 'pending' },
        { mealName: 'Jantar', status: 'pending' },
      ],
      mealOverrides: [{
        mealIndex: 0, originalFoods: mockDiet.meals[0].foods, editedFoods,
        totalCalories: 600, totalProtein: 8, totalCarbs: 70, totalFat: 30,
      }],
    }))

    const result = await service.editMealInCheckIn(userId, dietId, 0, editedFoods)

    // Adapted meals devem existir
    expect(result.adaptedMeals).toBeDefined()
    expect(result.summary).toBeDefined()
  })

  it('should NOT modify the base diet', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
    mockCheckInFindOne.mockResolvedValue(null)

    const editedFoods = [
      { name: 'Sonho', quantity: '1', calories: 300, protein: 4, carbs: 40, fat: 15 },
    ]

    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0, originalFoods: mockDiet.meals[0].foods, editedFoods,
        totalCalories: 300, totalProtein: 4, totalCarbs: 40, totalFat: 15,
      }],
    }))

    await service.editMealInCheckIn(userId, dietId, 0, editedFoods)

    // Diet.findByIdAndUpdate NÃO foi chamado — dieta intocada
    // O mock mockDietFindById foi chamado somente com .lean() (read only)
    expect(mockDiet.meals[0].foods[0].name).toBe('Pão integral')
  })

  it('should throw NotFoundError when diet does not exist', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    await expect(service.editMealInCheckIn(userId, 'nonexistent', 0, []))
      .rejects.toThrow('Dieta não encontrada')
  })

  it('should throw 403 when diet belongs to another user', async () => {
    mockDietFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ ...mockDiet, userId: 'other-user' }),
    })

    await expect(service.editMealInCheckIn(userId, dietId, 0, []))
      .rejects.toThrow('Acesso negado')
  })

  it('should throw 400 for invalid mealIndex', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })

    await expect(service.editMealInCheckIn(userId, dietId, 99, []))
      .rejects.toThrow('Refeição não encontrada')
  })

  it('should calculate correct totals from edited foods', async () => {
    mockDietFindById.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
    mockCheckInFindOne.mockResolvedValue(null)

    const editedFoods = [
      { name: 'A', quantity: '100g', calories: 150, protein: 10, carbs: 15, fat: 5 },
      { name: 'B', quantity: '50g', calories: 100, protein: 5, carbs: 10, fat: 3 },
    ]

    mockFindOneAndUpdate.mockResolvedValue(makeCheckInResult({
      mealOverrides: [{
        mealIndex: 0, originalFoods: mockDiet.meals[0].foods, editedFoods,
        totalCalories: 250, totalProtein: 15, totalCarbs: 25, totalFat: 8,
      }],
    }))

    await service.editMealInCheckIn(userId, dietId, 0, editedFoods)

    const setArg = mockFindOneAndUpdate.mock.calls[0][1].$set
    const override = setArg.mealOverrides[0]
    expect(override.totalCalories).toBe(250) // 150 + 100
    expect(override.totalProtein).toBe(15)   // 10 + 5
    expect(override.totalCarbs).toBe(25)     // 15 + 10
    expect(override.totalFat).toBe(8)        // 5 + 3
  })
})
