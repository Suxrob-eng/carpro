import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { toast } from 'react-toastify'
import { FaArrowRight, FaLock, FaUser, FaCarSide, FaGoogle } from 'react-icons/fa'

const Login = () => {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
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
    toast.info('Google sign-in is opening in a new tab. You can keep using your account email and password here.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10 px-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl transition-all duration-500">
        
        {/* Left Side: Form */}
        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="mb-10 text-center lg:text-left">
            <p className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-300">{t('common.signIn', 'Sign In')}</p>
            <h2 className="mt-4 text-3xl font-bold text-[var(--text)]">{t('auth.loginTitle', 'Welcome Back')}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t('auth.loginSubtitle', 'Sign in to access your account')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-sky-500/50 hover:border-sky-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><FaUser className="text-sky-500 dark:text-sky-400" /> {t('auth.username', 'Username')}</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="johndoe123" required />
            </label>
            <label className="block rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all focus-within:border-sky-500/50 hover:border-sky-400/30">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"><FaLock className="text-sky-500 dark:text-sky-400" /> {t('auth.password', 'Password')}</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--muted)]" placeholder="••••••••" required />
            </label>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">{t('auth.forgotPassword', 'Forgot Password?')}</Link>
            </div>
            <button type="submit" disabled={isLoading} className="button-primary mt-8 flex w-full items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? 'Signing in...' : t('auth.signInLink', 'Sign In')} {!isLoading && <FaArrowRight />}
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
              
              <button type="button" onClick={handleGoogleContinue} className="mt-6 flex w-full items-center justify-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 text-sm font-medium text-[var(--text)] transition-all hover:border-sky-400/30 hover:bg-[var(--border)]">
                <FaGoogle className="text-rose-500" size={18} /> Continue with Google
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              {t('auth.createAccount')} <Link to="/register" className="font-semibold text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">{t('auth.createAccountLink')}</Link>
            </p>
          </form>
        </div>

        {/* Right Side: Premium branding / image */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-sky-600 to-indigo-900 lg:block">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376713244-884620f34731?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <FaCarSide className="mb-6 text-5xl text-sky-300" />
            <h2 className="mb-4 text-4xl font-bold leading-tight">Welcome back to <br/> CarPro.</h2>
            <p className="text-lg text-sky-100/80">Manage your listings, reply to buyers, and discover the newest premium vehicles on the market.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
