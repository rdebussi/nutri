import type { DietPromptInput, MealRefreshInput } from './ai.prompts.js'
import type { GeneratedDiet, GeneratedMeal } from './ai.service.js'

// ====================================================
// MOCK DO AI SERVICE
// ====================================================
// Retorna uma dieta fake quando não há GEMINI_API_KEY.
// Útil para desenvolvimento e testes da interface.
// Simula um delay de 2s para parecer uma chamada real.

export class MockAiService {
  async generateDiet(input: DietPromptInput): Promise<GeneratedDiet> {
    // Simula o tempo da API (~2s)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const goalCalories = input.goal === 'LOSE_WEIGHT' ? 1800
      : input.goal === 'GAIN_MUSCLE' ? 2800
      : 2200

    return {
      title: `Dieta ${input.goal === 'LOSE_WEIGHT' ? 'Leveza' : input.goal === 'GAIN_MUSCLE' ? 'Força Total' : 'Equilíbrio'} para ${input.name}`,
      meals: [
        {
          name: 'Café da manhã',
          time: '07:00',
          foods: [
            { name: 'Ovos mexidos', quantity: '3 unidades', calories: 210, protein: 18, carbs: 2, fat: 15 },
            { name: 'Pão integral', quantity: '2 fatias', calories: 140, protein: 6, carbs: 24, fat: 2 },
            { name: 'Abacate', quantity: '1/2 unidade', calories: 120, protein: 1, carbs: 6, fat: 11 },
          ],
          totalCalories: 470,
        },
        {
          name: 'Lanche da manhã',
          time: '10:00',
          foods: [
            { name: 'Iogurte natural', quantity: '200ml', calories: 120, protein: 8, carbs: 10, fat: 5 },
            { name: 'Granola', quantity: '30g', calories: 130, protein: 3, carbs: 20, fat: 4 },
          ],
          totalCalories: 250,
        },
        {
          name: 'Almoço',
          time: '12:30',
          foods: [
            { name: 'Arroz integral', quantity: '150g', calories: 170, protein: 4, carbs: 36, fat: 1 },
            { name: 'Frango grelhado', quantity: '150g', calories: 250, protein: 38, carbs: 0, fat: 10 },
            { name: 'Brócolis', quantity: '100g', calories: 35, protein: 3, carbs: 7, fat: 0 },
            { name: 'Azeite de oliva', quantity: '1 colher', calories: 90, protein: 0, carbs: 0, fat: 10 },
          ],
          totalCalories: 545,
        },
        {
          name: 'Lanche da tarde',
          time: '15:30',
          foods: [
            { name: 'Banana', quantity: '1 unidade', calories: 105, protein: 1, carbs: 27, fat: 0 },
            { name: 'Pasta de amendoim', quantity: '1 colher', calories: 95, protein: 4, carbs: 3, fat: 8 },
          ],
          totalCalories: 200,
        },
        {
          name: 'Jantar',
          time: '19:00',
          foods: [
            { name: 'Salmão grelhado', quantity: '150g', calories: 280, protein: 30, carbs: 0, fat: 17 },
            { name: 'Batata doce', quantity: '150g', calories: 130, protein: 2, carbs: 30, fat: 0 },
            { name: 'Salada verde', quantity: '100g', calories: 25, protein: 2, carbs: 4, fat: 0 },
          ],
          totalCalories: 435,
        },
      ],
      totalCalories: goalCalories,
      totalProtein: 120,
      totalCarbs: 169,
      totalFat: 83,
      notes: `Dieta gerada em modo demonstração. ${input.restrictions?.length ? `Restrições consideradas: ${input.restrictions.join(', ')}.` : ''} Beba pelo menos 2 litros de água por dia.`,
    }
  }

  async generateSingleMeal(input: MealRefreshInput): Promise<GeneratedMeal> {
    // Simula delay da API (~1s)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Gera uma refeição alternativa com os mesmos macros alvo
    // Distribui entre 3 alimentos genéricos
    const cal1 = Math.round(input.targetCalories * 0.5)
    const cal2 = Math.round(input.targetCalories * 0.3)
    const cal3 = input.targetCalories - cal1 - cal2

    return {
      name: input.mealName,
      time: input.mealTime,
      foods: [
        {
          name: 'Quinoa cozida',
          quantity: '150g',
          calories: cal1,
          protein: Math.round(input.targetProtein * 0.4),
          carbs: Math.round(input.targetCarbs * 0.5),
          fat: Math.round(input.targetFat * 0.3),
        },
        {
          name: 'Peito de peru',
          quantity: '100g',
          calories: cal2,
          protein: Math.round(input.targetProtein * 0.4),
          carbs: Math.round(input.targetCarbs * 0.2),
          fat: Math.round(input.targetFat * 0.3),
        },
        {
          name: 'Tomate cereja',
          quantity: '80g',
          calories: cal3,
          protein: Math.round(input.targetProtein * 0.2),
          carbs: Math.round(input.targetCarbs * 0.3),
          fat: Math.round(input.targetFat * 0.4),
        },
      ],
      totalCalories: input.targetCalories,
    }
  }
}
