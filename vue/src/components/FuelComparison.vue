<template>
  <div class="fuel-compare">
    <h2>{{ t.comparisonFuel }}</h2>
    <form @submit.prevent="compare">
      <div v-for="(station, i) in stations" :key="i" class="card">
        <button type="button" class="delete-btn" @click="remove(i)">×</button>
        <label>
          {{ t.stationField.typeLabel }}
          <input v-model="station.name" type="text" required />
        </label>
        <label>
          {{ t.stationField.priceLabel }}
          <input v-model.number="station.price" type="number" step="0.01" required />
        </label>
        <label>
          {{ t.stationField.discountLabel }}
          <select v-model="station.discountType">
            <option value="none">{{ t.stationField.discounts.none }}</option>
            <option value="cashback">{{ t.stationField.discounts.cashback }}</option>
            <option value="fixed">{{ t.stationField.discounts.fixed }}</option>
          </select>
        </label>
        <label v-if="station.discountType === 'cashback'">
          {{ t.stationField.cashbackLabel }}
          <input v-model.number="station.cashback" type="number" step="0.01" />
        </label>
        <label v-if="station.discountType === 'fixed'">
          {{ t.stationField.fixedLabel }}
          <input v-model.number="station.fixed" type="number" step="0.01" />
        </label>
      </div>

      <div class="btn-group">
        <button type="button" @click="add">{{ t.addStationBtn }}</button>
        <button type="submit">{{ t.fuelCompareBtn }}</button>
      </div>
    </form>
    <div v-if="result" class="result-container" v-html="result" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLanguageStore } from '../stores/language'

interface Station {
  name: string
  price: number
  discountType: 'none' | 'cashback' | 'fixed'
  cashback?: number
  fixed?: number
  finalPrice?: number
}

const stations = ref<Station[]>([
  { name: 'Teboil', price: 0, discountType: 'cashback', cashback: 0 },
])
const result = ref('')
const { dictionary: t } = useLanguageStore()

function add() {
  stations.value.push({ name: '', price: 0, discountType: 'none' })
}
function remove(index: number) {
  stations.value.splice(index, 1)
}
function compare() {
  const list = stations.value
    .filter(s => s.price > 0)
    .map(s => {
      let final = s.price
      if (s.discountType === 'cashback') final = s.price * (1 - (s.cashback || 0) / 100)
      if (s.discountType === 'fixed') final = s.price - (s.fixed || 0)
      return { ...s, finalPrice: final }
    })

  if (list.length < 2) {
    alert(t.alerts.notEnoughStations)
    result.value = ''
    return
  }

  list.sort((a, b) => (a.finalPrice ?? Infinity) - (b.finalPrice ?? Infinity))
  const best = list[0]
  result.value = `${t.result.better}: <strong>${best.name}</strong> (${best.finalPrice?.toFixed(2)} ${t.result.perLiter})<br><br>`
  for (let i = 1; i < list.length; i++) {
    const diff = ((list[i].finalPrice! / best.finalPrice!) - 1) * 100
    result.value += `${list[i].name}: ${t.result.moreExpensive} ${diff.toFixed(1)}%<br>`
  }
}
</script>

<style scoped>
.fuel-compare {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
.card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
}
.delete-btn {
  float: right;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
}
.btn-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.result-container {
  background: #e8f5e9;
  border-left: 4px solid #2e7d32;
  padding: 15px;
  margin-top: 20px;
  border-radius: 5px;
}
</style>

