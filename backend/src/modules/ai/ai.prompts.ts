// ====================================================
// PROMPT ENGINEERING
// ====================================================
// "Prompt engineering" é a arte de escrever instruções
// para a IA de forma que ela retorne exatamente o que queremos.
//
// Regras de ouro:
// 1. Seja ESPECÍFICO: "gere 5 refeições" > "gere uma dieta"
// 2. Defina o FORMATO: "retorne JSON" > "retorne a dieta"
// 3. Dê CONTEXTO: "você é um nutricionista" > "gere uma dieta"
// 4. Inclua RESTRIÇÕES: "sem glúten, max 2000kcal"
// 5. Peça JSON VÁLIDO: a IA pode gerar JSON malformado se não for explícito

export type ExerciseRoutineInfo = {
  exerciseName: string
  daysPerWeek: number
  durationMinutes: number
  intensity: string
}

export type DietPromptInput = {
  name: string
  weight?: number | null
  height?: number | null
  goal?: string | null
  activityLevel?: string | null
  restrictions?: string[]
  gender?: string | null
  birthDate?: string | null
  // Novos campos para TDEE preciso
  tdee?: number | null
  adjustedTdee?: number | null
  bmr?: number | null
  exerciseRoutine?: ExerciseRoutineInfo[]
}

// Mapa legível dos enums → a IA entende melhor texto natural
const goalMap: Record<string, string> = {
  LOSE_WEIGHT: 'perder peso',
  GAIN_MUSCLE: 'ganhar massa muscular',
  MAINTAIN: 'manter o peso atual',
  HEALTH: 'melhorar a saúde geral',
}

const activityMap: Record<string, string> = {
  SEDENTARY: 'sedentário (pouco ou nenhum exercício)',
  LIGHT: 'leve (exercício 1-3 dias/semana)',
  MODERATE: 'moderado (exercício 3-5 dias/semana)',
  ACTIVE: 'ativo (exercício 6-7 dias/semana)',
  VERY_ACTIVE: 'muito ativo (exercício intenso diário)',
}

export function buildDietPrompt(input: DietPromptInput): string {
  const userInfo = [
    `Nome: ${input.name}`,
    input.weight ? `Peso: ${input.weight}kg` : null,
    input.height ? `Altura: ${input.height}cm` : null,
    input.gender ? `Sexo: ${input.gender}` : null,
    input.goal ? `Objetivo: ${goalMap[input.goal] || input.goal}` : null,
    input.activityLevel
      ? `Nível de atividade: ${activityMap[input.activityLevel] || input.activityLevel}`
      : null,
    input.restrictions?.length
      ? `Restrições alimentares: ${input.restrictions.join(', ')}`
      : null,
    input.bmr ? `Taxa Metabólica Basal (TMB): ${input.bmr} kcal` : null,
    input.tdee ? `Gasto Calórico Diário (TDEE): ${input.tdee} kcal` : null,
    input.adjustedTdee
      ? `Calorias Alvo (ajustado ao objetivo): ${input.adjustedTdee} kcal`
      : null,
    input.exerciseRoutine?.length
      ? `Rotina de exercícios:\n${input.exerciseRoutine.map(
          e => `  - ${e.exerciseName}: ${e.daysPerWeek}x/semana, ${e.durationMinutes}min, intensidade ${e.intensity.toLowerCase()}`,
        ).join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  // O prompt tem 3 partes:
  // 1. SYSTEM: define quem a IA é (nutricionista)
  // 2. USER: dados do paciente + pedido
  // 3. Formato de saída: JSON Schema para garantir estrutura

  return `Dados do paciente:
${userInfo}

Crie um plano alimentar diário completo e personalizado para este paciente.

REGRAS:
- Inclua entre 5 e 6 refeições (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia opcional)
- Cada refeição deve ter entre 2 e 5 alimentos
- Calcule calorias e macronutrientes (proteína, carboidratos, gordura) para CADA alimento
- As quantidades devem ser práticas (ex: "1 fatia", "200ml", "100g")
- Se "Calorias Alvo" foi informado, use esse valor como base para as calorias totais da dieta
- Caso contrário, adapte as calorias ao objetivo e nível de atividade do paciente
- Respeite TODAS as restrições alimentares
- Inclua um título criativo para a dieta
- Adicione observações/dicas personalizadas no campo notes
- Para CADA alimento, inclua micronutrientes: fiber (g), calcium (mg), iron (mg), sodium (mg), potassium (mg), magnesium (mg), vitaminA (mcg RAE), vitaminC (mg)
- Busque atingir pelo menos 70% da RDA de cada micronutriente no total da dieta

Responda APENAS com JSON válido no seguinte formato (sem markdown, sem texto antes ou depois):
{
  "title": "Nome criativo da dieta",
  "meals": [
    {
      "name": "Nome da refeição",
      "time": "HH:MM",
      "foods": [
        {
          "name": "Nome do alimento",
          "quantity": "quantidade",
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0,
          "micronutrients": {
            "fiber": 0,
            "calcium": 0,
            "iron": 0,
            "sodium": 0,
            "potassium": 0,
            "magnesium": 0,
            "vitaminA": 0,
            "vitaminC": 0
          }
        }
      ],
      "totalCalories": 0
    }
  ],
  "totalCalories": 0,
  "totalProtein": 0,
  "totalCarbs": 0,
  "totalFat": 0,
  "notes": "Observações e dicas personalizadas"
}`
}

// ====================================================
// MEAL REFRESH PROMPT
// ====================================================
// Gera uma refeição substituta com exatamente as mesmas
// calorias (tolerância ±20 kcal), usando ingredientes DIFERENTES.

export type MealRefreshInput = {
  mealName: string
  mealTime: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  currentFoodNames: string[]
  restrictions?: string[]
}

export function buildMealRefreshPrompt(input: MealRefreshInput): string {
  return `Preciso de uma nova versão da refeição "${input.mealName}" (horário: ${input.mealTime}).

REGRAS OBRIGATÓRIAS:
- O total de calorias DEVE ser EXATAMENTE ${input.targetCalories} kcal (tolerância: ±20 kcal)
- Proteína: ~${input.targetProtein}g (tolerância: ±10%)
- Carboidratos: ~${input.targetCarbs}g (tolerância: ±10%)
- Gordura: ~${input.targetFat}g (tolerância: ±10%)
- NÃO use nenhum destes alimentos: ${input.currentFoodNames.join(', ')}
- Use alimentos DIFERENTES mas com valor nutricional equivalente
- Entre 2 e 5 alimentos
- Quantidades práticas (ex: "1 fatia", "200ml", "100g")
${input.restrictions?.length ? `- Restrições alimentares: ${input.restrictions.join(', ')}` : ''}

Responda APENAS com JSON válido:
{
  "name": "${input.mealName}",
  "time": "${input.mealTime}",
  "foods": [
    { "name": "...", "quantity": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "micronutrients": { "fiber": 0, "calcium": 0, "iron": 0, "sodium": 0, "potassium": 0, "magnesium": 0, "vitaminA": 0, "vitaminC": 0 } }
  ],
  "totalCalories": 0
}`
}

// System prompt: define a "persona" da IA.
// Isso afeta drasticamente a qualidade das respostas.
export const NUTRITIONIST_SYSTEM_PROMPT = `Você é um nutricionista profissional registrado com 15 anos de experiência.
Você cria planos alimentares personalizados, equilibrados e saudáveis.
Você sempre considera as necessidades individuais, restrições alimentares e objetivos do paciente.
Você responde EXCLUSIVAMENTE em JSON válido, sem markdown, sem explicações fora do JSON.`
