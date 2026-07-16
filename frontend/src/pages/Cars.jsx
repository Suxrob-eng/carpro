import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'

const Cars = () => {
  const { t } = useLanguage()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  const resolveCarImage = (car) => {
    const image = car.images?.find((img) => img.is_primary)?.image_url || car.images?.[0]?.image_url || car.image || car.image_url
    if (!image) return '/placeholder-car.svg'
    return image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE || ''}${image}`
  }

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const response = await api.get('/cars')
      setCars(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch cars:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-[var(--text)]">{t('cars.title', 'Available Cars')}</h1>
        <Link to="/create-car" className="button-primary">{t('cars.listCar', 'List a Car')}</Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.length === 0 ? (
          <div className="col-span-full panel-card p-10 text-center text-[var(--muted)]">
            {t('cars.noCars', 'No cars available right now.')}
          </div>
        ) : (
          cars.map((car) => (
            <Link key={car.id} to={`/cars/${car.id}`} className="panel-card group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-sky-400/30">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[22px] bg-slate-100 dark:bg-slate-800">
                <img 
                  src={resolveCarImage(car)} 
                  alt={car.brand || car.name || 'Car'} 
                  onError={(e) => { e.currentTarget.src = '/placeholder-car.svg' }}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">{car.brand} {car.model}</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--text)]">{car.name || `${car.brand} ${car.model}`}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-[var(--text)]">${Number(car.price || 0).toLocaleString()}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{car.year}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default Cars
