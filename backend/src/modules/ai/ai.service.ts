import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildDietPrompt, buildMealRefreshPrompt, NUTRITIONIST_SYSTEM_PROMPT } from './ai.prompts.js'
import type { DietPromptInput, MealRefreshInput } from './ai.prompts.js'

// ====================================================
// AI SERVICE — Google Gemini
// ====================================================
// Encapsula TODA a comunicação com a API do Gemini.
// Nenhum outro módulo fala diretamente com a API de IA.
//
// Por que isolar? Porque:
// 1. Se trocar de IA (OpenAI, Claude), muda só aqui
// 2. Centraliza controle de custos e rate limiting
// 3. Facilita testes (mockamos só este service)
//
// SDK: @google/generative-ai (oficial do Google)
// Antes usávamos OpenAI, mas migramos para Gemini por:
// - Tier gratuito generoso (15 RPM, 1M tokens/min)
// - Gemini 2.0 Flash: rápido e barato
// - responseMimeType: 'application/json' garante JSON válido

import type { IMicronutrients } from '../../shared/types/micronutrients.js'

export type GeneratedFood = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  micronutrients?: IMicronutrients
}

export type GeneratedDiet = {
  title: string
  meals: {
    name: string
    time: string
    foods: GeneratedFood[]
    totalCalories: number
  }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  notes: string
}

export type GeneratedMeal = {
  name: string
  time: string
  foods: GeneratedFood[]
  totalCalories: number
}

export class AiService {
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    // GoogleGenerativeAI é o client principal do SDK.
    // Diferente do OpenAI SDK que tem client.chat.completions,
    // aqui usamos client.getGenerativeModel() para obter um modelo.
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async generateDiet(input: DietPromptInput): Promise<GeneratedDiet> {
    const userPrompt = buildDietPrompt(input)

    // getGenerativeModel() cria uma instância do modelo.
    //
    // "model": gemini-2.5-flash é o modelo mais recente e inteligente da linha Flash.
    //   Ideal para gerar JSON estruturado com boa qualidade.
    //   Comparado ao gpt-4o-mini (que usávamos antes):
    //   - Tier gratuito: 15 RPM, 1M tokens/min (vs pago da OpenAI)
    //   - Velocidade: similar ou mais rápido
    //   - gemini-2.5-flash > gemini-2.0-flash em raciocínio e qualidade
    //
    // "systemInstruction": equivalente ao "system message" da OpenAI.
    //   Define a persona da IA (nutricionista profissional).
    const model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: NUTRITIONIST_SYSTEM_PROMPT,
    })

    // generateContent() é o equivalente ao chat.completions.create() da OpenAI.
    //
    // "contents": array de mensagens (como o messages da OpenAI).
    //   Cada mensagem tem role ('user' ou 'model') e parts (conteúdo).
    //
    // "generationConfig":
    //   - temperature: 0.7 → equilíbrio entre criatividade e consistência
    //   - maxOutputTokens: 16384 → parece muito, mas o Gemini 2.5 Flash usa
    //     "thinking tokens" internos (~4000) antes de responder. A dieta em si
    //     usa ~1600 tokens, mas thinking + output precisam caber no limite.
    //     Com 2000 a resposta era TRUNCADA. 16384 dá margem de sobra.
    //   - responseMimeType: 'application/json' → FORÇA o Gemini a retornar
    //     JSON válido! Isso é uma vantagem sobre a OpenAI, que pode retornar
    //     JSON envolto em ```json ... ```. Com essa opção, o parse nunca falha
    //     por formatação.
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    })

    // No Gemini, a resposta vem em result.response.text()
    // (na OpenAI era response.choices[0].message.content)
    const content = result.response.text()

    if (!content) {
      throw new Error('A IA não retornou uma resposta')
    }

    // Parse do JSON — mesmo com responseMimeType: 'application/json',
    // mantemos o try/catch como safety net.
    try {
      const diet = JSON.parse(content) as GeneratedDiet

      // Normaliza totais a partir dos dados reais dos foods.
      // A IA pode retornar totalCalories: 2800 no nível da dieta
      // mas meals que somam só 1800. Recalculamos para garantir consistência.
      diet.meals = diet.meals.map(meal => ({
        ...meal,
        totalCalories: Math.round(meal.foods.reduce((sum, f) => sum + f.calories, 0)),
      }))
      diet.totalCalories = diet.meals.reduce((sum, m) => sum + m.totalCalories, 0)
      diet.totalProtein = Math.round(
        diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.protein, 0), 0),
      )
      diet.totalCarbs = Math.round(
        diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.carbs, 0), 0),
      )
      diet.totalFat = Math.round(
        diet.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.fat, 0), 0),
      )

      return diet
    } catch {
      throw new Error('A IA retornou uma resposta inválida (JSON malformado)')
    }
  }

  // ====================================================
  // GERAR REFEIÇÃO INDIVIDUAL (Meal Refresh)
  // ====================================================
  // Gera uma refeição substituta com ingredientes diferentes
  // mas mesmas calorias totais. Reutiliza o mesmo modelo e
  // persona de nutricionista.
  async generateSingleMeal(input: MealRefreshInput): Promise<GeneratedMeal> {
    const userPrompt = buildMealRefreshPrompt(input)

    const model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: NUTRITIONIST_SYSTEM_PROMPT,
    })

    // maxOutputTokens: 16384 — mesma margem que generateDiet.
    // O Gemini 2.5 Flash usa ~4000 "thinking tokens" internos antes
    // de responder. Com 4096, a resposta truncava e o JSON saía incompleto.
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.8, // Um pouco mais criativo para variar ingredientes
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    })

    const content = result.response.text()
    if (!content) {
      throw new Error('A IA não retornou uma resposta')
    }

    try {
      const meal = JSON.parse(content) as GeneratedMeal

      // Normaliza totais a partir dos foods reais
      meal.totalCalories = Math.round(
        meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0),
      )

      return meal
    } catch {
      console.error('Gemini raw response (meal refresh):', content.substring(0, 500))
      throw new Error('A IA retornou uma refeição inválida (JSON malformado)')
    }
  }
}
