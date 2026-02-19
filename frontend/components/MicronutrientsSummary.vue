<script setup lang="ts">
// ====================================================
// MICRONUTRIENTS SUMMARY
// ====================================================
// Exibe barras de progresso com % da RDA para cada
// micronutriente, agrupados por categoria:
// - Outros: fibra, ômega-3, colesterol
// - Vitaminas: A, B1-B12, C, D, E, K
// - Minerais: cálcio, ferro, magnésio, etc.
//
// Cores indicam status:
// - Verde (>= 70%): OK
// - Amarelo (50-69%): Atenção
// - Vermelho (< 50%): Baixo
// - Sódio/Colesterol invertido: verde <= 100%, amarelo 100-130%, vermelho > 130%

import { computed, ref } from 'vue'
import type { Micronutrients } from '~/stores/diet'

type Gender = 'MALE' | 'FEMALE'
type MicroKey = keyof Micronutrients
type MicroGroup = 'other' | 'vitamins' | 'minerals'

const props = defineProps<{
  micronutrients: Micronutrients
  gender: Gender
}>()

// RDA values por gênero (espelhados do backend)
const RDA: Record<Gender, Micronutrients> = {
  MALE: {
    fiber: 38, omega3: 1.6, cholesterol: 300,
    vitaminA: 900, vitaminB1: 1.2, vitaminB2: 1.3, vitaminB3: 16, vitaminB5: 5,
    vitaminB6: 1.3, vitaminB9: 400, vitaminB12: 2.4, vitaminC: 90, vitaminD: 15,
    vitaminE: 15, vitaminK: 120,
    calcium: 1000, iron: 8, magnesium: 420, phosphorus: 700, potassium: 3400,
    sodium: 2300, zinc: 11, copper: 0.9, manganese: 2.3, selenium: 55,
  },
  FEMALE: {
    fiber: 25, omega3: 1.1, cholesterol: 300,
    vitaminA: 700, vitaminB1: 1.1, vitaminB2: 1.1, vitaminB3: 14, vitaminB5: 5,
    vitaminB6: 1.3, vitaminB9: 400, vitaminB12: 2.4, vitaminC: 75, vitaminD: 15,
    vitaminE: 15, vitaminK: 90,
    calcium: 1000, iron: 18, magnesium: 320, phosphorus: 700, potassium: 2600,
    sodium: 2300, zinc: 8, copper: 0.9, manganese: 1.8, selenium: 55,
  },
}

const MICRO_META: Record<MicroKey, { label: string; unit: string; group: MicroGroup }> = {
  // Outros
  fiber: { label: 'Fibra', unit: 'g', group: 'other' },
  omega3: { label: 'Ômega-3', unit: 'g', group: 'other' },
  cholesterol: { label: 'Colesterol', unit: 'mg', group: 'other' },
  // Vitaminas
  vitaminA: { label: 'Vitamina A', unit: 'mcg', group: 'vitamins' },
  vitaminB1: { label: 'Vitamina B1', unit: 'mg', group: 'vitamins' },
  vitaminB2: { label: 'Vitamina B2', unit: 'mg', group: 'vitamins' },
  vitaminB3: { label: 'Vitamina B3', unit: 'mg', group: 'vitamins' },
  vitaminB5: { label: 'Vitamina B5', unit: 'mg', group: 'vitamins' },
  vitaminB6: { label: 'Vitamina B6', unit: 'mg', group: 'vitamins' },
  vitaminB9: { label: 'Folato (B9)', unit: 'mcg', group: 'vitamins' },
  vitaminB12: { label: 'Vitamina B12', unit: 'mcg', group: 'vitamins' },
  vitaminC: { label: 'Vitamina C', unit: 'mg', group: 'vitamins' },
  vitaminD: { label: 'Vitamina D', unit: 'mcg', group: 'vitamins' },
  vitaminE: { label: 'Vitamina E', unit: 'mg', group: 'vitamins' },
  vitaminK: { label: 'Vitamina K', unit: 'mcg', group: 'vitamins' },
  // Minerais
  calcium: { label: 'Cálcio', unit: 'mg', group: 'minerals' },
  iron: { label: 'Ferro', unit: 'mg', group: 'minerals' },
  magnesium: { label: 'Magnésio', unit: 'mg', group: 'minerals' },
  phosphorus: { label: 'Fósforo', unit: 'mg', group: 'minerals' },
  potassium: { label: 'Potássio', unit: 'mg', group: 'minerals' },
  sodium: { label: 'Sódio', unit: 'mg', group: 'minerals' },
  zinc: { label: 'Zinco', unit: 'mg', group: 'minerals' },
  copper: { label: 'Cobre', unit: 'mg', group: 'minerals' },
  manganese: { label: 'Manganês', unit: 'mg', group: 'minerals' },
  selenium: { label: 'Selênio', unit: 'mcg', group: 'minerals' },
}

const MICRO_KEYS: MicroKey[] = [
  'fiber', 'omega3', 'cholesterol',
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5', 'vitaminB6',
  'vitaminB9', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium',
  'zinc', 'copper', 'manganese', 'selenium',
]

// Nutrientes que alertam quando ACIMA de 100% (são limites, não metas)
const HIGH_ALERT_KEYS: MicroKey[] = ['sodium', 'cholesterol']

type MicroItem = {
  key: MicroKey
  label: string
  unit: string
  group: MicroGroup
  value: number
  rdaValue: number
  percent: number
  barWidth: number
  color: string
}

const items = computed<MicroItem[]>(() => {
  const rda = RDA[props.gender]
  return MICRO_KEYS.map(key => {
    const value = Math.round((props.micronutrients[key] ?? 0) * 10) / 10
    const rdaValue = rda[key]
    const percent = rdaValue > 0 ? Math.round((value / rdaValue) * 100) : 0
    const meta = MICRO_META[key]

    return {
      key,
      label: meta.label,
      unit: meta.unit,
      group: meta.group,
      value,
      rdaValue,
      percent,
      barWidth: Math.min(percent, 150),
      color: getColor(key, percent),
    }
  })
})

// Itens agrupados por categoria
const groups = computed(() => [
  { title: 'Outros', key: 'other' as MicroGroup, items: items.value.filter(i => i.group === 'other') },
  { title: 'Vitaminas', key: 'vitamins' as MicroGroup, items: items.value.filter(i => i.group === 'vitamins') },
  { title: 'Minerais', key: 'minerals' as MicroGroup, items: items.value.filter(i => i.group === 'minerals') },
])

function getColor(key: MicroKey, percent: number): string {
  if (HIGH_ALERT_KEYS.includes(key)) {
    // Sódio e colesterol: quanto MENOS melhor
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
    HIGH_ALERT_KEYS.includes(i.key) ? i.percent > 100 : i.percent < 70,
  ).length,
)

// Controla expansão das seções (começa expandido)
const expanded = ref<Record<MicroGroup, boolean>>({
  other: true,
  vitamins: true,
  minerals: true,
})

function toggleGroup(group: MicroGroup) {
  expanded.value[group] = !expanded.value[group]
}
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

    <!-- Grupos colapsáveis -->
    <div v-for="group in groups" :key="group.key" class="space-y-1">
      <!-- Título do grupo (clicável) -->
      <button
        class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 w-full"
        @click="toggleGroup(group.key)"
      >
        <span class="transition-transform" :class="{ 'rotate-90': expanded[group.key] }">&#9654;</span>
        {{ group.title }} ({{ group.items.length }})
      </button>

      <!-- Barras de progresso -->
      <div v-show="expanded[group.key]" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
        <div
          v-for="item in group.items"
          :key="item.key"
          class="flex items-center gap-2 text-xs"
        >
          <!-- Label -->
          <span class="w-24 text-gray-600 truncate">{{ item.label }}</span>

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
    </div>

    <!-- Legenda -->
    <p class="text-[10px] text-gray-400 mt-1">
      % da RDA (Recommended Daily Allowance) para {{ gender === 'MALE' ? 'homem' : 'mulher' }} adulto.
      Sódio e colesterol: alerta quando acima de 100%.
    </p>
  </div>
</template>
