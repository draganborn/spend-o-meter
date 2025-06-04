<template>
  <div :class="['app-container', theme]">
    <nav class="nav">
      <div>
        <button :class="{ active: activeTab === 'finance' }" @click="activeTab = 'finance'">
          {{ t.navMoney }}
        </button>
        <button :class="{ active: activeTab === 'product' }" @click="activeTab = 'product'">
          {{ t.navProduct }}
        </button>
        <button :class="{ active: activeTab === 'fuel' }" @click="activeTab = 'fuel'">
          {{ t.navFuel }}
        </button>
      </div>
      <div>
        <button @click="toggleTheme">🌓</button>
        <button @click="toggleLanguage">🌐</button>
      </div>
    </nav>

    <main>
      <FinanceCalculator v-if="activeTab === 'finance'" />
      <ProductComparison v-if="activeTab === 'product'" />
      <FuelComparison v-if="activeTab === 'fuel'" />
    </main>

    <footer class="footer">
      <div class="footer-elements">
        <a href="https://etherscan.io/address/0x2cC359a7f7e2a21047Ab3D6e20a6ECEF89D6E80d" target="_blank">
          <button style="background-color: #6a06a7">donate ETH</button>
        </a>
        <p>&copy; {{ new Date().getFullYear() }} Spend-O-Meter</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FinanceCalculator from './views/FinanceCalculator.vue'
import ProductComparison from './views/ProductComparison.vue'
import FuelComparison from './views/FuelComparison.vue'
import { useThemeStore } from './stores/theme'
import { useLanguageStore } from './stores/language'

const activeTab = ref<'finance' | 'product' | 'fuel'>('finance')
const themeStore = useThemeStore()
const langStore = useLanguageStore()

const toggleTheme = () => themeStore.toggle()
const toggleLanguage = () => langStore.toggle()
const theme = computed(() => themeStore.theme)
const t = computed(() => langStore.dictionary)
</script>

<style scoped>
.app-container.light {
  background: #f4f7fa;
  color: #333;
}
.app-container.dark {
  background: #1e1e1e;
  color: #f1f1f1;
}
.nav, .footer {
  display: flex;
  justify-content: center;
  background-color: #333;
  padding: 10px;
  flex-wrap: wrap;
  gap: 1rem;
  color: white;
  flex-direction: column;
  align-items: center;
}
.nav div, .footer-elements {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 760px;
}
.nav button.active,
.nav button:hover {
  background-color: #007bff;
  color: white;
}
.nav button {
  background-color: #555;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 0 5px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
}
</style>

