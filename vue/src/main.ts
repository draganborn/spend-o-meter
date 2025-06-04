// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import './assets/style.css' // подключим стили позже, если нужно

const app = createApp(App)

app.use(createPinia())
app.mount('#app')

