import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { FaCar, FaMoon, FaSun, FaBell, FaCommentAlt } from 'react-icons/fa'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true
  })
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState([
    { id: 1, title: 'Price Drop Alert!', message: 'Porsche 911 GT3 decreased by $3,000.', time: '10 mins ago' },
    { id: 2, title: 'New Matching Listing', message: 'A new Tesla Model S was listed in your area.', time: '2 hours ago' }
  ])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[var(--text)]">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-sky-400 to-violet-500 shadow-[0_8px_24px_rgba(56,189,248,0.25)]">
            <FaCar className="text-slate-950" />
          </span>
          <span>CarPro</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-1 bg-[var(--card)] rounded-full px-2 py-1 border border-[var(--border)]">
            <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs rounded-full font-bold transition ${lang === 'en' ? 'bg-sky-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>🇺🇸 EN</button>
            <span className="text-[var(--border)]">|</span>
            <button onClick={() => setLang('uz')} className={`px-2 py-1 text-xs rounded-full font-bold transition ${lang === 'uz' ? 'bg-sky-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>🇺🇿 UZ</button>
            <span className="text-[var(--border)]">|</span>
            <button onClick={() => setLang('ru')} className={`px-2 py-1 text-xs rounded-full font-bold transition ${lang === 'ru' ? 'bg-sky-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>🇷🇺 RU</button>
          </div>
          <Link to="/cars" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">{t('nav.browse')}</Link>
          <Link to="/analytics" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">Analytics</Link>
          <Link to="/battle" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">Battle</Link>
          <Link to="/map" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">Map Search</Link>
          <Link to="/community" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">Community</Link>
          
          {user ? (
            <>
              <Link to="/garage" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">Garage</Link>
              <Link to="/chat" className="rounded-full p-2.5 transition hover:bg-[var(--card)] hover:text-[var(--text)]" aria-label="Messages">
                <FaCommentAlt />
              </Link>
              <Link to="/create-car" className="rounded-full bg-sky-500/15 px-4 py-2 text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-200">{t('nav.listCar')}</Link>
              {isAdmin && <Link to="/admin" className="rounded-full bg-violet-500/15 px-4 py-2 text-violet-700 transition hover:bg-violet-500/25 dark:text-violet-200">{t('nav.admin')}</Link>}
              
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative rounded-full border border-[var(--border)] bg-[var(--card)] p-2.5 text-[var(--text)] transition hover:border-sky-400/30"
                  aria-label="Notifications"
                >
                  <FaBell />
                  {notifs.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-2.5 w-2.5 rounded-full bg-sky-500"></span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl z-50 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">Notifications</h4>
                      <button onClick={() => setNotifs([])} className="text-[10px] text-sky-500 font-bold hover:underline">Clear all</button>
                    </div>
                    <div className="space-y-3">
                      {notifs.length === 0 ? (
                        <p className="text-xs text-[var(--muted)] text-center py-2">No new notifications.</p>
                      ) : (
                        notifs.map(n => (
                          <div key={n.id} className="text-xs border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                            <p className="font-bold text-[var(--text)]">{n.title}</p>
                            <p className="text-[var(--muted)] mt-0.5">{n.message}</p>
                            <p className="text-[9px] text-[var(--muted)] mt-1">{n.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/profile" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">{user.username}</Link>
              <button onClick={handleLogout} className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">{t('nav.signOut')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 transition hover:bg-[var(--card)] hover:text-[var(--text)]">{t('nav.signIn')}</Link>
              <Link to="/register" className="button-primary px-4 py-2">{t('nav.joinNow')}</Link>
            </>
          )}
          <button onClick={() => setIsDark(!isDark)} className="rounded-full border border-[var(--border)] bg-[var(--card)] p-2.5 text-[var(--text)] transition hover:border-sky-400/30 hover:bg-[var(--card)]" aria-label="Toggle theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
