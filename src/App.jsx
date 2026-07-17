import { useEffect } from 'react'
import { Routes, Route } from 'react-router'
import { useAuthStore } from './stores/useAuthStore'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import LandingPage from './pages/LandingPage/LandingPage'
import LoginPage from './pages/Auth/LoginPage'
import Dashboard from './pages/Dashboard/Dashboard'
import JournalingPage from './pages/Journaling/JournalingPage'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected (requires auth) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journaling" element={<JournalingPage />} />
          {/* Tambahkan route lainnya di sini: expert, chat, forum, help */}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
