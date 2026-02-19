<!-- ====================================================
  CUSTOM FOOD MODAL — Criar alimento customizado
  ====================================================
  Modal para o usuário criar seus próprios alimentos com
  macros por 100g ou por porção. Ao salvar por porção,
  o backend converte automaticamente para per-100g.

  Props:
  - open: controla visibilidade do modal
  Emits:
  - @update:open: controle de visibilidade (v-model pattern)
  - @created: quando o alimento é criado com sucesso
-->

<script setup lang="ts">
import type { CreateCustomFoodInput } from '~/stores/food'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created', food: any): void
}>()

const foodStore = useFoodStore()

// Estado do formulário
const inputMode = ref<'per100g' | 'perServing'>('per100g')
const saving = ref(false)

const form = ref({
  name: '',
  category: 'others' as string,
  ingredients: '',
  // Por 100g
  caloriesPer100g: null as number | null,
  proteinPer100g: null as number | null,
  carbsPer100g: null as number | null,
  fatPer100g: null as number | null,
  // Por porção
  servingSize: null as number | null,
  servingName: '',
  caloriesPerServing: null as number | null,
  proteinPerServing: null as number | null,
  carbsPerServing: null as number | null,
  fatPerServing: null as number | null,
})

const foodCategories = [
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

// Preview dos macros normalizados (per-100g)
const normalizedPreview = computed(() => {
  if (inputMode.value === 'per100g') {
    return {
      calories: form.value.caloriesPer100g ?? 0,
      protein: form.value.proteinPer100g ?? 0,
      carbs: form.value.carbsPer100g ?? 0,
      fat: form.value.fatPer100g ?? 0,
    }
  }

  // Converte por porção → per-100g
  const size = form.value.servingSize
  if (!size || size <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }

  const factor = 100 / size
  return {
    calories: Math.round((form.value.caloriesPerServing ?? 0) * factor * 10) / 10,
    protein: Math.round((form.value.proteinPerServing ?? 0) * factor * 10) / 10,
    carbs: Math.round((form.value.carbsPerServing ?? 0) * factor * 10) / 10,
    fat: Math.round((form.value.fatPerServing ?? 0) * factor * 10) / 10,
  }
})

// Validação básica do formulário
const isValid = computed(() => {
  if (!form.value.name.trim() || form.value.name.trim().length < 2) return false
  if (!form.value.category) return false

  if (inputMode.value === 'per100g') {
    return form.value.caloriesPer100g !== null && form.value.caloriesPer100g >= 0
  }

  return (
    form.value.servingSize !== null &&
    form.value.servingSize > 0 &&
    form.value.caloriesPerServing !== null &&
    form.value.caloriesPerServing >= 0
  )
})

function resetForm() {
  form.value = {
    name: '',
    category: 'others',
    ingredients: '',
    caloriesPer100g: null,
    proteinPer100g: null,
    carbsPer100g: null,
    fatPer100g: null,
    servingSize: null,
    servingName: '',
    caloriesPerServing: null,
    proteinPerServing: null,
    carbsPerServing: null,
    fatPerServing: null,
  }
  inputMode.value = 'per100g'
}

function close() {
  emit('update:open', false)
  resetForm()
}

async function handleSave() {
  if (!isValid.value) return

  saving.value = true

  const data: CreateCustomFoodInput = {
    name: form.value.name.trim(),
    category: form.value.category,
    ...(form.value.ingredients.trim() ? { ingredients: form.value.ingredients.trim() } : {}),
  }

  if (inputMode.value === 'per100g') {
    data.caloriesPer100g = form.value.caloriesPer100g ?? 0
    data.proteinPer100g = form.value.proteinPer100g ?? 0
    data.carbsPer100g = form.value.carbsPer100g ?? 0
    data.fatPer100g = form.value.fatPer100g ?? 0
  } else {
    data.servingSize = form.value.servingSize ?? 0
    data.servingName = form.value.servingName || undefined
    data.caloriesPerServing = form.value.caloriesPerServing ?? 0
    data.proteinPerServing = form.value.proteinPerServing ?? 0
    data.carbsPerServing = form.value.carbsPerServing ?? 0
    data.fatPerServing = form.value.fatPerServing ?? 0
  }

  try {
    const created = await foodStore.createCustomFood(data)
    emit('created', created)
    close()
  } catch {
    // Erro já está em foodStore.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="$event ? null : close()">
    <template #content>
      <div class="p-4 max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-zinc-800">Criar Alimento</h3>
          <button class="text-zinc-400 hover:text-zinc-600" @click="close">
            &#10005;
          </button>
        </div>

        <!-- Nome -->
        <UFormField label="Nome do alimento" class="mb-3">
          <UInput
            v-model="form.name"
            placeholder="Ex: Panqueca de aveia"
            size="sm"
          />
        </UFormField>

        <!-- Categoria -->
        <UFormField label="Categoria" class="mb-3">
          <USelect
            v-model="form.category"
            :items="foodCategories"
            size="sm"
          />
        </UFormField>

        <!-- Ingredientes (opcional) -->
        <UFormField label="Ingredientes (opcional)" class="mb-4">
          <UInput
            v-model="form.ingredients"
            placeholder="Ex: 2 ovos, 50g aveia, 1 banana"
            size="sm"
          />
        </UFormField>

        <!-- Tabs: Por 100g / Por Porção -->
        <div class="flex gap-1 mb-4 bg-zinc-100 rounded-lg p-1">
          <button
            class="flex-1 text-sm py-1.5 rounded-md transition-colors"
            :class="inputMode === 'per100g'
              ? 'bg-white text-emerald-600 font-medium shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'"
            @click="inputMode = 'per100g'"
          >
            Por 100g
          </button>
          <button
            class="flex-1 text-sm py-1.5 rounded-md transition-colors"
            :class="inputMode === 'perServing'
              ? 'bg-white text-emerald-600 font-medium shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'"
            @click="inputMode = 'perServing'"
          >
            Por Porção
          </button>
        </div>

        <!-- Campos por 100g -->
        <div v-if="inputMode === 'per100g'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Calorias (kcal)">
              <UInput v-model.number="form.caloriesPer100g" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Proteína (g)">
              <UInput v-model.number="form.proteinPer100g" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Carboidratos (g)">
              <UInput v-model.number="form.carbsPer100g" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Gordura (g)">
              <UInput v-model.number="form.fatPer100g" type="number" size="sm" placeholder="0" />
            </UFormField>
          </div>
        </div>

        <!-- Campos por porção -->
        <div v-if="inputMode === 'perServing'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Porção (gramas)">
              <UInput v-model.number="form.servingSize" type="number" size="sm" placeholder="Ex: 80" />
            </UFormField>
            <UFormField label="Nome da porção">
              <UInput v-model="form.servingName" size="sm" placeholder="Ex: 1 panqueca" />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Calorias (kcal)">
              <UInput v-model.number="form.caloriesPerServing" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Proteína (g)">
              <UInput v-model.number="form.proteinPerServing" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Carboidratos (g)">
              <UInput v-model.number="form.carbsPerServing" type="number" size="sm" placeholder="0" />
            </UFormField>
            <UFormField label="Gordura (g)">
              <UInput v-model.number="form.fatPerServing" type="number" size="sm" placeholder="0" />
            </UFormField>
          </div>
        </div>

        <!-- Preview normalizado -->
        <div class="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <p class="text-xs text-zinc-500 mb-2 font-medium">Preview por 100g:</p>
          <div class="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <p class="text-lg font-bold text-emerald-600">{{ normalizedPreview.calories }}</p>
              <p class="text-xs text-zinc-400">kcal</p>
            </div>
            <div>
              <p class="text-lg font-bold text-blue-600">{{ normalizedPreview.protein }}</p>
              <p class="text-xs text-zinc-400">prot</p>
            </div>
            <div>
              <p class="text-lg font-bold text-amber-600">{{ normalizedPreview.carbs }}</p>
              <p class="text-xs text-zinc-400">carb</p>
            </div>
            <div>
              <p class="text-lg font-bold text-rose-600">{{ normalizedPreview.fat }}</p>
              <p class="text-xs text-zinc-400">gord</p>
            </div>
          </div>
        </div>

        <!-- Erro -->
        <UAlert v-if="foodStore.error" color="error" :description="foodStore.error" class="mt-3" />

        <!-- Botões -->
        <div class="flex gap-2 mt-4">
          <UButton variant="outline" class="flex-1" @click="close">
            Cancelar
          </UButton>
          <UButton
            color="primary"
            class="flex-1"
            :loading="saving"
            :disabled="!isValid"
            @click="handleSave"
          >
            Salvar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
