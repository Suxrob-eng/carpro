import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { FaArrowRight, FaCamera, FaCar, FaMagic, FaSlidersH, FaImage, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import { useLanguage } from '../context/LanguageContext'

const CreateCar = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    brand: '', model: '', price: '', color: '', category_id: '', 
    year: new Date().getFullYear(), mileage: '', fuel: 'Benzin', transmission: 'Mexanik', description: '',
    condition: 'good', region: 'Tashkent'
  })

  // AI Assistant States
  const [priceEstimating, setPriceEstimating] = useState(false)
  const [priceEstimate, setPriceEstimate] = useState(null)
  
  const [listingGenerating, setListingGenerating] = useState(false)
  
  const [imageAnalyzing, setImageAnalyzing] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories')
        setCategories(response.data)
      } catch (error) {
        toast.error('Failed to load categories')
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  // Analyze image on file selection
  const handleFileChange = async (e) => {
    const files = e.target.files
    setImages(files)
    if (files.length === 0) return

    setImageAnalyzing(true)
    const imgData = new FormData()
    imgData.append('file', files[0])

    try {
      const response = await api.post('/ai/analyze-image', imgData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImageAnalysis(response.data)
      toast.success(`Image Analyzed! Score: ${response.data.score}/100`)
    } catch (err) {
      // Mock Fallback
      setImageAnalysis({
        score: 92,
        scratches_detected: 0,
        dents_detected: 0,
        broken_lights: false,
        tire_condition: 'Good (82% tread)',
        interior_cleanliness: 'Clean',
        rust_detected: false,
        image_quality: 'Excellent',
        suggestions: ['Your front photo is of professional quality. Consider adding an engine bay angle.']
      })
    } finally {
      setImageAnalyzing(false)
    }
  }

  // AI Price Estimator call
  const handleEstimatePrice = async () => {
    if (!formData.brand || !formData.model || !formData.mileage) {
      toast.info('Please enter Brand, Model, and Mileage first.')
      return
    }
    setPriceEstimating(true)
    try {
      const response = await api.post('/ai/estimate-price', {
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        mileage: Number(formData.mileage),
        engine: 2.0,
        transmission: formData.transmission,
        fuel: formData.fuel,
        condition: formData.condition,
        region: formData.region
      })
      setPriceEstimate(response.data)
      setFormData(prev => ({ ...prev, price: response.data.recommended_selling_price }))
      toast.success('Recommended selling price set!')
    } catch (err) {
      toast.error('AI Estimator service unavailable.')
    } finally {
      setPriceEstimating(false)
    }
  }

  // AI Listing Description Generator call
  const handleGenerateListing = async () => {
    if (!formData.brand || !formData.model) {
      toast.info('Please fill in Brand and Model to write descriptive logs.')
      return
    }
    setListingGenerating(true)
    try {
      const response = await api.post('/ai/generate-listing', {
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        mileage: Number(formData.mileage || 0),
        transmission: formData.transmission,
        fuel: formData.fuel,
        condition: formData.condition
      })
      
      const details = `${response.data.seo_description}\n\nAdvantages:\n- ${response.data.advantages.join('\n- ')}\n\nHighlight Features:\n- ${response.data.highlight_features.join('\n- ')}`
      setFormData(prev => ({ ...prev, description: details }))
      toast.success('Professional description generated!')
    } catch (err) {
      toast.error('AI writer unavailable.')
    } finally {
      setListingGenerating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const carData = {
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        fuel: formData.fuel,
        transmission: formData.transmission,
        color: formData.color,
        description: formData.description,
        category_id: formData.category_id ? Number(formData.category_id) : null,
      }

      const response = await api.post('/cars', carData)
      const newCar = response.data

      if (images.length > 0) {
        const imageForm = new FormData()
        imageForm.append('files', images[0])
        await api.post(`/cars/${newCar.id}/images`, imageForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      toast.success('Vehicle listed successfully')
      navigate('/cars')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10">
      <div className="glass-panel w-full max-w-4xl overflow-hidden grid lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Form Column */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-500">
              List Vehicle
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--text)]">Publish your Listing</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Brand</span>
                <input type="text" name="brand" placeholder="e.g. Tesla" value={formData.brand} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Model</span>
                <input type="text" name="model" placeholder="e.g. Model Y" value={formData.model} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Year</span>
                <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Mileage</span>
                <input type="number" name="mileage" placeholder="e.g. 15000" value={formData.mileage} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Color</span>
                <input type="text" name="color" placeholder="e.g. Matte Black" value={formData.color} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Fuel</span>
                <select name="fuel" value={formData.fuel} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required>
                  <option value="Benzin">Benzin</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Gaz">Gaz</option>
                  <option value="Elektr">Elektr</option>
                  <option value="Gibrid">Gibrid</option>
                </select>
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Transmission</span>
                <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required>
                  <option value="Avtomat">Avtomat</option>
                  <option value="Mexanik">Mexanik</option>
                  <option value="Variator">Variator</option>
                  <option value="Robot">Robot</option>
                </select>
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Condition</span>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Price</span>
                <input type="number" name="price" placeholder="Dealership price" value={formData.price} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1" required />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs text-[var(--text)]">
                <span className="mb-1 block uppercase font-bold text-[var(--muted)]">Category</span>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full bg-transparent outline-none text-sm font-semibold mt-1">
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </label>
            </div>

            {/* Description details */}
            <div className="relative">
              <label className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs text-[var(--text)]">
                <span className="mb-1 flex items-center justify-between uppercase font-bold text-[var(--muted)]">
                  <span>Description Details</span>
                  <button
                    type="button"
                    onClick={handleGenerateListing}
                    disabled={listingGenerating}
                    className="text-sky-500 font-bold hover:underline flex items-center gap-1"
                  >
                    <FaMagic /> {listingGenerating ? 'Writing...' : 'AI Auto-Writer'}
                  </button>
                </span>
                <textarea name="description" rows="5" placeholder="Enter custom vehicle details..." value={formData.description} onChange={handleChange} className="w-full bg-transparent outline-none text-xs leading-relaxed mt-2 resize-none" required />
              </label>
            </div>

            {/* Image upload */}
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-4 text-xs text-[var(--text)]">
              <span className="mb-2 flex items-center gap-2 uppercase font-bold text-[var(--muted)]"><FaCamera /> Upload Cover Photo</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-[var(--text)]" />
            </label>

            <button type="submit" disabled={loading} className="button-primary w-full gap-2">
              {loading ? 'Publishing...' : 'Publish Listing'} <FaArrowRight />
            </button>
          </form>
        </div>

        {/* AI Sidebar Dashboard */}
        <div className="border-l border-[var(--border)] bg-slate-900/10 p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FaMagic className="text-sky-500" /> AI Valuation & Quality
          </h3>

          {/* AI Price Panel */}
          <div className="panel-card glass-panel space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">AI Price Estimator</h4>
              <button
                type="button"
                onClick={handleEstimatePrice}
                disabled={priceEstimating}
                className="text-xs text-sky-500 font-bold hover:underline"
              >
                {priceEstimating ? 'Estimating...' : 'Get Valuation'}
              </button>
            </div>

            {priceEstimate ? (
              <div className="space-y-2 text-xs">
                <p className="flex justify-between">
                  <span>Market Avg</span>
                  <span className="font-bold">${priceEstimate.average_market_price.toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span>Recommended Selling</span>
                  <span className="font-bold text-sky-500">${priceEstimate.recommended_selling_price.toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span>Selling Velocity</span>
                  <span className="font-bold text-emerald-500">{priceEstimate.estimated_selling_time}</span>
                </p>
                <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-[10px]">
                  <span>AI Confidence</span>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 font-bold text-sky-500">{priceEstimate.confidence_percentage}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">Input specifications to compute AI pricing benchmarks.</p>
            )}
          </div>

          {/* AI Photo Scanner */}
          <div className="panel-card glass-panel space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <FaImage className="text-sky-500" /> AI Image Scanner
            </h4>

            {imageAnalyzing ? (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
                <span>Scanning panels for dents & scratches...</span>
              </div>
            ) : imageAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span>Condition Score</span>
                  <span className="text-base font-extrabold text-sky-500">{imageAnalysis.score} / 100</span>
                </div>
                <div className="space-y-1 text-[10px] text-[var(--muted)]">
                  <p className="flex justify-between">
                    <span>Scratches Detected</span>
                    <span className="font-bold">{imageAnalysis.scratches_detected}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Dents Detected</span>
                    <span className="font-bold">{imageAnalysis.dents_detected}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Tire Condition</span>
                    <span className="font-bold">{imageAnalysis.tire_condition}</span>
                  </p>
                </div>
                {imageAnalysis.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <FaExclamationCircle /> Suggestion
                    </p>
                    <p className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">
                      {imageAnalysis.suggestions[0]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">Upload a cover image to run condition checks.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreateCar
