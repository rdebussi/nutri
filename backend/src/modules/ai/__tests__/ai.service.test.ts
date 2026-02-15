import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiService } from '../ai.service.js'

// ====================================================
// TESTES DO AI SERVICE (Gemini)
// ====================================================
// Mockamos o SDK do Gemini inteiro — nunca chamamos a API real
// nos testes. Por quê?
// 1. Testes devem ser RÁPIDOS (API real = 2-5 segundos)
// 2. Testes devem ser DETERMINÍSTICOS (IA pode dar respostas diferentes)
// 3. Testes devem ser GRATUITOS (cada chamada à API tem custo)

const mockGenerateContent = vi.fn()

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent }
    }
  },
}))

const fakeDiet = {
  title: 'Dieta Equilíbrio',
  meals: [
    {
      name: 'Café da manhã',
      time: '07:00',
      foods: [
        { name: 'Ovos', quantity: '2 unidades', calories: 150, protein: 12, carbs: 1, fat: 10 },
        { name: 'Pão integral', quantity: '1 fatia', calories: 80, protein: 3, carbs: 14, fat: 1 },
      ],
      totalCalories: 230,
    },
  ],
  totalCalories: 230,
  totalProtein: 15,
  totalCarbs: 15,
  totalFat: 11,
  notes: 'Beba bastante água ao longo do dia.',
}

describe('AiService', () => {
  let aiService: AiService

  beforeEach(() => {
    vi.clearAllMocks()
    aiService = new AiService('fake-key')
  })

  it('should generate a diet from user input', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(fakeDiet) },
    })

    const result = await aiService.generateDiet({
      name: 'João',
      weight: 80,
      height: 180,
      goal: 'LOSE_WEIGHT',
      activityLevel: 'MODERATE',
      restrictions: ['lactose'],
    })

    expect(result.title).toBe('Dieta Equilíbrio')
    expect(result.meals).toHaveLength(1)
    expect(result.meals[0].foods[0].name).toBe('Ovos')
    expect(result.totalCalories).toBe(230)

    // Verifica que chamou o Gemini com as configs corretas
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          temperature: 0.7,
          responseMimeType: 'application/json',
        }),
      })
    )
  })

  it('should throw if Gemini returns empty response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '' },
    })

    await expect(
      aiService.generateDiet({ name: 'João' })
    ).rejects.toThrow('A IA não retornou uma resposta')
  })

  it('should throw if Gemini returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'isso não é JSON' },
    })

    await expect(
      aiService.generateDiet({ name: 'João' })
    ).rejects.toThrow('JSON malformado')
  })

  it('should normalize totals from food-level data', async () => {
    // A IA pode retornar totais incorretos — o service deve recalcular
    const dietWithBadTotals = {
      ...fakeDiet,
      totalCalories: 9999,  // Errado!
      totalProtein: 9999,
      totalCarbs: 9999,
      totalFat: 9999,
      meals: [{
        ...fakeDiet.meals[0],
        totalCalories: 9999,  // Errado!
      }],
    }

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(dietWithBadTotals) },
    })

    const result = await aiService.generateDiet({ name: 'João' })

    // Deve recalcular a partir dos foods reais: 150 + 80 = 230
    expect(result.meals[0].totalCalories).toBe(230)
    expect(result.totalCalories).toBe(230)
    expect(result.totalProtein).toBe(15)  // 12 + 3
    expect(result.totalCarbs).toBe(15)    // 1 + 14
    expect(result.totalFat).toBe(11)      // 10 + 1
  })
})
