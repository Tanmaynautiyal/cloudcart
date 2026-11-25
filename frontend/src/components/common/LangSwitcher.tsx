import React, { useState } from 'react'
import { Globe } from 'lucide-react'
import { Language } from '../../types'

export const LangSwitcher: React.FC = () => {
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('cloudcart_language') as Language) || 'en'
  )

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'hi' : 'en'
    setLang(next)
    localStorage.setItem('cloudcart_language', next)
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      title="Change language (English / हिंदी)"
    >
      <Globe size={14} />
      <span>{lang === 'en' ? 'EN' : 'HI'}</span>
    </button>
  )
}

export default LangSwitcher
