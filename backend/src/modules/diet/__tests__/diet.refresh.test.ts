import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DietService } from '../diet.service.js'

// ====================================================
// TESTES: Meal Refresh (Regenerar refeição com IA)
// ====================================================
// Verifica:
// 1. Meal é substituída na dieta base
// 2. Limites de refresh por plano (FREE=2, PRO=10, ADMIN=ilimitado)
// 3. Totais da dieta são recalculados
// 4. Validações de índice e ownership

// Mocks
const mockPrisma = {
  user: { findUnique: vi.fn() },
} as any

const mockAiService = {
  generateDiet: vi.fn(),
  generateSingleMeal: vi.fn(),
} as any

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

const mockRefreshLogFindOneAndUpdate = vi.fn()

vi.mock('../refresh-log.model.js', () => ({
  RefreshLog: {
    findOneAndUpdate: (...args: any[]) => mockRefreshLogFindOneAndUpdate(...args),
  },
}))

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
    save: mockDietSave,
    toObject() {
      const { save, toObject, ...rest } = this
      return rest
    },
  }
}

const mockNewMeal = {
  name: 'Café da manhã',
  time: '07:00',
  foods: [
    { name: 'Quinoa cozida', quantity: '150g', calories: 200, protein: 8, carbs: 35, fat: 3 },
    { name: 'Peito de peru', quantity: '100g', calories: 120, protein: 25, carbs: 0, fat: 2 },
    { name: 'Tomate cereja', quantity: '80g', calories: 82, protein: 1, carbs: 18, fat: 0.5 },
  ],
  totalCalories: 402,
}

describe('DietService — refreshMeal', () => {
  let dietService: DietService

  beforeEach(() => {
    vi.clearAllMocks()
    dietService = new DietService(mockPrisma, mockAiService)
    mockDietSave.mockResolvedValue(undefined)
    mockAiService.generateSingleMeal.mockResolvedValue(mockNewMeal)
    // Refresh count = 0 (first refresh of the day)
    mockRefreshLogFindOneAndUpdate.mockResolvedValue({ count: 1 })
  })

  it('should replace meal with AI-generated meal', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })

    const result = await dietService.refreshMeal('diet-1', 'user-1', 0)

    expect(result.diet.meals[0].foods[0].name).toBe('Quinoa cozida')
    expect(mockAiService.generateSingleMeal).toHaveBeenCalled()
    expect(mockDietSave).toHaveBeenCalled()
  })

  it('should pass current food names to avoid in AI prompt', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: ['glúten'] },
    })

    await dietService.refreshMeal('diet-1', 'user-1', 0)

    const callArgs = mockAiService.generateSingleMeal.mock.calls[0][0]
    expect(callArgs.currentFoodNames).toContain('Arroz branco')
    expect(callArgs.currentFoodNames).toContain('Ovo cozido')
    expect(callArgs.restrictions).toContain('glúten')
  })

  it('should recalculate diet totals after refresh', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })

    const result = await dietService.refreshMeal('diet-1', 'user-1', 0)

    const expectedTotal = result.diet.meals.reduce((s: number, m: any) => s + m.totalCalories, 0)
    expect(result.diet.totalCalories).toBe(expectedTotal)
  })

  it('should return refreshesRemaining', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })
    mockRefreshLogFindOneAndUpdate.mockResolvedValue({ count: 1 })

    const result = await dietService.refreshMeal('diet-1', 'user-1', 0)

    expect(result.refreshesRemaining).toBe(1) // FREE = 2 total, used 1
  })

  it('should throw 429 when FREE user exceeds 2 refreshes', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })
    // Após $inc, count = 3 → excede limite de 2 para FREE
    mockRefreshLogFindOneAndUpdate.mockResolvedValue({ count: 3 })

    await expect(
      dietService.refreshMeal('diet-1', 'user-1', 0),
    ).rejects.toThrow(/limite/i)
  })

  it('should allow PRO user up to 10 refreshes', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'PRO',
      profile: { restrictions: [] },
    })
    mockRefreshLogFindOneAndUpdate.mockResolvedValue({ count: 9 })

    const result = await dietService.refreshMeal('diet-1', 'user-1', 0)
    expect(result.refreshesRemaining).toBe(1) // PRO = 10 total, used 9
  })

  it('should throw 400 for invalid meal index', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })

    await expect(
      dietService.refreshMeal('diet-1', 'user-1', 99),
    ).rejects.toThrow('Refeição não encontrada')
  })

  it('should throw 404 if diet not found', async () => {
    mockDietFindById.mockResolvedValue(null)

    await expect(
      dietService.refreshMeal('nonexistent', 'user-1', 0),
    ).rejects.toThrow('Dieta não encontrada')
  })

  it('should throw 403 if diet belongs to another user', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)

    await expect(
      dietService.refreshMeal('diet-1', 'other-user', 0),
    ).rejects.toThrow('Acesso negado')
  })

  it('should keep other meals unchanged after refresh', async () => {
    const diet = makeFakeDiet()
    mockDietFindById.mockResolvedValue(diet)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'FREE',
      profile: { restrictions: [] },
    })

    const result = await dietService.refreshMeal('diet-1', 'user-1', 0)

    // Almoço permanece igual
    expect(result.diet.meals[1].foods[0].name).toBe('Frango grelhado')
    expect(result.diet.meals[1].totalCalories).toBe(248)
  })
})
