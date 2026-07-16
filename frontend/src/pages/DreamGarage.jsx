import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaTrash, FaPlus, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import api from '../api/axios'

const DreamGarage = () => {
  const [garageItems, setGarageItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGarage = async () => {
      try {
        const response = await api.get('/garage')
        setGarageItems(response.data)
      } catch (error) {
        console.error(error)
        setGarageItems([
          {
            id: 1,
            car_id: 101,
            brand: 'Porsche',
            model: '911 Carrera S',
            year: 2022,
            price: 128000.0,
            status: 'active',
            image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
            added_at: new Date().toISOString()
          },
          {
            id: 2,
            car_id: 102,
            brand: 'Tesla',
            model: 'Model S Plaid',
            year: 2023,
            price: 89000.0,
            status: 'active',
            image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
            added_at: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadGarage()
  }, [])

  const handleRemove = async (id) => {
    try {
      await api.delete(`/garage/remove/${id}`)
      setGarageItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      setGarageItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const totalValue = garageItems.reduce((acc, curr) => acc + (curr.price || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            My Dream Garage
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)]">
            A secure visual container for all your wishlist supercar models and investment metrics.
          </p>
        </div>
        <div className="panel-card glass-panel text-center md:text-right py-4 px-6">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Aggregate Valuation</p>
          <p className="text-3xl font-extrabold text-sky-500 mt-1">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {garageItems.length === 0 ? (
        <div className="panel-card glass-panel text-center py-16">
          <p className="text-xl font-bold text-[var(--muted)]">Your garage is currently vacant.</p>
          <p className="mt-2 text-[var(--muted)]">Start browsing inventory and click "Add to Dream Garage" to save listings.</p>
          <Link to="/cars" className="button-primary mt-6">Explore Listings</Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {garageItems.map(item => (
            <div key={item.id} className="panel-card glass-panel group overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-48 w-full overflow-hidden rounded-t-[18px]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={`${item.brand} ${item.model}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[var(--muted)]">
                      No Image Available
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {item.year}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold">{item.brand} {item.model}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-black text-sky-500">${item.price.toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                      <FaCheckCircle /> Available
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 pt-0 border-t border-[var(--border)] mt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">
                  Added on {new Date(item.added_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="rounded-full bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/20 transition"
                  aria-label="Remove from Garage"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DreamGarage
