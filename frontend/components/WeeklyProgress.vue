<!-- ====================================================
  WEEKLY PROGRESS — Progresso semanal
  ====================================================
  Mostra os últimos 7 dias com barras de aderência
  e o streak (dias consecutivos) do usuário.
-->

<script setup lang="ts">
const checkinStore = useCheckinStore()

onMounted(() => {
  checkinStore.fetchWeeklyStats()
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
}

function getBarColor(rate: number): string {
  if (rate >= 80) return '#10b981'
  if (rate >= 50) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="weekly-progress">
    <div class="progress-header">
      <h3>Progresso Semanal</h3>
      <div v-if="checkinStore.streak > 0" class="streak-badge">
        {{ checkinStore.streak }} dia{{ checkinStore.streak > 1 ? 's' : '' }} seguidos
      </div>
    </div>

    <div v-if="checkinStore.weeklyStats?.weeklyStats?.length" class="days-list">
      <div
        v-for="day in checkinStore.weeklyStats.weeklyStats"
        :key="day.date"
        class="day-row"
      >
        <span class="day-label">{{ formatDate(day.date) }}</span>
        <div class="day-bar-container">
          <div
            class="day-bar"
            :style="{ width: `${day.adherenceRate}%`, background: getBarColor(day.adherenceRate) }"
          ></div>
        </div>
        <span class="day-rate">{{ day.adherenceRate }}%</span>
      </div>

      <div class="average-row">
        <span>Média:</span>
        <strong>{{ checkinStore.weeklyStats.averageAdherence }}%</strong>
      </div>
    </div>

    <div v-else class="empty-progress">
      <p>Nenhum check-in registrado ainda. Comece hoje!</p>
    </div>
  </div>
</template>

<style scoped>
.weekly-progress {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.progress-header h3 { font-size: 1rem; margin: 0; }

.streak-badge {
  padding: 0.25rem 0.75rem;
  background: #f0fdf4;
  color: #059669;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}

.days-list { display: flex; flex-direction: column; gap: 0.5rem; }

.day-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.day-label {
  width: 70px;
  font-size: 0.8rem;
  color: #666;
  text-transform: capitalize;
}

.day-bar-container {
  flex: 1;
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.day-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.day-rate {
  width: 40px;
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

.average-row {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
  color: #666;
}

.empty-progress {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 0.9rem;
}
</style>
