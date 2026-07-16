import React, { useState, useEffect, useRef } from 'react'
import { FaLocationArrow, FaSearch, FaSlidersH, FaMapMarkerAlt } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'

const MapSearch = () => {
  const { t } = useLanguage()
  const [radius, setRadius] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [userCoords, setUserCoords] = useState({ lat: 41.31108, lng: 69.24056 }) // Default Tashkent
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersGroup = useRef([])

  // Dynamically load Leaflet library files
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => {
      initMap()
    }
    document.body.appendChild(script)

    return () => {
      document.head.removeChild(link)
      document.body.removeChild(script)
    }
  }, [])

  // Geolocation trigger
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserCoords(coords)
          if (mapInstance.current) {
            mapInstance.current.setView([coords.lat, coords.lng], 11)
          }
        },
        () => console.log('Location access declined')
      )
    }
  }, [])

  const initMap = () => {
    if (!window.L || mapInstance.current) return
    const L = window.L

    // Initialize leaflet container
    const map = L.map(mapRef.current).setView([userCoords.lat, userCoords.lng], 11)
    mapInstance.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map)

    // Trigger searches on move
    map.on('moveend', () => {
      const center = map.getCenter()
      fetchNearbyCars(center.lat, center.lng)
    })

    fetchNearbyCars(userCoords.lat, userCoords.lng)
  }

  const fetchNearbyCars = async (lat, lng) => {
    try {
      const response = await api.get('/map/search', {
        params: {
          lat,
          lng,
          radius_miles: radius
        }
      })
      setCars(response.data)
      updateMapMarkers(response.data)
    } catch (error) {
      toast.error(t('map.errorLoad'))
    }
  }

  // Trigger search on radius change
  useEffect(() => {
    if (mapInstance.current) {
      const center = mapInstance.current.getCenter()
      fetchNearbyCars(center.lat, center.lng)
    }
  }, [radius])

  const buildImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=150'
    return image.startsWith('http') ? image : `${window.location.origin}${image}`
  }

  const updateMapMarkers = (carData) => {
    if (!window.L || !mapInstance.current) return
    const L = window.L

    // Clear old markers
    markersGroup.current.forEach(m => m.remove())
    markersGroup.current = []

    // Add user marker
    const userMarker = L.marker([userCoords.lat, userCoords.lng], {
      icon: L.divIcon({
        className: 'user-pin',
        html: '<div style="background-color: #38bdf8; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #38bdf8;"></div>'
      })
    }).addTo(mapInstance.current)
    markersGroup.current.push(userMarker)

    // Add vehicle pins
    carData.forEach(car => {
      if (!car.latitude || !car.longitude) return
      const marker = L.marker([car.latitude, car.longitude], {
        icon: L.divIcon({
          className: 'car-pin',
          html: `<div style="background-color: #8b5cf6; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold; box-shadow: 0 0 10px #8b5cf6;">🚗</div>`
        })
      }).addTo(mapInstance.current)

      marker.on('click', () => {
        setSelectedCar(car)
      })

      markersGroup.current.push(marker)
    })
  }

  const handleRecenter = () => {
    if (mapInstance.current) {
      mapInstance.current.setView([userCoords.lat, userCoords.lng], 12)
      fetchNearbyCars(userCoords.lat, userCoords.lng)
    }
  }

  const filteredCars = cars.filter(car => 
    (car.brand + ' ' + car.model).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            {t('map.title')}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('map.subtitle')}
          </p>
        </div>
        <button
          onClick={handleRecenter}
          className="button-secondary text-xs flex items-center gap-1.5 py-2.5 px-4"
        >
          <FaLocationArrow /> {t('map.centerOnMe')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Controls Column */}
        <div className="space-y-6">
          <div className="panel-card glass-panel">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <FaSlidersH className="text-sky-500" /> {t('map.filterCriteria')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">{t('map.searchQuery')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('map.searchPlaceholder')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-10 pr-4 py-2.5 text-xs text-[var(--text)] outline-none"
                  />
                  <FaSearch className="absolute left-3.5 top-3.5 text-[var(--muted)] text-xs" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t('map.searchRadius')}</label>
                  <span className="text-xs font-bold text-sky-500">{radius} {t('map.miles')}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={radius}
                  onChange={e => setRadius(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="panel-card glass-panel max-h-[350px] overflow-y-auto space-y-3">
            <h3 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{t('map.nearbyVehicles')} ({filteredCars.length})</h3>
            {filteredCars.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-4 text-center">{t('map.noVehicles')}</p>
            ) : (
              filteredCars.map(car => (
                <div
                  key={car.id}
                  onClick={() => {
                    setSelectedCar(car)
                    if (mapInstance.current) {
                      mapInstance.current.setView([car.latitude, car.longitude], 13)
                    }
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex gap-3 ${selectedCar?.id === car.id ? 'border-sky-500 bg-sky-500/5' : 'border-[var(--border)] hover:border-sky-400/30'}`}
                >
                  <img src={buildImageUrl(car.image)} alt={car.model} className="h-10 w-14 object-cover rounded-lg" />
                  <div className="text-[11px]">
                    <p className="font-bold">{car.brand} {car.model}</p>
                    <p className="text-sky-500 font-extrabold mt-0.5">${car.price.toLocaleString()}</p>
                    <p className="text-[10px] text-[var(--muted)]">{car.distance} {t('map.away')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map View Canvas */}
        <div className="lg:col-span-3 h-[500px] panel-card glass-panel p-0 overflow-hidden relative">
          <div ref={mapRef} className="w-full h-full z-10" />

          {selectedCar && (
            <div className="absolute bottom-4 left-4 z-20 p-4 rounded-2xl bg-slate-900/90 border border-sky-400/20 shadow-2xl backdrop-blur-xl animate-slideUp max-w-sm">
              <div className="flex gap-4">
                <img src={buildImageUrl(selectedCar.image)} alt={selectedCar.model} className="h-20 w-28 object-cover rounded-xl" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-white text-sm">{selectedCar.brand} {selectedCar.model}</h4>
                  <p className="text-sky-400 font-extrabold text-base mt-1">${selectedCar.price.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {selectedCar.distance} {t('map.away')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedCar.latitude},${selectedCar.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-sky-500 px-3.5 py-1.5 text-[9px] font-bold text-white hover:bg-sky-600 transition"
                    >
                      {t('map.getDirections')}
                    </a>
                    <button
                      onClick={() => setSelectedCar(null)}
                      className="rounded-full border border-slate-700 px-3.5 py-1.5 text-[9px] font-medium text-slate-400 hover:bg-slate-800 transition"
                    >
                      {t('map.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapSearch
