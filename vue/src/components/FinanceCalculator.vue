<template>
  <div class="calculator">
    <h1>{{ t.moneyTitle }}</h1>
    <form @submit.prevent="calculate">
      <label>
        {{ t.allMoney }}:
        <input type="number" step="0.01" v-model.number="allMoney" required />
      </label>

      <h3>{{ t.paymentsTitle }}</h3>
      <div v-for="(payment, index) in payments" :key="index" class="payment-entry">
        <input
          type="text"
          :placeholder="t.paymentField.namePlaceholder"
          v-model="payment.name"
          required
        />
        <input
          type="number"
          step="0.01"
          :placeholder="t.paymentField.amountPlaceholder"
          v-model.number="payment.amount"
          required
        />
        <button type="button" @click="removePayment(index)" :title="t.paymentField.deleteTitle">−</button>
      </div>

      <button type="button" @click="addPayment">{{ t.addPayment }}</button>

      <label>
        {{ t.nextDate }}:
        <input type="date" v-model="nextPayDate" required />
      </label>

      <button type="submit">{{ t.submitCalc }}</button>
    </form>

    <div v-if="result" class="result">
      <p>{{ result }}</p>
    </div>

    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useLanguageStore } from '../stores/language'

Chart.register(...registerables)

interface Payment {
  name: string
  amount: number
}

const allMoney = ref(0)
const nextPayDate = ref('')
const payments = ref<Payment[]>([ { name: '', amount: 0 } ])
const result = ref('')
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const langStore = useLanguageStore()
const t = langStore.dictionary

function addPayment() {
  payments.value.push({ name: '', amount: 0 })
}

function removePayment(index: number) {
  payments.value.splice(index, 1)
}

function calculate() {
  const totalPayments = payments.value.reduce((sum, p) => sum + p.amount, 0)
  const freeMoney = allMoney.value - totalPayments
  const today = new Date()
  const payDate = new Date(nextPayDate.value)
  const daysLeft = Math.max(1, Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const perDay = freeMoney > 0 ? Math.floor(freeMoney / daysLeft) : 0

  if (freeMoney < 0) {
    result.value = `${t.financeResult.needReturn}: ${-freeMoney}`
  } else {
    result.value = `\n${t.financeResult.freeMoney}: ${freeMoney}\n${t.financeResult.dailySpend}: ${perDay} (${daysLeft} ${t.financeResult.daysLeft})`
  }

  drawChart()
}

function drawChart() {
  if (!chartCanvas.value) return
  if (chart) chart.destroy()
  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: payments.value.map(p => p.name || t.chart.unnamed),
      datasets: [
        {
          label: t.chart.label,
          data: payments.value.map(p => p.amount),
          backgroundColor: '#007bff',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  })
}

onMounted(() => {
  calculate()
})
</script>

<style scoped>
.calculator {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}
.payment-entry {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.result {
  background: #e9f7ef;
  padding: 10px;
  margin-top: 20px;
  border-left: 5px solid #28a745;
  color: #155724;
}
</style>

