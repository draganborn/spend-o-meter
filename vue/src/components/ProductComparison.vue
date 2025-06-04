<template>
  <div class="product-compare">
    <h2>{{ t.comparisonProduct }}</h2>
    <form @submit.prevent="compare">
      <div v-for="(product, i) in products" :key="i" class="card">
        <button type="button" class="delete-btn" @click="remove(i)">×</button>
        <label>
          {{ t.productField.nameLabel }}
          <input v-model="product.name" type="text" :placeholder="t.productField.namePlaceholder" required>
        </label>
        <label>
          {{ t.productField.priceLabel }}
          <input v-model.number="product.price" type="number" step="0.01" required>
        </label>
        <label>
          {{ t.productField.weightLabel }}
          <input v-model.number="product.weight" type="number" step="0.01" required>
        </label>
      </div>
      <div class="btn-group">
        <button type="button" @click="add">{{ t.addProductBtn }}</button>
        <button type="submit">{{ t.productCompareBtn }}</button>
      </div>
    </form>
    <div v-if="result" class="result-container" v-html="result" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLanguageStore } from '../stores/language'

interface Product {
  name: string
  price: number
  weight: number
}

const products = ref<Product[]>([{ name: '', price: 0, weight: 0 }])
const result = ref('')
const { dictionary: t } = useLanguageStore()

function add() {
  products.value.push({ name: '', price: 0, weight: 0 })
}
function remove(index: number) {
  products.value.splice(index, 1)
}
function compare() {
  const list = products.value.filter(p => p.price > 0 && p.weight > 0)
  if (list.length < 2) {
    alert(t.alerts.notEnoughProducts)
    result.value = ''
    return
  }
  list.sort((a, b) => a.price / a.weight - b.price / b.weight)
  const best = list[0]
  result.value = `${t.result.better}: <strong>${best.name}</strong> (${(best.price / best.weight).toFixed(2)} ${t.result.perUnit})<br><br>`
  for (let i = 1; i < list.length; i++) {
    const diff = (list[i].price / list[i].weight / (best.price / best.weight) - 1) * 100
    result.value += `${list[i].name}: ${t.result.moreExpensive} ${diff.toFixed(1)}%<br>`
  }
}
</script>

<style scoped>
.product-compare {
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

