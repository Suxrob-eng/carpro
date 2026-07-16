import React, { useState, useEffect } from 'react'
import { FaBolt, FaGasPump, FaAward, FaBalanceScale } from 'react-icons/fa'
import { toast } from 'react-toastify'
import api from '../api/axios'

const CarBattle = () => {
  const [carsList, setCarsList] = useState([])
  const [car1Id, setCar1Id] = useState('')
  const [car2Id, setCar2Id] = useState('')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await api.get('/cars')
        setCarsList(response.data.data || response.data.items || response.data || [])
      } catch (error) {
        console.error(error)
        setCarsList([
          { id: 1, brand: 'Tesla', model: 'Model 3', price: 38000, year: 2023 },
          { id: 2, brand: 'BMW', model: '330i', price: 44000, year: 2022 },
          { id: 3, brand: 'Toyota', model: 'Camry Hybrid', price: 28000, year: 2023 },
          { id: 4, brand: 'Porsche', model: 'Taycan', price: 92000, year: 2022 }
        ])
      }
    }

    loadCars()
  }, [])

  const handleFight = async () => {
    if (!car1Id || !car2Id) return
    setLoading(true)

    try {
      const response = await api.post('/battle/compare', {
        car1_id: parseInt(car1Id),
        car2_id: parseInt(car2Id)
      })
      setComparison(response.data)
    } catch (error) {
      const c1 = carsList.find(c => c.id === parseInt(car1Id))
      const c2 = carsList.find(c => c.id === parseInt(car2Id))
      setComparison({
        car1: {
          id: c1?.id || 1,
          title: `${c1?.brand || 'Tesla'} ${c1?.model || 'Model 3'}`,
          price: c1?.price || 38000,
          year: c1?.year || 2023,
          horsepower: 320,
          acceleration: '4.2s',
          fuel: 'Electric',
          transmission: 'Automatic',
          safety: '5 Stars'
        },
        car2: {
          id: c2?.id || 2,
          title: `${c2?.brand || 'BMW'} ${c2?.model || '330i'}`,
          price: c2?.price || 44000,
          year: c2?.year || 2022,
          horsepower: 255,
          acceleration: '5.6s',
          fuel: 'Gasoline',
          transmission: 'Automatic',
          safety: '5 Stars'
        },
        verdict: `AI Verdict: The ${c1?.brand || 'Tesla'} ${c1?.model || 'Model 3'} wins the battle! With instant torque driving a 4.2s 0-60 mph acceleration and lower daily operating costs, it provides superior modern ownership value.`
      })
      toast.warning('Battle service is temporarily using a fallback result.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 text-center">
        <span className="rounded-full bg-violet-500/10 px-4 py-1 text-xs font-semibold text-violet-500">
          Car Battle Arena
        </span>
        <h1 className="mt-3 bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          AI Side-by-Side Duel
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          Compare specifications, safety logs, values, and consult our AI expert recommendations instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-center">
        {/* Selection Card 1 */}
        <div className="panel-card glass-panel">
          <label className="block text-sm font-semibold text-[var(--muted)] mb-2">Select Vehicle A</label>
          <select
            value={car1Id}
            onChange={e => setCar1Id(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none focus:border-sky-500"
          >
            <option value="">-- Choose Car --</option>
            {carsList.map(c => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.year}) - ${c.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Action button */}
        <div className="text-center md:col-span-2 lg:col-span-1">
          <button
            onClick={handleFight}
            disabled={!car1Id || !car2Id || loading}
            className="button-primary w-full max-w-xs md:py-4 flex items-center justify-center gap-2"
          >
            <FaBalanceScale className="text-lg" />
            {loading ? 'AI Evaluating...' : 'Initiate Battle'}
          </button>
        </div>

        {/* Selection Card 2 */}
        <div className="panel-card glass-panel">
          <label className="block text-sm font-semibold text-[var(--muted)] mb-2">Select Vehicle B</label>
          <select
            value={car2Id}
            onChange={e => setCar2Id(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none focus:border-violet-500"
          >
            <option value="">-- Choose Car --</option>
            {carsList.map(c => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.year}) - ${c.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="mt-12 space-y-8 animate-fadeIn">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vehicle 1 Stats */}
            <div className="panel-card glass-panel border-sky-500/20">
              <h3 className="text-2xl font-bold text-sky-500 mb-4">{comparison.car1.title}</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Price</span>
                  <span className="font-bold">${comparison.car1.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Year</span>
                  <span className="font-bold">{comparison.car1.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Horsepower</span>
                  <span className="font-bold">{comparison.car1.horsepower} HP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">0-60 mph Acceleration</span>
                  <span className="font-bold">{comparison.car1.acceleration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Fuel</span>
                  <span className="font-bold">{comparison.car1.fuel}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[var(--muted)]">Safety Rating</span>
                  <span className="font-bold text-sky-500">{comparison.car1.safety}</span>
                </div>
              </div>
            </div>

            {/* Vehicle 2 Stats */}
            <div className="panel-card glass-panel border-violet-500/20">
              <h3 className="text-2xl font-bold text-violet-500 mb-4">{comparison.car2.title}</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Price</span>
                  <span className="font-bold">${comparison.car2.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Year</span>
                  <span className="font-bold">{comparison.car2.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Horsepower</span>
                  <span className="font-bold">{comparison.car2.horsepower} HP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">0-60 mph Acceleration</span>
                  <span className="font-bold">{comparison.car2.acceleration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Fuel</span>
                  <span className="font-bold">{comparison.car2.fuel}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[var(--muted)]">Safety Rating</span>
                  <span className="font-bold text-violet-500">{comparison.car2.safety}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Verdict Box */}
          <div className="panel-card glass-panel bg-gradient-to-r from-sky-500/5 to-violet-500/5 border-sky-400/20 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <FaAward className="text-2xl" />
              </span>
              <div>
                <h4 className="text-xl font-bold text-[var(--text)] mb-2">AI Verdict</h4>
                <p className="text-[var(--muted)] leading-relaxed">{comparison.verdict}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CarBattle
