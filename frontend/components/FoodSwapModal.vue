<!-- ====================================================
  FOOD SWAP MODAL — Componente compartilhado (Fase 3)
  ====================================================
  Modal para buscar e selecionar alimento substituto.
  Usado tanto no check-in (swap por dia) quanto na dieta
  base (swap permanente).

  Props:
  - targetFood: { name, calories } do alimento a ser trocado
  Emits:
  - @swap(newFoodId): quando o usuário seleciona um substituto
  - @close: quando o modal é fechado

  O componente pai decide o que fazer com o newFoodId
  (check-in swap vs diet swap).
-->

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  targetFood: { name: string; calories: number } | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'swap', newFoodId: string): void
}>()

const foodStore = useFoodStore()

const search = ref('')
const category = ref('')
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const foodCategories = [
  { label: 'Todos', value: '' },
  { label: 'Grãos', value: 'grains' },
  { label: 'Proteínas', value: 'proteins' },
  { label: 'Laticínios', value: 'dairy' },
  { label: 'Frutas', value: 'fruits' },
  { label: 'Vegetais', value: 'vegetables' },
  { label: 'Leguminosas', value: 'legumes' },
  { label: 'Gorduras', value: 'fats' },
  { label: 'Bebidas', value: 'beverages' },
  { label: 'Doces', value: 'sweets' },
  { label: 'Outros', value: 'others' },
]

function close() {
  emit('update:open', false)
  search.value = ''
  category.value = ''
  foodStore.foods = []
  foodStore.suggestions = []
}

function onSearchInput() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    searchFoods()
  }, 300)
}

function onCategoryChange(cat: string) {
  category.value = cat
  searchFoods()
}

async function searchFoods() {
  const params: { search?: string; category?: string } = {}
  if (search.value.trim()) params.search = search.value.trim()
  if (category.value) params.category = category.value
  await foodStore.fetchFoods(params)
}

function selectFood(foodId: string) {
  emit('swap', foodId)
}

// Calcula gramas equivalentes para preview (mesma fórmula do backend)
function previewEquivalentGrams(targetCalories: number, caloriesPer100g: number): number {
  if (caloriesPer100g === 0) return 100
  const rawGrams = (targetCalories / caloriesPer100g) * 100
  const rounded = Math.round(rawGrams / 5) * 5
  return Math.max(5, rounded)
}
</script>

<template>
  <UModal :open="open" @update:open="$event ? null : close()">
    <template #content>
      <div class="p-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-zinc-800">
            Trocar: {{ targetFood?.name }}
          </h3>
          <button class="text-zinc-400 hover:text-zinc-600" @click="close">
            &#10005;
          </button>
        </div>

        <p class="text-sm text-zinc-500 mb-3">
          Alimento atual: {{ targetFood?.calories }} kcal.
          O substituto terá a quantidade ajustada para manter as mesmas calorias.
        </p>

        <!-- Busca -->
        <UInput
          v-model="search"
          placeholder="Buscar alimento..."
          size="sm"
          class="mb-3"
          @input="onSearchInput"
        />

        <!-- Filtros por categoria -->
        <div class="flex flex-wrap gap-1 mb-3">
          <button
            v-for="cat in foodCategories"
            :key="cat.value"
            class="px-2 py-0.5 text-xs rounded-full transition-colors"
            :class="category === cat.value ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'"
            @click="onCategoryChange(cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Erro -->
        <UAlert v-if="foodStore.error" color="error" :description="foodStore.error" class="mb-3" />

        <!-- Resultados -->
        <div v-if="foodStore.foods.length" class="space-y-1 mb-4">
          <button
            v-for="food in foodStore.foods"
            :key="food._id"
            class="w-full text-left px-3 py-2 rounded-lg border border-zinc-100 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            @click="selectFood(food._id)"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-sm text-zinc-800">{{ food.name }}</span>
              <span class="text-xs text-zinc-400">{{ food.caloriesPer100g }} kcal/100g</span>
            </div>
            <div class="text-xs text-zinc-500 mt-0.5">
              P:{{ food.proteinPer100g }}g
              C:{{ food.carbsPer100g }}g
              G:{{ food.fatPer100g }}g
              <span v-if="targetFood" class="ml-2 text-emerald-600">
                &#8594; {{ previewEquivalentGrams(targetFood.calories, food.caloriesPer100g) }}g
              </span>
            </div>
          </button>
        </div>

        <!-- Estado vazio -->
        <p v-else-if="search || category" class="text-sm text-zinc-400 text-center py-4">
          Nenhum alimento encontrado. Tente outra busca.
        </p>
        <p v-else class="text-sm text-zinc-400 text-center py-4">
          Digite o nome de um alimento ou selecione uma categoria para buscar.
        </p>
      </div>
    </template>
  </UModal>
</template>
