import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter basename={import.meta.env.VITE_BASE_URL || import.meta.env.BASE_URL || '/'}>
      <AuthProvider>
        <LanguageProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3000} />
        </LanguageProvider>
        </AuthProvider>
      </HashRouter>
  </React.StrictMode>
)