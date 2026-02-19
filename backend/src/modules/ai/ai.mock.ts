import type { DietPromptInput, MealRefreshInput } from './ai.prompts.js'
import type { GeneratedDiet, GeneratedMeal } from './ai.service.js'
import { ZERO_MICROS } from '../../shared/types/micronutrients.js'

// ====================================================
// MOCK DO AI SERVICE
// ====================================================
// Retorna uma dieta fake quando não há GEMINI_API_KEY.
// Útil para desenvolvimento e testes da interface.
// Simula um delay de 2s para parecer uma chamada real.

// Helper: cria micros com override sobre zeros
function m(overrides: Record<string, number>) {
  return { ...ZERO_MICROS, ...overrides }
}

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
            { name: 'Ovos mexidos', quantity: '3 unidades', calories: 210, protein: 18, carbs: 2, fat: 15, micronutrients: m({ fiber: 0, cholesterol: 422, calcium: 58, iron: 1.8, sodium: 186, potassium: 144, magnesium: 13, vitaminA: 198, vitaminC: 0, vitaminB2: 0.49, vitaminB12: 1.1, vitaminD: 2.4, vitaminE: 1.6, phosphorus: 202, zinc: 1.4, selenium: 31, vitaminB5: 1.6 }) },
            { name: 'Pão integral', quantity: '2 fatias', calories: 140, protein: 6, carbs: 24, fat: 2, micronutrients: m({ fiber: 4.1, calcium: 30, iron: 1.4, sodium: 261, potassium: 118, magnesium: 34, vitaminA: 0, vitaminC: 0, vitaminB1: 0.24, vitaminB3: 2.4, vitaminB6: 0.11, vitaminB9: 25, phosphorus: 120, zinc: 1.1, manganese: 1.3, selenium: 19 }) },
            { name: 'Abacate', quantity: '1/2 unidade', calories: 120, protein: 1, carbs: 6, fat: 11, micronutrients: m({ fiber: 6.3, omega3: 0.11, calcium: 8, iron: 0.2, sodium: 1, potassium: 206, magnesium: 15, vitaminA: 6, vitaminC: 8, vitaminE: 2.1, vitaminK: 21, vitaminB5: 1.39, vitaminB6: 0.26, vitaminB9: 81, phosphorus: 52, copper: 0.19 }) },
          ],
          totalCalories: 470,
        },
        {
          name: 'Lanche da manhã',
          time: '10:00',
          foods: [
            { name: 'Iogurte natural', quantity: '200ml', calories: 120, protein: 8, carbs: 10, fat: 5, micronutrients: m({ calcium: 286, iron: 0.2, sodium: 104, potassium: 372, magnesium: 24, vitaminA: 44, vitaminC: 2, vitaminB2: 0.34, vitaminB12: 0.8, vitaminD: 0.2, phosphorus: 232, zinc: 1.0, selenium: 6.6 }) },
            { name: 'Granola', quantity: '30g', calories: 130, protein: 3, carbs: 20, fat: 4, micronutrients: m({ fiber: 1.4, calcium: 12, iron: 1.1, sodium: 38, potassium: 112, magnesium: 23, vitaminE: 0.8, vitaminB1: 0.10, manganese: 0.66, phosphorus: 62, zinc: 0.7, selenium: 4.6 }) },
          ],
          totalCalories: 250,
        },
        {
          name: 'Almoço',
          time: '12:30',
          foods: [
            { name: 'Arroz integral', quantity: '150g', calories: 170, protein: 4, carbs: 36, fat: 1, micronutrients: m({ fiber: 4.1, calcium: 8, iron: 0.5, sodium: 2, potassium: 84, magnesium: 59, vitaminB1: 0.15, vitaminB3: 2.3, vitaminB6: 0.23, phosphorus: 116, zinc: 0.9, manganese: 1.4, selenium: 14.7 }) },
            { name: 'Frango grelhado', quantity: '150g', calories: 250, protein: 38, carbs: 0, fat: 10, micronutrients: m({ cholesterol: 128, calcium: 6, iron: 0.5, sodium: 75, potassium: 480, magnesium: 44, vitaminA: 6, vitaminB3: 18.6, vitaminB6: 0.9, vitaminB12: 0.5, phosphorus: 342, zinc: 1.5, selenium: 41.4, vitaminB5: 1.6 }) },
            { name: 'Brócolis', quantity: '100g', calories: 35, protein: 3, carbs: 7, fat: 0, micronutrients: m({ fiber: 3.4, calcium: 51, iron: 0.5, sodium: 10, potassium: 118, magnesium: 14, vitaminA: 67, vitaminC: 42, vitaminK: 141, vitaminB9: 108, vitaminE: 1.5, phosphorus: 67, manganese: 0.19 }) },
            { name: 'Azeite de oliva', quantity: '1 colher', calories: 90, protein: 0, carbs: 0, fat: 10, micronutrients: m({ omega3: 0.10, vitaminE: 1.9, vitaminK: 7.8 }) },
          ],
          totalCalories: 545,
        },
        {
          name: 'Lanche da tarde',
          time: '15:30',
          foods: [
            { name: 'Banana', quantity: '1 unidade', calories: 105, protein: 1, carbs: 27, fat: 0, micronutrients: m({ fiber: 1.7, calcium: 7, iron: 0.3, sodium: 1, potassium: 323, magnesium: 22, vitaminA: 5, vitaminC: 19, vitaminB6: 0.35, vitaminB9: 19, manganese: 0.26, phosphorus: 24 }) },
            { name: 'Pasta de amendoim', quantity: '1 colher', calories: 95, protein: 4, carbs: 3, fat: 8, micronutrients: m({ fiber: 0.9, calcium: 9, iron: 0.4, sodium: 85, potassium: 130, magnesium: 31, vitaminE: 1.8, vitaminB3: 2.6, phosphorus: 72, zinc: 0.5, copper: 0.09, manganese: 0.30, selenium: 0.8 }) },
          ],
          totalCalories: 200,
        },
        {
          name: 'Jantar',
          time: '19:00',
          foods: [
            { name: 'Salmão grelhado', quantity: '150g', calories: 280, protein: 30, carbs: 0, fat: 17, micronutrients: m({ cholesterol: 95, omega3: 3.23, calcium: 17, iron: 0.5, sodium: 84, potassium: 570, magnesium: 44, vitaminA: 18, vitaminD: 16.5, vitaminB12: 4.8, vitaminB3: 12, vitaminB6: 0.96, vitaminE: 5.3, phosphorus: 378, zinc: 0.9, selenium: 62.1 }) },
            { name: 'Batata doce', quantity: '150g', calories: 130, protein: 2, carbs: 30, fat: 0, micronutrients: m({ fiber: 3.3, calcium: 26, iron: 0.3, sodium: 5, potassium: 510, magnesium: 17, vitaminA: 167, vitaminC: 18, vitaminB5: 0.86, vitaminB6: 0.26, vitaminE: 1.1, phosphorus: 48, manganese: 0.41 }) },
            { name: 'Salada verde', quantity: '100g', calories: 25, protein: 2, carbs: 4, fat: 0, micronutrients: m({ fiber: 1.8, calcium: 38, iron: 0.4, sodium: 3, potassium: 267, magnesium: 11, vitaminA: 232, vitaminC: 16, vitaminK: 126, vitaminB9: 73, phosphorus: 33 }) },
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
          micronutrients: m({ fiber: 2.8, calcium: 24, iron: 1.5, sodium: 5, potassium: 172, magnesium: 64, vitaminB1: 0.15, vitaminB2: 0.15, vitaminB9: 42, phosphorus: 152, zinc: 1.1, manganese: 0.63, selenium: 2.8, copper: 0.19 }),
        },
        {
          name: 'Peito de peru',
          quantity: '100g',
          calories: cal2,
          protein: Math.round(input.targetProtein * 0.4),
          carbs: Math.round(input.targetCarbs * 0.2),
          fat: Math.round(input.targetFat * 0.3),
          micronutrients: m({ cholesterol: 76, calcium: 8, iron: 0.7, sodium: 55, potassium: 350, magnesium: 28, vitaminB3: 11.8, vitaminB6: 0.80, vitaminB12: 0.4, phosphorus: 218, zinc: 2.0, selenium: 32.1, vitaminB5: 0.9 }),
        },
        {
          name: 'Tomate cereja',
          quantity: '80g',
          calories: cal3,
          protein: Math.round(input.targetProtein * 0.2),
          carbs: Math.round(input.targetCarbs * 0.3),
          fat: Math.round(input.targetFat * 0.4),
          micronutrients: m({ fiber: 1.0, calcium: 6, iron: 0.2, sodium: 2, potassium: 178, magnesium: 6, vitaminA: 43, vitaminC: 18, vitaminK: 6.3, vitaminB9: 12, vitaminE: 0.4, phosphorus: 19 }),
        },
      ],
      totalCalories: input.targetCalories,
    }
  }
}
