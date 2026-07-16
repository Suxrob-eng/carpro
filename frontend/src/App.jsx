import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Cars from './pages/Cars'
import CarDetail from './pages/CarDetail'
import CreateCar from './pages/CreateCar'
import AdminPanel from './pages/AdminPanel'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './components/ProtectedRoute'

// New Premium Pages
import MarketAnalytics from './pages/MarketAnalytics'
import CarBattle from './pages/CarBattle'
import DreamGarage from './pages/DreamGarage'
import MapSearch from './pages/MapSearch'
import Community from './pages/Community'
import ChatMessenger from './pages/ChatMessenger'

function App() {
  return (
    <Layout>
      <Navbar />
      <main className="relative z-10 flex-grow container mx-auto px-4 py-8 md:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/analytics" element={<MarketAnalytics />} />
          <Route path="/battle" element={<CarBattle />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/community" element={<Community />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage"
            element={
              <ProtectedRoute>
                <DreamGarage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatMessenger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-car"
            element={
              <ProtectedRoute>
                <CreateCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Layout>
  )
}

export default App