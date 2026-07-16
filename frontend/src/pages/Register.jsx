import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { toast } from 'react-toastify'
import { FaArrowRight, FaLock, FaUser, FaPhone, FaCarSide, FaGoogle } from 'react-icons/fa'

const Register = () => {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, login, user } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleGoogleContinue = () => {
    if (typeof window !== 'undefined') {
      window.open('https://accounts.google.com/', '_blank', 'noopener,noreferrer')
    }
    toast.info('Google sign-in is opening in a new tab. You can keep using the email sign-up flow inside the app.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await register({ username, email, password, phone_number: phoneNumber })
      await login(username, password)
      toast.success('Registration successful! Welcome!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10 px-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl transition-all duration-500">
        
        {/* Left Side: Premium branding / image */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-900 lg:block">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <FaCarSide className="mb-6 text-5xl text-emerald-300" />
            <h2 className="mb-4 text-4xl font-bold leading-tight">Start your engine. <br/> Join the best car marketplace.</h2>
            <p className="text-lg text-emerald-100/80">List your vehicles, find your dream car, and connect with trusted buyers and sellers globally.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="mb-10 text-center lg:text-left">
            <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-300">{t('common.signUp', 'Sign Up')}</p>
            <h2 className="mt-4 text-3xl font-bold text-[var(--text)]">{t('auth.registerTitle', 'Create Account')}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t('auth.registerSubtitle', 'Join us to buy and sell cars seamlessly')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-emerald-500/50 hover:border-emerald-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><FaUser className="text-emerald-500 dark:text-emerald-400" /> {t('auth.username', 'Username')}</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="johndoe123" required />
            </label>
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-emerald-500/50 hover:border-emerald-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><span className="text-emerald-500 dark:text-emerald-400">@</span> {t('admin.email', 'Email')}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="john@example.com" required />
            </label>
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-emerald-500/50 hover:border-emerald-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><FaPhone className="text-emerald-500 dark:text-emerald-400" /> {t('auth.phone', 'Phone Number')}</span>
              <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="+1234567890" required />
            </label>
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-emerald-500/50 hover:border-emerald-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><FaLock className="text-emerald-500 dark:text-emerald-400" /> {t('auth.password', 'Password')}</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="••••••••" required />
            </label>
            <button type="submit" disabled={isLoading} className="button-primary mt-8 flex w-full items-center justify-center gap-2 !from-emerald-500 !to-teal-600 disabled:opacity-50">
              {isLoading ? 'Processing...' : t('auth.createAccountLink', 'Sign Up')} {!isLoading && <FaArrowRight />}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[var(--surface)] px-4 text-xs uppercase tracking-widest text-[var(--muted)]">OR</span>
                </div>
              </div>
              
              <button type="button" onClick={handleGoogleContinue} className="mt-6 flex w-full items-center justify-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 text-sm font-medium text-[var(--text)] transition-all hover:border-emerald-400/30 hover:bg-[var(--border)]">
                <FaGoogle className="text-rose-500" size={18} /> Continue with Google
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              {t('auth.alreadyJoined')} <Link to="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">{t('auth.signInLink')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
