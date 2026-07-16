import React from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaCar, FaShieldAlt, FaMagic, FaUsers } from 'react-icons/fa'
import { useLanguage } from '../context/LanguageContext'

const Home = () => {
  const { t } = useLanguage()
  const highlights = [
    { icon: <FaCar className="text-2xl text-sky-300" />, title: t('home.highlightsTitle'), description: t('home.highlightsDesc') },
    { icon: <FaUsers className="text-2xl text-violet-300" />, title: t('home.communityTitle'), description: t('home.communityDesc') },
    { icon: <FaShieldAlt className="text-2xl text-emerald-300" />, title: t('home.secureTitle'), description: t('home.secureDesc') }
  ]

  return (
    <div className="space-y-8 pb-8">
      <section className="glass-panel relative overflow-hidden px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.2),_transparent_28%)]" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-200">
              <FaMagic /> {t('home.badge')}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              {t('home.title')}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--muted)]">
              {t('home.description')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/cars" className="button-primary">{t('home.explore')}</Link>
              <Link to="/create-car" className="button-secondary">{t('home.list')}</Link>
            </div>
          </div>

          <div className="panel-card space-y-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">{t('home.liveMarketplace')}</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">{t('home.statsTitle')}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{t('home.statsDescription')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-sm text-[var(--muted)]">{t('home.trustedSellers')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text)]">98%</p>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-sm text-[var(--muted)]">{t('home.responseTime')}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text)]">&lt; 5 min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {highlights.map((item, index) => (
          <div key={index} className="panel-card transition duration-300 hover:-translate-y-1 hover:border-sky-400/20">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {item.icon}
            </div>
            <h3 className="text-xl font-semibold text-[var(--text)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="glass-panel flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Start today</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">{t('home.ctaTitle')}</h3>
        </div>
        <Link to="/cars" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200">
          {t('home.ctaLink')} <FaArrowRight />
        </Link>
      </section>
    </div>
  )
}

export default Home
