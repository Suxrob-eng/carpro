import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { format } from 'date-fns'
import { enUS, ru, uz } from 'date-fns/locale'

import enLang from '../locales/en.json'
import uzLang from '../locales/uz.json'
import ruLang from '../locales/ru.json'

const translations = {
  en: enLang,
  uz: uzLang,
  ru: ruLang
}

const dateLocales = { en: enUS, ru: ru, uz: uz }

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search)
    const urlLang = urlParams.get('lang')
    if (['en', 'uz', 'ru'].includes(urlLang)) {
      return urlLang
    }
    
    // Check Cookies
    const cookieLang = Cookies.get('carpro_lang')
    if (['en', 'uz', 'ru'].includes(cookieLang)) {
      return cookieLang
    }

    // Check LocalStorage
    const stored = localStorage.getItem('carpro_lang')
    return ['en', 'uz', 'ru'].includes(stored) ? stored : 'en'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carpro_lang', lang)
      Cookies.set('carpro_lang', lang, { expires: 365 }) // Save to cookies for 1 year
      document.documentElement.lang = lang
    }
  }, [lang])

  const t = useMemo(() => (key, fallbackOrParams = undefined) => {
    const parts = key.split('.')
    let value = translations[lang]
    for (const part of parts) {
      value = value?.[part]
      if (value == null) {
        return typeof fallbackOrParams === 'string' ? fallbackOrParams : `[MISSING_TRANSLATION: ${key}]`
      }
    }

    if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
      return typeof value === 'string'
        ? value.replace(/{{(.*?)}}/g, (_, k) => fallbackOrParams[k.trim()] ?? `{{${k}}}`)
        : value
    }

    return value
  }, [lang])

  const formatDate = (dateString, formatStr = 'PPP') => {
    try {
      const date = new Date(dateString)
      return format(date, formatStr, { locale: dateLocales[lang] })
    } catch (e) {
      return dateString
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
