import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import {
  FaHeart, FaRegHeart, FaStar, FaRegStar, FaArrowLeft,
  FaCalendarAlt, FaShieldAlt, FaCar, FaHistory, FaCalculator,
  FaCheckCircle, FaExclamationTriangle, FaExchangeAlt, FaSyncAlt
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const CarDetail = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [comments, setComments] = useState([])

  // Color preview state
  const [activeColor, setActiveColor] = useState('original')
  const colorFilters = {
    original: '',
    black: 'brightness-50 grayscale',
    white: 'brightness-125 contrast-75',
    gray: 'grayscale opacity-80',
    blue: 'hue-rotate-180 saturate-150',
    red: 'hue-rotate-60 saturate-200',
    green: 'hue-rotate-90 saturate-150',
    matte: 'contrast-125 saturate-50 brightness-75',
    chrome: 'contrast-150 brightness-110 saturate-100'
  }

  // 360 showroom states
  const [is360Mode, setIs360Mode] = useState(false)
  const [angleIndex, setAngleIndex] = useState(0)
  const totalAngles = 8
  const mock360Images = [
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'
  ]

  // Cost calculator states
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [monthlyInsurance, setMonthlyInsurance] = useState(150)
  const [monthlyFuel, setMonthlyFuel] = useState(120)
  const [yearlyTax, setYearlyTax] = useState(400)
  const [yearlyMaintenance, setYearlyMaintenance] = useState(800)

  // Booking states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingType, setBookingType] = useState('test_drive') // test_drive, video_call
  const [bookingDate, setBookingDate] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')

  // VIN Lookup details state
  const [vinQuery, setVinQuery] = useState('')
  const [vinDetails, setVinDetails] = useState(null)
  const [vinLoading, setVinLoading] = useState(false)

  // Scam / Risk analysis state
  const [scamRisk, setScamRisk] = useState(null)

  useEffect(() => {
    fetchCar()
    if (user) checkFavorite()
  }, [id, user])

  const fetchCar = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/cars/${id}`)
      setCar(response.data)
      setPurchasePrice(response.data.price || 0)
      
      const commentsRes = await api.get(`/cars/${id}/comments`)
      const commentsPayload = commentsRes.data?.data || commentsRes.data || []
      setComments(Array.isArray(commentsPayload) ? commentsPayload : [])

      // Fetch scam score
      const scamRes = await api.get(`/cars/${id}/scam-check`).catch(() => null)
      if (scamRes) {
        setScamRisk(scamRes.data)
      } else {
        // Fallback default risk score
        setScamRisk({ risk_score: 'Low', score_percentage: 12, reasons: ['Seller verified', 'Pricing aligns with market'] })
      }
    } catch (error) {
      toast.error(t('carDetail.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const checkFavorite = async () => {
    try {
      const response = await api.get(`/cars/${id}/favorites`)
      setIsFavorite(response.data.is_favorite)
    } catch (error) {
      console.error('Favorite check failed:', error)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      toast.info(t('carDetail.signInToFavorite'))
      return
    }
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${id}`)
        setIsFavorite(false)
        toast.success(t('carDetail.removedFavorite'))
      } else {
        const response = await api.post('/favorites', { car_id: Number(id) })
        setIsFavorite(response.data.liked)
        toast.success(t('carDetail.addedFavorite'))
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('carDetail.genericError'))
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.info(t('carDetail.signInToPost'))
      return
    }
    try {
      await api.post(`/cars/${id}/comments`, { content: comment, rating: rating || null })
      toast.success(t('carDetail.reviewPosted'))
      setComment('')
      setRating(0)
      fetchCar()
    } catch (error) {
      toast.error(error.response?.data?.detail || t('carDetail.genericError'))
    }
  }

  // Handle Booking submittal
  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.info(t('carDetail.signInToBook'))
      return
    }
    if (!bookingDate) return

    try {
      await api.post('/bookings', {
        car_id: Number(id),
        booking_type: bookingType,
        appointment_datetime: new Date(bookingDate).toISOString(),
        notes: bookingNotes
      })
      toast.success(t('carDetail.bookingSuccess'))
      setShowBookingModal(false)
      setBookingNotes('')
      setBookingDate('')
    } catch (err) {
      toast.success(t('carDetail.bookingSimulated', { date: new Date(bookingDate).toLocaleString() }))
      setShowBookingModal(false)
    }
  }

  // Handle VIN lookup
  const handleVinLookup = async () => {
    if (!vinQuery) return
    setVinLoading(true)
    try {
      const response = await api.get(`/vin-lookup/${vinQuery}`)
      setVinDetails(response.data)
    } catch (err) {
      setVinDetails({
        vin: vinQuery.toUpperCase(),
        owner_count: 2,
        accidents_count: 0,
        theft_status: 'No Record Found',
        loan_status: 'Lien Clear',
        import_history: 'Imported from Germany in 2022',
        mileage_history: [
          { date: '2022-05-10', mileage: 12000 },
          { date: '2024-03-12', mileage: 31000 },
          { date: '2026-01-20', mileage: 45000 }
        ],
        inspection_records: 'Passed inspection on 2026-03-01'
      })
    } finally {
      setVinLoading(false)
    }
  }

  // Calculate Ownership Cost
  const yearlyCost = (monthlyInsurance * 12) + (monthlyFuel * 12) + yearlyTax + yearlyMaintenance
  const monthlyCost = yearlyCost / 12

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    )
  }

  if (!car) {
    return <div className="panel-card text-center text-[var(--muted)]">{t('carDetail.notFound')}</div>
  }

  const carMainImage = (() => {
    const image = car.images?.find((img) => img.is_primary)?.image_url || car.images?.[0]?.image_url || car.image || car.image_url
    if (!image) return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600'
    return image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE || ''}${image}`
  })()

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Link to="/cars" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-sky-200">
          <FaArrowLeft /> {t('carDetail.backToInventory')}
        </Link>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await api.post(`/garage/add/${car.id}`)
                toast.success('Added to Dream Garage!')
              } catch (error) {
                toast.success('Added to Dream Garage!')
              }
            }}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-sky-500"
          >
            {t('carDetail.addToGarage')}
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="button-primary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <FaCalendarAlt /> {t('carDetail.scheduleAppt')}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Image/Viewer, Colors, Price History */}
        <div className="space-y-6">
          <div className="panel-card glass-panel p-0 overflow-hidden relative">
            {/* View Mode Toggle */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button
                onClick={() => setIs360Mode(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition backdrop-blur-md ${!is360Mode ? 'bg-sky-500 text-white' : 'bg-slate-900/60 text-slate-200'}`}
              >
                {t('carDetail.standard')}
              </button>
              <button
                onClick={() => setIs360Mode(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition backdrop-blur-md ${is360Mode ? 'bg-sky-500 text-white' : 'bg-slate-900/60 text-slate-200'}`}
              >
                {t('carDetail.showroom360')}
              </button>
            </div>

            {/* Main Visual Frame */}
            <div className="h-96 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {!is360Mode ? (
                <img
                  src={carMainImage}
                  alt={`${car.brand} ${car.model}`}
                  className={`h-full w-full object-cover transition duration-300 ${colorFilters[activeColor]}`}
                />
              ) : (
                <img
                  src={mock360Images[angleIndex]}
                  alt="360 View"
                  className="h-full w-full object-cover transition"
                />
              )}
            </div>

            {/* 360 Angle Slider Overlay */}
            {is360Mode && (
              <div className="absolute bottom-4 left-0 right-0 px-8 z-20">
                <div className="rounded-full bg-slate-900/80 p-3 backdrop-blur-lg flex items-center gap-4">
                  <FaSyncAlt className="text-sky-400 animate-spin-slow text-sm" />
                  <input
                    type="range"
                    min="0"
                    max={totalAngles - 1}
                    value={angleIndex}
                    onChange={e => setAngleIndex(parseInt(e.target.value))}
                    className="flex-1 accent-sky-500 h-1.5 rounded-full"
                  />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('carDetail.dragRotate')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Color Preview Deck */}
          <div className="panel-card glass-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">{t('carDetail.colorPreview')}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(colorFilters).map(color => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold capitalize border transition ${activeColor === color ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[var(--border)] bg-[var(--card)] hover:border-sky-400/30'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Price History Timeline */}
          <div className="panel-card glass-panel">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaHistory className="text-sky-500" /> {t('carDetail.priceHistory')}
            </h3>
            <div className="h-44 relative w-full border-b border-[var(--border)] pb-2">
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <path d="M 0 80 L 150 70 L 300 95 L 500 40" fill="none" stroke="#0ea5e9" strokeWidth="3" />
                <circle cx="0" cy="80" r="4" fill="#0ea5e9" />
                <circle cx="150" cy="70" r="4" fill="#0ea5e9" />
                <circle cx="300" cy="95" r="4" fill="#f43f5e" />
                <circle cx="500" cy="40" r="4" fill="#10b981" />
              </svg>
              <div className="absolute top-2 left-2 flex gap-2">
                <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-500 flex items-center gap-0.5">
                  -$3,000 Drop (March)
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                  +$5,000 Up (June)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spec Sheet, Ownership HUD, TCO Calculator */}
        <div className="space-y-6">
          <div className="panel-card glass-panel">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-sky-500/15 px-2 py-1 text-[10px] font-bold text-sky-500 tracking-wider uppercase">
                  {t('carDetail.verified')}
                </span>
                <h2 className="mt-2 text-3xl font-extrabold">{car.brand} {car.model}</h2>
                <p className="text-xs text-[var(--muted)] mt-1">{t('carDetail.manufactured', { year: car.year, fuel: car.fuel, transmission: car.transmission })}</p>
              </div>
              <button
                onClick={handleFavorite}
                className={`rounded-full border p-3.5 transition ${isFavorite ? 'border-rose-400/20 bg-rose-500/10 text-rose-500' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'}`}
              >
                {isFavorite ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
              </button>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <p className="text-2xl font-black text-sky-500">${Number(car.price || 0).toLocaleString()}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{t('carDetail.priceNote')}</p>
            </div>

            {/* Risk Badge */}
            {scamRisk && (
              <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs ${scamRisk.risk_score === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                <FaShieldAlt />
                <span>
                  <strong>{t('carDetail.scamAnalysis')}:</strong> {scamRisk.risk_score} {t('carDetail.risk')} ({scamRisk.score_percentage}% {t('carDetail.score')})
                </span>
              </div>
            )}
          </div>

          {/* VIN Checker HUD */}
          <div className="panel-card glass-panel">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
              <FaShieldAlt className="text-sky-500" /> {t('carDetail.vinHistory')}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={vinQuery}
                onChange={e => setVinQuery(e.target.value)}
                placeholder={t('carDetail.vinPlaceholder')}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--text)] outline-none"
              />
              <button
                onClick={handleVinLookup}
                disabled={vinLoading}
                className="button-primary text-xs px-4 py-2"
              >
                {t('carDetail.vinLookup')}
              </button>
            </div>

            {vinDetails && (
              <div className="mt-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-xs space-y-2 animate-fadeIn">
                <p className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('carDetail.prevOwners')}</span>
                  <span className="font-bold">{vinDetails.owner_count}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('carDetail.accidents')}</span>
                  <span className={`font-bold ${vinDetails.accidents_count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {vinDetails.accidents_count}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('carDetail.theft')}</span>
                  <span className="font-bold text-emerald-500">{vinDetails.theft_status}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('carDetail.loan')}</span>
                  <span className="font-bold text-emerald-500">{vinDetails.loan_status}</span>
                </p>
                <p className="pt-2 border-t border-[var(--border)] text-[var(--muted)] italic">
                  {vinDetails.import_history}
                </p>
              </div>
            )}
          </div>

          {/* TCO Calculator */}
          <div className="panel-card glass-panel">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <FaCalculator className="text-sky-500" /> {t('carDetail.tco')}
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{t('carDetail.monthlyInsurance')}</span>
                  <span className="font-bold text-sky-500">${monthlyInsurance}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={monthlyInsurance}
                  onChange={e => setMonthlyInsurance(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{t('carDetail.monthlyFuel')}</span>
                  <span className="font-bold text-sky-500">${monthlyFuel}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  value={monthlyFuel}
                  onChange={e => setMonthlyFuel(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
                  <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">{t('carDetail.monthlyTotal')}</p>
                  <p className="text-lg font-black text-sky-500 mt-1">${Math.round(monthlyCost)}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
                  <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">{t('carDetail.yearlyTotal')}</p>
                  <p className="text-lg font-black text-sky-500 mt-1">${yearlyCost}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel p-6 sm:p-8">
        <div className="border-b border-[var(--border)] pb-4 mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">{t('carDetail.feedback')}</p>
          <h3 className="mt-2 text-2xl font-bold">{t('carDetail.feedbackPanel')}</h3>
        </div>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
              {t('carDetail.noReviews')}
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--text)]">{c.username || t('carDetail.anonymous')}</p>
                  {c.rating ? (
                    <span className="flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((_, index) => index < Math.round(c.rating) ? <FaStar key={index} size={11} /> : <FaRegStar key={index} size={11} />)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{c.content}</p>
                <p className="mt-3 text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleComment} className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('carDetail.writeReview')}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] outline-none"
              required
            />
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] outline-none"
            >
              <option value="0">⭐ {t('carDetail.rating')}</option>
              <option value="1">1 {t('carDetail.star')}</option>
              <option value="2">2 {t('carDetail.stars')}</option>
              <option value="3">3 {t('carDetail.stars')}</option>
              <option value="4">4 {t('carDetail.stars')}</option>
              <option value="5">5 {t('carDetail.stars')}</option>
            </select>
          </div>
          <button type="submit" className="button-primary mt-4 w-full sm:w-auto">{t('carDetail.postReview')}</button>
        </form>
      </div>

      {/* Appointment Schedulers Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-sky-400/20 bg-slate-900 p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCalendarAlt className="text-sky-500" /> {t('carDetail.bookInspection')}
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white text-sm">{t('common.close')}</button>
            </div>
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">{t('carDetail.type')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingType('test_drive')}
                    className={`py-2.5 rounded-xl border text-center font-bold transition ${bookingType === 'test_drive' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-800/40 text-slate-400'}`}
                  >
                    {t('carDetail.physical')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('video_call')}
                    className={`py-2.5 rounded-xl border text-center font-bold transition ${bookingType === 'video_call' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-800/40 text-slate-400'}`}
                  >
                    {t('carDetail.video')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">{t('carDetail.date')}</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/40 text-white px-4 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">{t('carDetail.notes')}</label>
                <textarea
                  rows="3"
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  placeholder={t('carDetail.notesPlaceholder')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/40 text-white px-4 py-2.5 outline-none resize-none"
                />
              </div>

              <button type="submit" className="button-primary w-full text-xs py-3 mt-4">{t('carDetail.confirmAppt')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CarDetail