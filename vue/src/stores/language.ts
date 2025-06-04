// src/stores/language.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dictionary } from '../i18n/lang'

const LANG_KEY = 'appLang'

type LangCode = 'ru' | 'en'

export const useLanguageStore = defineStore('language', () => {
  const lang = ref<LangCode>((localStorage.getItem(LANG_KEY) as LangCode) || 'ru')

  function toggle() {
    lang.value = lang.value === 'ru' ? 'en' : 'ru'
    localStorage.setItem(LANG_KEY, lang.value)
  }

  const dictionaryRef = computed(() => dictionary[lang.value])

  return {
    lang,
    toggle,
    dictionary: dictionaryRef,
  }
})

