import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiService } from '../ai.service.js'

// ====================================================
// TESTES DO AI SERVICE
// ====================================================
// Mockamos a OpenAI inteira — nunca chamamos a API real
// nos testes. Por quê?
// 1. Testes devem ser RÁPIDOS (API real = 2-5 segundos)
// 2. Testes devem ser DETERMINÍSTICOS (IA pode dar respostas diferentes)
// 3. Testes devem ser GRATUITOS (cada chamada à OpenAI custa dinheiro)

const mockCreate = vi.fn()

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mockCreate } }
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
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(fakeDiet) } }],
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

    // Verifica que chamou a OpenAI com o model correto
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.7,
      })
    )
  })

  it('should throw if OpenAI returns empty response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    await expect(
      aiService.generateDiet({ name: 'João' })
    ).rejects.toThrow('A IA não retornou uma resposta')
  })

  it('should throw if OpenAI returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'isso não é JSON' } }],
    })

    await expect(
      aiService.generateDiet({ name: 'João' })
    ).rejects.toThrow('JSON malformado')
  })
})
