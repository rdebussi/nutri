<!-- ====================================================
  PERFIL NUTRICIONAL — Dados do usuário
  ====================================================
  Formulário com Nuxt UI onde o usuário preenche seus dados
  corporais e objetivos para gerar dietas precisas.
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()

const form = ref({
  weight: undefined as number | undefined,
  height: undefined as number | undefined,
  birthDate: '',
  gender: '',
  goal: '',
  restrictions: [] as string[],
})

const saving = ref(false)
const saved = ref(false)
const error = ref('')
const newRestriction = ref('')

const genderOptions = [
  { label: 'Masculino', value: 'MALE' },
  { label: 'Feminino', value: 'FEMALE' },
  { label: 'Outro', value: 'OTHER' },
]

const goalOptions = [
  { label: 'Perder peso', value: 'LOSE_WEIGHT' },
  { label: 'Ganhar massa muscular', value: 'GAIN_MUSCLE' },
  { label: 'Manter peso', value: 'MAINTAIN' },
  { label: 'Saúde geral', value: 'HEALTH' },
]

// Verifica se os 4 campos essenciais estão preenchidos
const isComplete = computed(() => {
  return !!(form.value.weight && form.value.height && form.value.birthDate && form.value.gender)
})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }

  const profile = (authStore.user as Record<string, unknown> | null)?.profile as Record<string, unknown> | null
  if (profile) {
    form.value.weight = (profile.weight as number) || undefined
    form.value.height = (profile.height as number) || undefined
    form.value.gender = (profile.gender as string) || ''
    form.value.goal = (profile.goal as string) || ''
    form.value.restrictions = (profile.restrictions as string[]) || []
    if (profile.birthDate) {
      form.value.birthDate = (profile.birthDate as string).substring(0, 10)
    }
  }
})

function addRestriction() {
  const trimmed = newRestriction.value.trim()
  if (trimmed && !form.value.restrictions.includes(trimmed)) {
    form.value.restrictions.push(trimmed)
  }
  newRestriction.value = ''
}

function removeRestriction(index: number) {
  form.value.restrictions.splice(index, 1)
}

async function handleSave() {
  if (!isComplete.value) return

  saving.value = true
  saved.value = false
  error.value = ''

  try {
    const { api } = useApi()

    const payload: Record<string, unknown> = {}
    if (form.value.weight) payload.weight = form.value.weight
    if (form.value.height) payload.height = form.value.height
    if (form.value.gender) payload.gender = form.value.gender
    if (form.value.goal) payload.goal = form.value.goal
    if (form.value.restrictions.length > 0) payload.restrictions = form.value.restrictions
    if (form.value.birthDate) {
      payload.birthDate = new Date(form.value.birthDate).toISOString()
    }

    await api('/users/me/profile', {
      method: 'PUT',
      body: payload,
    })

    await authStore.fetchUser()
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erro ao salvar perfil'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto p-4">
    <!-- Header -->
    <div class="mb-6">
      <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:text-green-600">← Voltar</NuxtLink>
      <h1 class="text-2xl font-bold text-green-600 mt-2">Meu Perfil</h1>
      <p class="text-sm text-gray-500 mt-1">Quanto mais completo, mais precisa será sua dieta.</p>
    </div>

    <!-- Alerta de campos obrigatórios -->
    <UAlert
      v-if="!isComplete"
      title="Preencha os campos obrigatórios"
      description="Peso, altura, data de nascimento e sexo são necessários para calcular seu gasto calórico."
      color="warning"
      icon="i-lucide-alert-triangle"
      class="mb-4"
    />

    <form @submit.prevent="handleSave">
      <!-- Dados Corporais -->
      <UCard class="mb-4">
        <template #header>
          <h2 class="text-lg font-semibold">Dados Corporais</h2>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Peso (kg)" required>
            <UInput
              v-model.number="form.weight"
              type="number"
              placeholder="69"
              step="0.1"
              min="20"
              max="300"
            />
          </UFormField>

          <UFormField label="Altura (cm)" required>
            <UInput
              v-model.number="form.height"
              type="number"
              placeholder="184"
              step="0.1"
              min="100"
              max="250"
            />
          </UFormField>

          <UFormField label="Data de nascimento" required>
            <UInput
              v-model="form.birthDate"
              type="date"
            />
          </UFormField>

          <UFormField label="Sexo" required>
            <USelect
              v-model="form.gender"
              :items="genderOptions"
              placeholder="Selecione"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Objetivo -->
      <UCard class="mb-4">
        <template #header>
          <h2 class="text-lg font-semibold">Objetivo</h2>
        </template>

        <UFormField label="Qual seu objetivo?">
          <USelect
            v-model="form.goal"
            :items="goalOptions"
            placeholder="Selecione"
          />
        </UFormField>
      </UCard>

      <!-- Restrições -->
      <UCard class="mb-4">
        <template #header>
          <h2 class="text-lg font-semibold">Restrições Alimentares</h2>
        </template>

        <p class="text-xs text-gray-500 mb-3">Alergias, intolerâncias ou dietas (ex: glúten, lactose, vegano)</p>

        <div v-if="form.restrictions.length > 0" class="flex flex-wrap gap-2 mb-3">
          <UBadge
            v-for="(restriction, index) in form.restrictions"
            :key="index"
            :label="restriction"
            color="success"
            variant="subtle"
            class="cursor-pointer"
            @click="removeRestriction(index)"
          >
            <template #trailing>
              <span class="ml-1 text-red-500 font-bold">×</span>
            </template>
          </UBadge>
        </div>

        <div class="flex gap-2">
          <UInput
            v-model="newRestriction"
            placeholder="Digite uma restrição..."
            class="flex-1"
            @keyup.enter.prevent="addRestriction"
          />
          <UButton
            label="Adicionar"
            color="neutral"
            variant="outline"
            @click="addRestriction"
          />
        </div>
      </UCard>

      <!-- Mensagens -->
      <UAlert
        v-if="error"
        :title="error"
        color="error"
        icon="i-lucide-circle-x"
        class="mb-4"
      />
      <UAlert
        v-if="saved"
        title="Perfil salvo com sucesso!"
        color="success"
        icon="i-lucide-check-circle"
        class="mb-4"
      />

      <!-- Botão salvar -->
      <UButton
        type="submit"
        label="Salvar Perfil"
        color="primary"
        size="xl"
        block
        :loading="saving"
        :disabled="!isComplete"
      />

      <!-- Link para exercícios -->
      <div class="text-center mt-4">
        <NuxtLink to="/profile/exercises" class="text-sm text-green-600 hover:underline">
          Configurar rotina de exercícios →
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
