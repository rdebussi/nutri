<!-- ====================================================
  ROTINA DE EXERCÍCIOS — Configuração semanal
  ====================================================
  O usuário configura quais exercícios faz, quantas vezes
  por semana, duração e intensidade. Esses dados são usados
  para calcular o TDEE e gerar dietas mais precisas.
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const exerciseStore = useExerciseStore()

// Verifica se o perfil está preenchido com os campos necessários para TDEE.
// Sem peso, altura, nascimento e gênero, não conseguimos calcular nada.
const hasProfile = computed(() => {
  const profile = (authStore.user as Record<string, unknown> | null)?.profile as Record<string, unknown> | null
  return !!(profile?.weight && profile?.height && profile?.birthDate && profile?.gender)
})

// Estado local do formulário
const showAddForm = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const saving = ref(false)
const saved = ref(false)

// Estado do formulário de novo exercício
const newExercise = ref({
  exerciseName: '',
  category: '',
  met: 0,
  daysPerWeek: 3,
  durationMinutes: 60,
  intensity: 'MODERATE' as string,
})

// Rotinas editáveis (cópia local)
const editableRoutines = ref<Array<{
  exerciseName: string
  category: string
  met: number
  daysPerWeek: number
  durationMinutes: number
  intensity: string
}>>([])

onMounted(async () => {
  // Busca o usuário primeiro para checar se tem perfil completo
  if (!authStore.user) {
    await authStore.fetchUser()
  }

  // Sempre carrega a base de exercícios (é pública, não depende de perfil)
  await exerciseStore.fetchExercises()

  // Só busca rotinas e TDEE se o perfil existe
  if (hasProfile.value) {
    await Promise.all([
      exerciseStore.fetchRoutines(),
      exerciseStore.fetchTDEE(),
    ])
    // Copia as rotinas existentes para edição local
    editableRoutines.value = exerciseStore.routines.map(r => ({
      exerciseName: r.exerciseName,
      category: r.category,
      met: r.met,
      daysPerWeek: r.daysPerWeek,
      durationMinutes: r.durationMinutes,
      intensity: r.intensity,
    }))
  }
})

// Exercícios filtrados pela busca
const filteredExercises = computed(() => {
  return exerciseStore.exercises.filter(e => {
    const matchSearch = !searchQuery.value ||
      e.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !selectedCategory.value ||
      e.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

function selectExercise(exercise: { name: string; category: string; met: number }) {
  newExercise.value.exerciseName = exercise.name
  newExercise.value.category = exercise.category
  newExercise.value.met = exercise.met
  showAddForm.value = true
}

function addToRoutine() {
  editableRoutines.value.push({ ...newExercise.value })
  // Reset form
  newExercise.value = {
    exerciseName: '',
    category: '',
    met: 0,
    daysPerWeek: 3,
    durationMinutes: 60,
    intensity: 'MODERATE',
  }
  showAddForm.value = false
}

function removeFromRoutine(index: number) {
  editableRoutines.value.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  saved.value = false

  try {
    await exerciseStore.saveRoutines(editableRoutines.value)
    await exerciseStore.fetchTDEE()
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch {
    // erro já no store
  } finally {
    saving.value = false
  }
}

const categories = [
  { value: '', label: 'Todas' },
  { value: 'strength', label: 'Força' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'sports', label: 'Esportes' },
  { value: 'flexibility', label: 'Flexibilidade' },
  { value: 'daily', label: 'Dia a dia' },
]

const intensityOptions = [
  { value: 'LIGHT', label: 'Leve' },
  { value: 'MODERATE', label: 'Moderada' },
  { value: 'INTENSE', label: 'Intensa' },
]

const goalMap: Record<string, string> = {
  LOSE_WEIGHT: 'Perder peso',
  GAIN_MUSCLE: 'Ganhar massa',
  MAINTAIN: 'Manter peso',
  HEALTH: 'Saúde geral',
}
</script>

<template>
  <div class="exercises-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">← Voltar</NuxtLink>
      <h1>Rotina de Exercícios</h1>
      <p>Configure seus exercícios para um cálculo preciso de calorias.</p>
    </header>

    <!-- Aviso: perfil incompleto -->
    <div v-if="!hasProfile" class="profile-warning">
      <h3>Perfil incompleto</h3>
      <p>Para configurar exercícios e calcular seu gasto calórico, preencha primeiro seu perfil com peso, altura, data de nascimento e sexo.</p>
      <NuxtLink to="/profile" class="btn-primary">Preencher Perfil</NuxtLink>
    </div>

    <!-- TDEE Card -->
    <div v-if="hasProfile && exerciseStore.tdee" class="tdee-card">
      <h3>Seu Gasto Calórico</h3>
      <div class="tdee-grid">
        <div class="tdee-item">
          <span class="tdee-label">TMB</span>
          <span class="tdee-value">{{ Math.round(exerciseStore.tdee.bmr).toLocaleString('pt-BR') }}</span>
          <span class="tdee-unit">kcal</span>
        </div>
        <div class="tdee-item">
          <span class="tdee-label">TDEE</span>
          <span class="tdee-value highlight">{{ Math.round(exerciseStore.tdee.tdee).toLocaleString('pt-BR') }}</span>
          <span class="tdee-unit">kcal</span>
        </div>
        <div class="tdee-item">
          <span class="tdee-label">{{ goalMap[exerciseStore.tdee.goal] || 'Alvo' }}</span>
          <span class="tdee-value target">{{ Math.round(exerciseStore.tdee.adjustedTdee).toLocaleString('pt-BR') }}</span>
          <span class="tdee-unit">kcal</span>
        </div>
      </div>
    </div>

    <!-- Rotina atual (só aparece se tem perfil) -->
    <section v-if="hasProfile" class="current-routine">
      <h2>Minha Rotina ({{ editableRoutines.length }} exercícios)</h2>

      <div v-if="editableRoutines.length === 0" class="empty-routine">
        <p>Nenhum exercício na rotina. Adicione abaixo!</p>
      </div>

      <div v-else class="routine-list">
        <div
          v-for="(routine, index) in editableRoutines"
          :key="index"
          class="routine-item"
        >
          <div class="routine-info">
            <strong>{{ routine.exerciseName }}</strong>
            <span class="routine-details">
              {{ routine.daysPerWeek }}x/semana · {{ routine.durationMinutes }}min ·
              {{ intensityOptions.find(i => i.value === routine.intensity)?.label || routine.intensity }}
            </span>
          </div>
          <button @click="removeFromRoutine(index)" class="btn-remove">×</button>
        </div>
      </div>

      <!-- Mensagens -->
      <div v-if="exerciseStore.error" class="error-message">
        {{ exerciseStore.error }}
      </div>
      <div v-if="saved" class="success-message">
        Rotina salva com sucesso!
      </div>

      <button
        @click="handleSave"
        :disabled="saving"
        class="btn-primary btn-save"
      >
        {{ saving ? 'Salvando...' : 'Salvar Rotina' }}
      </button>
    </section>

    <!-- Adicionar exercício (só aparece se tem perfil) -->
    <section v-if="hasProfile" class="add-exercise">
      <h2>Adicionar Exercício</h2>

      <!-- Formulário de configuração (aparece ao selecionar exercício) -->
      <div v-if="showAddForm" class="add-form">
        <h3>{{ newExercise.exerciseName }}</h3>
        <p class="form-subtitle">MET: {{ newExercise.met }} · {{ newExercise.category }}</p>

        <div class="form-grid">
          <div class="form-group">
            <label>Dias por semana</label>
            <input type="number" v-model.number="newExercise.daysPerWeek" min="1" max="7" />
          </div>
          <div class="form-group">
            <label>Duração (min)</label>
            <input type="number" v-model.number="newExercise.durationMinutes" min="5" max="480" step="5" />
          </div>
          <div class="form-group">
            <label>Intensidade</label>
            <select v-model="newExercise.intensity">
              <option v-for="opt in intensityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button @click="addToRoutine" class="btn-primary">Adicionar</button>
          <button @click="showAddForm = false" class="btn-secondary">Cancelar</button>
        </div>
      </div>

      <!-- Busca e filtro de exercícios -->
      <div v-else class="exercise-search">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar exercício..."
          class="search-input"
        />
        <div class="category-filters">
          <button
            v-for="cat in categories"
            :key="cat.value"
            @click="selectedCategory = cat.value"
            class="category-chip"
            :class="{ active: selectedCategory === cat.value }"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="exercise-grid">
          <button
            v-for="exercise in filteredExercises"
            :key="exercise._id"
            @click="selectExercise(exercise)"
            class="exercise-card"
          >
            <span class="exercise-name">{{ exercise.name }}</span>
            <span class="exercise-met">MET {{ exercise.met }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.exercises-page { max-width: 700px; margin: 0 auto; padding: 1rem; }

.page-header { padding: 1rem 0; border-bottom: 1px solid #eee; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.5rem; color: #10b981; margin-top: 0.5rem; }
.page-header p { color: #666; font-size: 0.9rem; margin-top: 0.25rem; }

.back-link { color: #666; text-decoration: none; font-size: 0.875rem; }
.back-link:hover { color: #10b981; }

/* Aviso de perfil incompleto */
.profile-warning {
  text-align: center;
  padding: 2rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.profile-warning h3 { color: #92400e; margin: 0 0 0.5rem; font-size: 1.1rem; }
.profile-warning p { color: #78350f; font-size: 0.9rem; margin: 0 0 1rem; }
.profile-warning .btn-primary { display: inline-block; text-decoration: none; }

/* TDEE Card */
.tdee-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.tdee-card h3 { margin: 0 0 1rem; font-size: 1rem; color: #166534; }
.tdee-grid { display: flex; justify-content: space-around; text-align: center; }
.tdee-item { display: flex; flex-direction: column; gap: 0.25rem; }
.tdee-label { font-size: 0.75rem; color: #666; text-transform: uppercase; font-weight: 600; }
.tdee-value { font-size: 1.5rem; font-weight: 700; color: #333; }
.tdee-value.highlight { color: #059669; }
.tdee-value.target { color: #2563eb; }
.tdee-unit { font-size: 0.7rem; color: #999; }

/* Rotina */
.current-routine { margin-bottom: 2rem; }
.current-routine h2 { font-size: 1.1rem; margin-bottom: 1rem; }

.empty-routine { text-align: center; padding: 1.5rem; color: #999; background: #f9fafb; border-radius: 8px; }

.routine-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.routine-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px;
}
.routine-info { display: flex; flex-direction: column; }
.routine-info strong { font-size: 0.95rem; }
.routine-details { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
.btn-remove {
  background: none; border: none; font-size: 1.5rem; color: #ef4444; cursor: pointer;
  padding: 0 0.5rem; line-height: 1;
}
.btn-remove:hover { color: #dc2626; }

/* Adicionar exercício */
.add-exercise h2 { font-size: 1.1rem; margin-bottom: 1rem; }

.search-input {
  width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px;
  font-size: 0.95rem; margin-bottom: 0.75rem;
}
.search-input:focus { outline: none; border-color: #10b981; }

.category-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.category-chip {
  padding: 0.35rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 16px;
  background: white; font-size: 0.8rem; cursor: pointer;
}
.category-chip.active { background: #10b981; color: white; border-color: #10b981; }

.exercise-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; }
.exercise-card {
  padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem;
  text-align: left; transition: border-color 0.2s;
}
.exercise-card:hover { border-color: #10b981; }
.exercise-name { font-weight: 600; font-size: 0.85rem; }
.exercise-met { font-size: 0.75rem; color: #999; }

/* Formulário de adicionar */
.add-form {
  padding: 1.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;
}
.add-form h3 { margin: 0; font-size: 1.1rem; }
.form-subtitle { color: #666; font-size: 0.8rem; margin: 0.25rem 0 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group label { font-size: 0.8rem; color: #666; font-weight: 600; }
.form-group input, .form-group select {
  padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem;
}
.form-group input:focus, .form-group select:focus { outline: none; border-color: #10b981; }

.form-actions { display: flex; gap: 0.75rem; }

/* Botões */
.btn-primary {
  padding: 0.75rem 2rem; background: #10b981; color: white; border: none;
  border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
}
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.75rem 2rem; background: white; color: #666; border: 1px solid #e5e7eb;
  border-radius: 8px; font-size: 1rem; cursor: pointer;
}
.btn-secondary:hover { background: #f3f4f6; }

.btn-save { width: 100%; padding: 1rem; font-size: 1.1rem; }

/* Mensagens */
.error-message {
  padding: 0.75rem; background: #fef2f2; color: #dc2626;
  border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem;
}
.success-message {
  padding: 0.75rem; background: #f0fdf4; color: #059669;
  border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem; text-align: center;
}
</style>
