import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa'
import { forgotPassword } from '../api/auth'
import { useLanguage } from '../context/LanguageContext'

const ForgotPassword = () => {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error(t('auth.emailRequired'))
      return
    }

    setIsLoading(true)
    try {
      await forgotPassword(email)
      toast.success(t('auth.emailSent'))
      setEmail('')
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.emailSent'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl backdrop-blur-xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-500 dark:text-sky-300">
          <FaArrowLeft /> {t('auth.backToLogin')}
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
            <FaLock size={24} />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-[var(--text)]">{t('auth.forgotPasswordTitle')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t('auth.forgotPasswordSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-sky-500/50 hover:border-sky-400/30">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              <FaEnvelope className="text-sky-500 dark:text-sky-400" /> {t('auth.email')}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="button-primary mt-2 flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
