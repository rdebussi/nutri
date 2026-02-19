<script setup lang="ts">
// ====================================================
// MICRONUTRIENTS SUMMARY
// ====================================================
// Exibe barras de progresso com % da RDA para cada
// micronutriente. Cores indicam status:
// - Verde (>= 70%): OK
// - Amarelo (50-69%): Atenção
// - Vermelho (< 50%): Baixo
// - Sódio invertido: verde <= 100%, amarelo 100-130%, vermelho > 130%

import type { Micronutrients } from '~/stores/diet'

type Gender = 'MALE' | 'FEMALE'
type MicroKey = keyof Micronutrients

const props = defineProps<{
  micronutrients: Micronutrients
  gender: Gender
}>()

// RDA values por gênero (mesmos do backend)
const RDA: Record<Gender, Micronutrients> = {
  MALE: { fiber: 38, calcium: 1000, iron: 8, sodium: 2300, potassium: 3400, magnesium: 420, vitaminA: 900, vitaminC: 90 },
  FEMALE: { fiber: 25, calcium: 1000, iron: 18, sodium: 2300, potassium: 2600, magnesium: 320, vitaminA: 700, vitaminC: 75 },
}

const MICRO_META: Record<MicroKey, { label: string; unit: string }> = {
  fiber: { label: 'Fibra', unit: 'g' },
  calcium: { label: 'Cálcio', unit: 'mg' },
  iron: { label: 'Ferro', unit: 'mg' },
  sodium: { label: 'Sódio', unit: 'mg' },
  potassium: { label: 'Potássio', unit: 'mg' },
  magnesium: { label: 'Magnésio', unit: 'mg' },
  vitaminA: { label: 'Vitamina A', unit: 'mcg' },
  vitaminC: { label: 'Vitamina C', unit: 'mg' },
}

const MICRO_KEYS: MicroKey[] = ['fiber', 'calcium', 'iron', 'sodium', 'potassium', 'magnesium', 'vitaminA', 'vitaminC']

const items = computed(() => {
  const rda = RDA[props.gender]
  return MICRO_KEYS.map(key => {
    const value = Math.round(props.micronutrients[key] * 10) / 10
    const rdaValue = rda[key]
    const percent = rdaValue > 0 ? Math.round((value / rdaValue) * 100) : 0
    const meta = MICRO_META[key]

    return {
      key,
      label: meta.label,
      unit: meta.unit,
      value,
      rdaValue,
      percent,
      barWidth: Math.min(percent, 150), // cap visual em 150%
      color: getColor(key, percent),
    }
  })
})

function getColor(key: MicroKey, percent: number): string {
  if (key === 'sodium') {
    // Sódio: quanto MENOS melhor
    if (percent <= 100) return 'emerald'
    if (percent <= 130) return 'amber'
    return 'red'
  }
  // Demais: quanto MAIS melhor
  if (percent >= 70) return 'emerald'
  if (percent >= 50) return 'amber'
  return 'red'
}

const alertCount = computed(() =>
  items.value.filter(i =>
    i.key === 'sodium' ? i.percent > 100 : i.percent < 70,
  ).length,
)
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700">Micronutrientes</h3>
      <UBadge v-if="alertCount > 0" color="amber" variant="soft" size="xs">
        {{ alertCount }} alerta{{ alertCount > 1 ? 's' : '' }}
      </UBadge>
    </div>

    <!-- Grid de barras -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div
        v-for="item in items"
        :key="item.key"
        class="flex items-center gap-2 text-xs"
      >
        <!-- Label -->
        <span class="w-20 text-gray-600 truncate">{{ item.label }}</span>

        <!-- Barra de progresso -->
        <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="{
              'bg-emerald-500': item.color === 'emerald',
              'bg-amber-400': item.color === 'amber',
              'bg-red-400': item.color === 'red',
            }"
            :style="{ width: `${Math.min(item.barWidth, 100)}%` }"
          />
        </div>

        <!-- Valor + % -->
        <span class="w-24 text-right text-gray-500 tabular-nums">
          {{ item.value }}{{ item.unit }}
          <span
            class="font-medium"
            :class="{
              'text-emerald-600': item.color === 'emerald',
              'text-amber-600': item.color === 'amber',
              'text-red-500': item.color === 'red',
            }"
          >
            ({{ item.percent }}%)
          </span>
        </span>
      </div>
    </div>

    <!-- Legenda -->
    <p class="text-[10px] text-gray-400 mt-1">
      % da RDA (Recommended Daily Allowance) para {{ gender === 'MALE' ? 'homem' : 'mulher' }} adulto.
      Sódio: alerta quando acima de 100%.
    </p>
  </div>
</template>
