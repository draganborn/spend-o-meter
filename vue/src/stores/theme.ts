// src/stores/theme.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_KEY = 'appTheme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light'
  )

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, theme.value)
  }

  return { theme, toggle }
})

