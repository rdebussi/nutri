import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// DIET STORE
// ====================================================
// Gerencia o estado das dietas no frontend.
// Armazena a lista de dietas e a dieta sendo visualizada.
//
// "Generating" é um estado importante: enquanto a IA gera
// a dieta (pode levar 5-15 segundos), precisamos mostrar
// um loading para o usuário não achar que travou.

export type Food = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type Meal = {
  name: string
  time: string
  foods: Food[]
  totalCalories: number
}

export type Diet = {
  _id: string
  userId: string
  title: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  goal: string
  notes: string
  createdAt: string
}

export const useDietStore = defineStore('diet', () => {
  const diets = ref<Diet[]>([])
  const currentDiet = ref<Diet | null>(null)
  const generating = ref(false)
  const error = ref('')

  async function generate() {
    generating.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const diet = await api<Diet>('/diets/generate', { method: 'POST' })
      diets.value.unshift(diet) // adiciona no início da lista
      currentDiet.value = diet
      return diet
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao gerar dieta'
      throw e
    } finally {
      generating.value = false
    }
  }

  async function fetchAll() {
    const { api } = useApi()
    diets.value = await api<Diet[]>('/diets')
  }

  async function fetchById(id: string) {
    const { api } = useApi()
    currentDiet.value = await api<Diet>(`/diets/${id}`)
    return currentDiet.value
  }

  return { diets, currentDiet, generating, error, generate, fetchAll, fetchById }
})
