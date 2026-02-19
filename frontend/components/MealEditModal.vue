<!-- ====================================================
  MEAL EDIT MODAL — Editor completo de refeição
  ====================================================
  Permite ao usuário editar o que realmente comeu numa
  refeição. A edição afeta apenas o dia (check-in),
  não a dieta base.

  Features:
  - Lista editável de alimentos (editar quantidade, remover)
  - Adicionar alimentos via 3 tabs: Buscar / Favoritos / Meus
  - Preview de macros em tempo real
  - Integração com CustomFoodModal para criar novo alimento

  Props:
  - open: controla visibilidade
  - meal: dados da refeição (original ou adaptada)
  - mealIndex: índice da refeição na dieta
  - dietId: ID da dieta ativa
  Emits:
  - @update:open: controle de visibilidade
  - @saved: quando a edição é salva com sucesso
-->

<script setup lang="ts">
import type { Food } from '~/stores/diet'
import type { FoodItem } from '~/stores/food'

const props = defineProps<{
  open: boolean
  meal: { name: string; time: string; foods: any[] } | null
  mealIndex: number
  dietId: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const foodStore = useFoodStore()
const checkinStore = useCheckinStore()

// ====================================================
// ESTADO DO EDITOR
// ====================================================

type EditableFood = {
  name: string
  quantity: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  // Per-100g para recálculo proporcional
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

const editedFoods = ref<EditableFood[]>([])
const saving = ref(false)
const activeTab = ref<'search' | 'favorites' | 'custom'>('search')
const showCustomFoodModal = ref(false)

// Estado de busca
const searchQuery = ref('')
const searchCategory = ref('')
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Estado do alimento sendo adicionado
const addingFood = ref<FoodItem | null>(null)
const addGrams = ref(100)

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

// ====================================================
// INICIALIZAÇÃO
// ====================================================

watch(() => props.open, (isOpen) => {
  if (isOpen && props.meal) {
    initializeFromMeal()
  }
})

function initializeFromMeal() {
  if (!props.meal) return

  editedFoods.value = props.meal.foods.map((f: any) => {
    const grams = parseGrams(f.quantity)
    const per100g = grams > 0
      ? {
          caloriesPer100g: (f.calories / grams) * 100,
          proteinPer100g: (f.protein / grams) * 100,
          carbsPer100g: (f.carbs / grams) * 100,
          fatPer100g: (f.fat / grams) * 100,
        }
      : {
          caloriesPer100g: f.calories,
          proteinPer100g: f.protein,
          carbsPer100g: f.carbs,
          fatPer100g: f.fat,
        }

    return {
      name: f.name,
      quantity: f.quantity,
      grams,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      ...per100g,
    }
  })
}

// ====================================================
// HELPERS
// ====================================================

function parseGrams(quantity: string): number {
  const match = quantity.match(/(\d+(?:\.\d+)?)\s*g/i)
  return match ? parseFloat(match[1]) : 0
}

// ====================================================
// EDIÇÃO DE QUANTIDADE
// ====================================================

function updateGrams(index: number, newGrams: number) {
  const food = editedFoods.value[index]
  if (!food || newGrams <= 0) return

  const factor = newGrams / 100
  food.grams = newGrams
  food.quantity = `${newGrams}g`
  food.calories = Math.round(food.caloriesPer100g * factor)
  food.protein = Math.round(food.proteinPer100g * factor * 10) / 10
  food.carbs = Math.round(food.carbsPer100g * factor * 10) / 10
  food.fat = Math.round(food.fatPer100g * factor * 10) / 10
}

function removeFood(index: number) {
  editedFoods.value.splice(index, 1)
}

// ====================================================
// TOTAIS EM TEMPO REAL
// ====================================================

const totals = computed(() => ({
  calories: editedFoods.value.reduce((sum, f) => sum + f.calories, 0),
  protein: Math.round(editedFoods.value.reduce((sum, f) => sum + f.protein, 0) * 10) / 10,
  carbs: Math.round(editedFoods.value.reduce((sum, f) => sum + f.carbs, 0) * 10) / 10,
  fat: Math.round(editedFoods.value.reduce((sum, f) => sum + f.fat, 0) * 10) / 10,
}))

// ====================================================
// BUSCA DE ALIMENTOS
// ====================================================

function onSearchInput() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => searchFoods(), 300)
}

function onCategoryChange(cat: string) {
  searchCategory.value = cat
  searchFoods()
}

async function searchFoods() {
  const params: { search?: string; category?: string } = {}
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (searchCategory.value) params.category = searchCategory.value
  await foodStore.fetchFoodsUnified(params)
}

// ====================================================
// ADICIONAR ALIMENTO
// ====================================================

function selectFoodToAdd(food: FoodItem) {
  addingFood.value = food
  addGrams.value = food.commonPortions?.[0]?.grams || 100
}

const addPreview = computed(() => {
  if (!addingFood.value) return null
  const factor = addGrams.value / 100
  return {
    calories: Math.round(addingFood.value.caloriesPer100g * factor),
    protein: Math.round(addingFood.value.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(addingFood.value.carbsPer100g * factor * 10) / 10,
    fat: Math.round(addingFood.value.fatPer100g * factor * 10) / 10,
  }
})

function confirmAddFood() {
  if (!addingFood.value || !addPreview.value) return

  const factor = addGrams.value / 100
  editedFoods.value.push({
    name: addingFood.value.name,
    quantity: `${addGrams.value}g`,
    grams: addGrams.value,
    calories: addPreview.value.calories,
    protein: addPreview.value.protein,
    carbs: addPreview.value.carbs,
    fat: addPreview.value.fat,
    caloriesPer100g: addingFood.value.caloriesPer100g,
    proteinPer100g: addingFood.value.proteinPer100g,
    carbsPer100g: addingFood.value.carbsPer100g,
    fatPer100g: addingFood.value.fatPer100g,
  })

  addingFood.value = null
  addGrams.value = 100
}

function cancelAddFood() {
  addingFood.value = null
  addGrams.value = 100
}

// Seleciona um favorito para adicionar
function selectFavoriteToAdd(fav: any) {
  const food = fav.food
  if (!food) return

  selectFoodToAdd({
    _id: fav.foodId,
    name: food.name,
    category: food.category,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    commonPortions: food.commonPortions || [],
  })
}

// Seleciona um alimento custom para adicionar
function selectCustomToAdd(food: any) {
  selectFoodToAdd({
    _id: food._id,
    name: food.name,
    category: food.category,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    commonPortions: food.servingSize && food.servingName
      ? [{ name: food.servingName, grams: food.servingSize }]
      : [],
  })
}

// ====================================================
// CARREGAR DADOS DAS TABS
// ====================================================

function onTabChange(tab: 'search' | 'favorites' | 'custom') {
  activeTab.value = tab
  if (tab === 'favorites') foodStore.fetchFavorites()
  if (tab === 'custom') foodStore.fetchCustomFoods()
}

// ====================================================
// SALVAR EDIÇÃO
// ====================================================

async function handleSave() {
  if (editedFoods.value.length === 0) return

  saving.value = true
  try {
    await checkinStore.editMealInCheckIn(
      props.dietId,
      props.mealIndex,
      editedFoods.value.map(f => ({
        name: f.name,
        quantity: f.quantity,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      })),
    )
    emit('saved')
    close()
  } catch {
    // Erro já no checkinStore.error
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:open', false)
  editedFoods.value = []
  searchQuery.value = ''
  searchCategory.value = ''
  addingFood.value = null
  foodStore.foods = []
  activeTab.value = 'search'
}

// Quando um alimento customizado é criado, carrega a tab custom
function onCustomFoodCreated() {
  foodStore.fetchCustomFoods()
  activeTab.value = 'custom'
}
</script>

<template>
  <UModal :open="open" @update:open="$event ? null : close()">
    <template #content>
      <div class="p-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-semibold text-zinc-800">Editar Refeição</h3>
            <p class="text-sm text-zinc-500">{{ meal?.name }} · {{ meal?.time }}</p>
          </div>
          <button class="text-zinc-400 hover:text-zinc-600" @click="close">
            &#10005;
          </button>
        </div>

        <!-- ============================================ -->
        <!-- LISTA DE ALIMENTOS EDITÁVEIS -->
        <!-- ============================================ -->
        <div class="mb-4">
          <p class="text-xs text-zinc-500 font-medium mb-2">Alimentos da refeição</p>

          <div v-if="editedFoods.length === 0" class="text-center py-4 text-sm text-zinc-400">
            Nenhum alimento. Adicione abaixo.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(food, idx) in editedFoods"
              :key="idx"
              class="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-800 truncate">{{ food.name }}</p>
                <p class="text-xs text-zinc-400">
                  {{ Math.round(food.calories) }} kcal ·
                  P:{{ food.protein }}g
                  C:{{ food.carbs }}g
                  G:{{ food.fat }}g
                </p>
              </div>
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  :value="food.grams"
                  min="1"
                  class="w-16 text-center text-sm border border-zinc-200 rounded px-1 py-0.5"
                  @change="updateGrams(idx, Number(($event.target as HTMLInputElement).value))"
                />
                <span class="text-xs text-zinc-400">g</span>
              </div>
              <button
                class="text-zinc-300 hover:text-red-500 transition-colors px-1"
                @click="removeFood(idx)"
              >
                &#10005;
              </button>
            </div>
          </div>

          <!-- Barra de totais -->
          <div class="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p class="text-sm font-bold text-emerald-700">{{ totals.calories }}</p>
                <p class="text-emerald-500">kcal</p>
              </div>
              <div>
                <p class="text-sm font-bold text-blue-600">{{ totals.protein }}</p>
                <p class="text-blue-400">prot</p>
              </div>
              <div>
                <p class="text-sm font-bold text-amber-600">{{ totals.carbs }}</p>
                <p class="text-amber-400">carb</p>
              </div>
              <div>
                <p class="text-sm font-bold text-rose-600">{{ totals.fat }}</p>
                <p class="text-rose-400">gord</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ADICIONAR ALIMENTO -->
        <!-- ============================================ -->
        <div class="border-t border-zinc-200 pt-3">
          <p class="text-xs text-zinc-500 font-medium mb-2">Adicionar alimento</p>

          <!-- Preview de adição (quando um alimento está selecionado) -->
          <div v-if="addingFood" class="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-800">{{ addingFood.name }}</span>
              <button class="text-blue-400 hover:text-blue-600 text-xs" @click="cancelAddFood">
                Cancelar
              </button>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <input
                v-model.number="addGrams"
                type="number"
                min="1"
                class="w-20 text-center text-sm border border-blue-200 rounded px-2 py-1"
              />
              <span class="text-xs text-blue-500">gramas</span>
              <!-- Porções rápidas -->
              <template v-if="addingFood.commonPortions?.length">
                <button
                  v-for="portion in addingFood.commonPortions"
                  :key="portion.name"
                  class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                  @click="addGrams = portion.grams"
                >
                  {{ portion.name }} ({{ portion.grams }}g)
                </button>
              </template>
            </div>
            <div v-if="addPreview" class="flex items-center justify-between">
              <span class="text-xs text-blue-500">
                {{ addPreview.calories }} kcal ·
                P:{{ addPreview.protein }}g
                C:{{ addPreview.carbs }}g
                G:{{ addPreview.fat }}g
              </span>
              <UButton size="xs" color="primary" @click="confirmAddFood">
                Adicionar
              </UButton>
            </div>
          </div>

          <!-- Tabs: Buscar / Favoritos / Meus Alimentos -->
          <div v-if="!addingFood" class="flex gap-1 mb-3 bg-zinc-100 rounded-lg p-1">
            <button
              class="flex-1 text-xs py-1.5 rounded-md transition-colors"
              :class="activeTab === 'search'
                ? 'bg-white text-emerald-600 font-medium shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'"
              @click="onTabChange('search')"
            >
              Buscar
            </button>
            <button
              class="flex-1 text-xs py-1.5 rounded-md transition-colors"
              :class="activeTab === 'favorites'
                ? 'bg-white text-emerald-600 font-medium shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'"
              @click="onTabChange('favorites')"
            >
              Favoritos
            </button>
            <button
              class="flex-1 text-xs py-1.5 rounded-md transition-colors"
              :class="activeTab === 'custom'
                ? 'bg-white text-emerald-600 font-medium shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'"
              @click="onTabChange('custom')"
            >
              Meus
            </button>
          </div>

          <!-- Tab: Buscar -->
          <div v-if="activeTab === 'search' && !addingFood">
            <UInput
              v-model="searchQuery"
              placeholder="Buscar alimento..."
              size="sm"
              class="mb-2"
              @input="onSearchInput"
            />
            <div class="flex flex-wrap gap-1 mb-2">
              <button
                v-for="cat in foodCategories"
                :key="cat.value"
                class="px-2 py-0.5 text-xs rounded-full transition-colors"
                :class="searchCategory === cat.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'"
                @click="onCategoryChange(cat.value)"
              >
                {{ cat.label }}
              </button>
            </div>

            <!-- Resultados da busca -->
            <div v-if="foodStore.foods.length" class="space-y-1 max-h-40 overflow-y-auto">
              <button
                v-for="food in foodStore.foods"
                :key="food._id"
                class="w-full text-left px-3 py-2 rounded-lg border border-zinc-100 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                @click="selectFoodToAdd(food)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-medium text-zinc-800">{{ food.name }}</span>
                    <UBadge v-if="food.source === 'custom'" color="blue" variant="subtle" size="xs">
                      Meu
                    </UBadge>
                    <span
                      v-if="food.isFavorite"
                      class="text-amber-400 text-xs cursor-pointer"
                      @click.stop="foodStore.toggleFavorite(food._id, food.source || 'database')"
                    >
                      &#9733;
                    </span>
                    <span
                      v-else
                      class="text-zinc-300 text-xs cursor-pointer hover:text-amber-400"
                      @click.stop="foodStore.toggleFavorite(food._id, food.source || 'database')"
                    >
                      &#9734;
                    </span>
                  </div>
                  <span class="text-xs text-zinc-400">{{ food.caloriesPer100g }} kcal/100g</span>
                </div>
                <div class="text-xs text-zinc-500 mt-0.5">
                  P:{{ food.proteinPer100g }}g
                  C:{{ food.carbsPer100g }}g
                  G:{{ food.fatPer100g }}g
                </div>
              </button>
            </div>
            <p v-else-if="searchQuery || searchCategory" class="text-sm text-zinc-400 text-center py-3">
              Nenhum alimento encontrado.
            </p>
            <p v-else class="text-sm text-zinc-400 text-center py-3">
              Busque um alimento para adicionar.
            </p>
          </div>

          <!-- Tab: Favoritos -->
          <div v-if="activeTab === 'favorites' && !addingFood">
            <div v-if="foodStore.favorites.length" class="space-y-1 max-h-48 overflow-y-auto">
              <button
                v-for="fav in foodStore.favorites"
                :key="fav._id"
                class="w-full text-left px-3 py-2 rounded-lg border border-zinc-100 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                @click="selectFavoriteToAdd(fav)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="text-amber-400 text-xs">&#9733;</span>
                    <span class="text-sm font-medium text-zinc-800">{{ fav.food?.name || fav.foodId }}</span>
                    <UBadge v-if="fav.foodSource === 'custom'" color="blue" variant="subtle" size="xs">
                      Meu
                    </UBadge>
                  </div>
                  <span class="text-xs text-zinc-400">
                    {{ (fav.food as any)?.caloriesPer100g }} kcal/100g
                  </span>
                </div>
              </button>
            </div>
            <p v-else class="text-sm text-zinc-400 text-center py-3">
              Nenhum favorito ainda. Favorite alimentos na busca.
            </p>
          </div>

          <!-- Tab: Meus Alimentos -->
          <div v-if="activeTab === 'custom' && !addingFood">
            <div class="mb-2">
              <UButton size="xs" variant="outline" @click="showCustomFoodModal = true">
                + Criar alimento
              </UButton>
            </div>
            <div v-if="foodStore.customFoods.length" class="space-y-1 max-h-48 overflow-y-auto">
              <button
                v-for="food in foodStore.customFoods"
                :key="food._id"
                class="w-full text-left px-3 py-2 rounded-lg border border-zinc-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                @click="selectCustomToAdd(food)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-zinc-800">{{ food.name }}</span>
                  <span class="text-xs text-zinc-400">{{ food.caloriesPer100g }} kcal/100g</span>
                </div>
                <div class="text-xs text-zinc-500 mt-0.5">
                  P:{{ food.proteinPer100g }}g
                  C:{{ food.carbsPer100g }}g
                  G:{{ food.fatPer100g }}g
                  <span v-if="food.servingName" class="ml-1 text-blue-500">
                    · {{ food.servingName }} ({{ food.servingSize }}g)
                  </span>
                </div>
              </button>
            </div>
            <p v-else class="text-sm text-zinc-400 text-center py-3">
              Nenhum alimento criado ainda.
            </p>
          </div>
        </div>

        <!-- Erro -->
        <UAlert v-if="checkinStore.error" color="error" :description="checkinStore.error" class="mt-3" />

        <!-- Botões footer -->
        <div class="flex gap-2 mt-4 pt-3 border-t border-zinc-200">
          <UButton variant="outline" class="flex-1" @click="close">
            Cancelar
          </UButton>
          <UButton
            color="primary"
            class="flex-1"
            :loading="saving"
            :disabled="editedFoods.length === 0"
            @click="handleSave"
          >
            Salvar Edição
          </UButton>
        </div>

        <!-- Modal de criar alimento customizado (aninhado) -->
        <CustomFoodModal
          :open="showCustomFoodModal"
          @update:open="showCustomFoodModal = $event"
          @created="onCustomFoodCreated"
        />
      </div>
    </template>
  </UModal>
</template>
