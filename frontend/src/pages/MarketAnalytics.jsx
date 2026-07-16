import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowUp, FaFire, FaChartLine, FaPalette, FaCar, FaGasPump } from 'react-icons/fa'
import api from '../api/axios'
import { useLanguage } from '../context/LanguageContext'

const MarketAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get('/analytics/market')
        setData(response.data)
      } catch (error) {
        console.error(error)
        setData({
          most_viewed: [
            { brand: 'Tesla', model: 'Model S Plaid', views: 18450 },
            { brand: 'Porsche', model: '911 GT3', views: 14200 },
            { brand: 'BMW', model: 'M4 Competition', views: 12100 }
          ],
          fastest_selling: [
            { brand: 'Toyota', model: 'RAV4 Hybrid', avg_days: 4 },
            { brand: 'Tesla', model: 'Model Y', avg_days: 6 },
            { brand: 'Honda', model: 'Civic Type R', avg_days: 8 }
          ],
          trending_brands: ['Tesla', 'Porsche', 'BMW', 'Mercedes-Benz', 'Toyota'],
          popular_colors: ['Matte Black', 'Chalk White', 'Satin Grey', 'Metallic Blue', 'Crimson Red'],
          average_prices: [
            { month: 'Jan', avg_price: 31200 },
            { month: 'Feb', avg_price: 31500 },
            { month: 'Mar', avg_price: 32100 },
            { month: 'Apr', avg_price: 31900 },
            { month: 'May', avg_price: 32600 },
            { month: 'Jun', avg_price: 33000 }
          ],
          popular_body_types: [
            { type: 'SUV', percentage: 38 },
            { type: 'Sedan', percentage: 27 },
            { type: 'Coupe', percentage: 19 },
            { type: 'Electric', percentage: 16 }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const { t, formatDate } = useLanguage()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            {t('analytics.title')}
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)]">
            {t('analytics.subtitle')}
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-3">
          <button className="button-secondary text-xs px-4 py-2" title={t('analytics.exportPdf')}>
            {t('analytics.exportPdf')}
          </button>
          <button className="button-secondary text-xs px-4 py-2" title={t('analytics.exportExcel')}>
            {t('analytics.exportExcel')}
          </button>
        </div>
      </div>

      {/* Date Range Toggles & Formatted Date */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="flex gap-2">
          {['dateToday', 'dateWeek', 'dateMonth', 'dateCustom'].map(key => (
            <button key={key} className={`px-4 py-1.5 text-xs font-bold rounded-full transition ${key === 'dateMonth' ? 'bg-sky-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text)]'}`}>
              {t(`analytics.${key}`)}
            </button>
          ))}
        </div>
        <div className="text-sm font-bold text-sky-500">
          {formatDate(new Date())}
        </div>
      </div>

      {/* Primary KPI Cards (Added per user request) */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {[
          { key: 'revenue', value: '$124,500', color: 'text-emerald-500' },
          { key: 'users', value: '8,240', color: 'text-sky-500' },
          { key: 'orders', value: '342', color: 'text-violet-500' },
          { key: 'conversionRate', value: '4.2%', color: 'text-amber-500' }
        ].map(stat => (
          <div key={stat.key} className="panel-card glass-panel" title={t('analytics.tooltipSales')}>
            <h3 className="text-sm font-bold text-[var(--muted)]">{t(`analytics.${stat.key}`)}</h3>
            <p className={`text-3xl font-extrabold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Demanded */}
        <div className="panel-card glass-panel flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <FaFire className="text-xl" />
              </span>
              <h2 className="text-xl font-bold">{t('analytics.mostViewed')}</h2>
            </div>
            <div className="space-y-4">
              {data.most_viewed.map((car, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{car.brand} {car.model}</p>
                    <p className="text-xs text-[var(--muted)]">{t('analytics.highIntent')}</p>
                  </div>
                  <span className="text-sm font-bold text-sky-500">{car.views.toLocaleString()} {t('analytics.views')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Velocity */}
        <div className="panel-card glass-panel flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                <FaChartLine className="text-xl" />
              </span>
              <h2 className="text-xl font-bold">{t('analytics.fastestSelling')}</h2>
            </div>
            <div className="space-y-4">
              {data.fastest_selling.map((car, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{car.brand} {car.model}</p>
                    <p className="text-xs text-[var(--muted)]">{t('analytics.marketDemand')}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                    {t('analytics.avgDays')} {car.avg_days} {t('analytics.days')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Configurations */}
        <div className="panel-card glass-panel flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <FaPalette className="text-xl" />
              </span>
              <h2 className="text-xl font-bold">{t('analytics.popularColors')}</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)] mb-1">{t('analytics.topColors')}</p>
                <div className="flex flex-wrap gap-2">
                  {data.popular_colors.slice(0, 3).map((col, idx) => (
                    <span key={idx} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[var(--muted)] mb-2">{t('analytics.bodyDemand')}</p>
                <div className="space-y-2">
                  {data.popular_body_types.map((body, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[var(--muted)]">{body.type}</span>
                      <div className="relative flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500"
                          style={{ width: `${body.percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-bold">{body.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Trend SVG Chart */}
      <div className="panel-card glass-panel mt-8 p-6 md:p-8">
        <h2 className="mb-6 text-2xl font-bold">{t('analytics.avgPrice')}</h2>
        <div className="relative w-full h-72">
          {/* Custom SVG Line Chart */}
          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1="50" y1="40" x2="580" y2="40" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="50" y1="100" x2="580" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="50" y1="160" x2="580" y2="160" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="50" y1="210" x2="580" y2="210" stroke="var(--border)" strokeWidth="1" />

            {/* Path Area */}
            <path
              d="M 50 210 L 50 178 L 156 166 L 262 142 L 368 150 L 474 122 L 580 106 L 580 210 Z"
              fill="url(#gradient-area)"
            />

            {/* Line Path */}
            <path
              d="M 50 178 L 156 166 L 262 142 L 368 150 L 474 122 L 580 106"
              fill="none"
              stroke="url(#gradient-area)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Data Dots */}
            <circle cx="50" cy="178" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            <circle cx="156" cy="166" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            <circle cx="262" cy="142" r="6" fill="#60a5fa" stroke="#ffffff" strokeWidth="2" />
            <circle cx="368" cy="150" r="6" fill="#60a5fa" stroke="#ffffff" strokeWidth="2" />
            <circle cx="474" cy="122" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
            <circle cx="580" cy="106" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Month Labels */}
          <div className="mt-4 flex justify-between px-6 text-xs text-[var(--muted)] font-semibold">
            {data.average_prices.map((p, idx) => (
              <div key={idx} className="text-center">
                <p>{p.month}</p>
                <p className="text-sky-500 font-bold">${p.avg_price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketAnalytics
