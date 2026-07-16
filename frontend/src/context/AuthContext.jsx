import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../api/axios'
import jwtDecode from 'jwt-decode'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const decoded = jwtDecode(token)
          if (decoded.exp * 1000 > Date.now()) {
            await fetchUser()
          } else {
            logout()
          }
        } catch {
          logout()
        }
      }
      setLoading(false)
    }

    initialize()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      return response.data
    } catch {
      logout()
      return null
    }
  }

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { access_token, refresh_token } = response.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    await fetchUser()
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', {
      username: userData.username,
      phone_number: userData.phone_number,
      email: userData.email,
      full_name: userData.full_name,
      password: userData.password,
    })

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}