import OpenAI from 'openai'
import { buildDietPrompt, NUTRITIONIST_SYSTEM_PROMPT } from './ai.prompts.js'
import type { DietPromptInput } from './ai.prompts.js'

// ====================================================
// AI SERVICE
// ====================================================
// Encapsula TODA a comunicação com a OpenAI.
// Nenhum outro módulo fala diretamente com a API da OpenAI.
//
// Por que isolar? Porque:
// 1. Se trocar de IA (Claude, Gemini), muda só aqui
// 2. Centraliza controle de custos e rate limiting
// 3. Facilita testes (mockamos só este service)

export type GeneratedDiet = {
  title: string
  meals: {
    name: string
    time: string
    foods: {
      name: string
      quantity: string
      calories: number
      protein: number
      carbs: number
      fat: number
    }[]
    totalCalories: number
  }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  notes: string
}

export class AiService {
  private client: OpenAI

  constructor(apiKey: string) {
    // O client da OpenAI gerencia autenticação e rate limiting.
    // Se a key for inválida, vai falhar ao fazer a primeira chamada.
    this.client = new OpenAI({ apiKey })
  }

  async generateDiet(input: DietPromptInput): Promise<GeneratedDiet> {
    const userPrompt = buildDietPrompt(input)

    // chat.completions.create() é o endpoint principal da OpenAI.
    //
    // "messages" segue o padrão de chat:
    // - system: instruções permanentes (quem a IA é)
    // - user: o pedido do usuário
    //
    // "model": gpt-4o-mini é mais barato e rápido que gpt-4o.
    //   Para gerar JSON estruturado, é suficiente.
    //   gpt-4o-mini: ~$0.15/1M tokens input, ~$0.60/1M tokens output
    //   gpt-4o:      ~$2.50/1M tokens input, ~$10/1M tokens output
    //   → 15x mais barato!
    //
    // "max_tokens": limita o tamanho da resposta.
    //   Uma dieta completa usa ~800-1200 tokens.
    //   Colocamos 2000 como margem de segurança.
    //
    // "temperature": controla a "criatividade".
    //   0 = determinístico (mesma entrada → mesma saída)
    //   1 = criativo (variações a cada chamada)
    //   0.7 = equilíbrio (dietas variadas mas coerentes)
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: NUTRITIONIST_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    // A resposta vem em response.choices[0].message.content
    // Pode ser null se der erro, por isso a verificação.
    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('A IA não retornou uma resposta')
    }

    // Parse do JSON — a IA pode retornar JSON inválido.
    // O try/catch pega esse caso.
    try {
      const diet = JSON.parse(content) as GeneratedDiet
      return diet
    } catch {
      throw new Error('A IA retornou uma resposta inválida (JSON malformado)')
    }
  }
}
