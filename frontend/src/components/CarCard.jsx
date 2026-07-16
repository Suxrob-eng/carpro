import React from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaStar, FaRegStar } from 'react-icons/fa'
import { useLanguage } from '../context/LanguageContext'

const CarCard = ({ car, isFavorite, onToggleFavorite, user }) => {
  const { t } = useLanguage()

  const resolveCarImage = () => {
    const image = car.images?.find((img) => img.is_primary)?.image_url || car.images?.[0]?.image_url || car.image || car.image_url
    if (!image) return '/placeholder-car.svg'
    return image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE || ''}${image}`
  }

  return (
    <article className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_22px_60px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:shadow-[0_30px_80px_rgba(14,116,144,0.16)]">
      <Link to={`/cars/${car.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={resolveCarImage()}
            alt={`${car.brand || car.name || 'Mashina'} ${car.model || ''}`}
            onError={(e) => { e.currentTarget.src = '/placeholder-car.svg' }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--text)] backdrop-blur">
            {car.category_name || t('card.category')}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              onToggleFavorite(car.id)
            }}
            className={`absolute right-4 top-4 rounded-full border border-[var(--border)] p-3 text-lg transition ${user ? 'bg-[var(--card)] hover:scale-105' : 'cursor-not-allowed bg-[var(--card)] opacity-70'}`}
            disabled={!user}
            title={user ? t('card.favorite') : t('card.signInToFavorite')}
          >
            {isFavorite ? <FaHeart className="text-rose-400" /> : <FaRegHeart className="text-slate-200" />}
          </button>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/cars/${car.id}`} className="block text-lg font-semibold text-[var(--text)] transition hover:text-sky-600 dark:hover:text-sky-300">
              {car.name || 'Mashina'} {car.model || ''}
            </Link>
            <p className="mt-1 text-sm text-[var(--muted)]">{car.color || t('card.colorNotSpecified')}</p>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {car.year || t('card.newLabel')}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-300">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <span key={index}>{index < 4 ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-amber-400/70" />}</span>
          ))}
          <span className="ml-2 text-[var(--muted)]">(4.8)</span>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <span>{t('card.startingFrom')}</span>
          <p className="text-xl font-semibold text-[var(--text)]">${Number(car.price || 0).toLocaleString()}</p>
        </div>
      </div>
    </article>
  )
}

export default CarCard
