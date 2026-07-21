import { useEffect } from 'react'
import { Routes, Route } from 'react-router'
import { useAuthStore } from './stores/useAuthStore'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import LandingPage from './pages/LandingPage/LandingPage'
import LoginPage from './pages/Auth/LoginPage'
import Dashboard from './pages/Dashboard/Dashboard'
import JournalingPage from './pages/Journaling/JournalingPage'
import DiagnosePage from './pages/Diagnose/DiagnosePage'
import MindCheckFlow from './pages/Diagnose/MindCheckFlow'
import DiagnoseResultPage from './pages/Diagnose/DiagnoseResultPage'
import ChatPage from './pages/Chat/ChatPage'
import ForumPage from './pages/Forum/ForumPage'
import NewStoryPage from './pages/Forum/NewStoryPage'
import HelpPage from './pages/Help/HelpPage'

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
          <Route path="/expert" element={<DiagnosePage />} />
          <Route path="/expert/check" element={<MindCheckFlow />} />
          <Route path="/expert/result/:id" element={<DiagnoseResultPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/new" element={<NewStoryPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

