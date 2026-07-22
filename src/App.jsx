import { useEffect } from 'react'
import { Routes, Route } from 'react-router'
import { useAuthStore } from './stores/useAuthStore'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'

import LandingPage from './pages/LandingPage/LandingPage'
import Dashboard from './pages/Dashboard/Dashboard'
import JournalingPage from './pages/Journaling/JournalingPage'
import DiagnosePage from './pages/Diagnose/DiagnosePage'
import MindCheckFlow from './pages/Diagnose/MindCheckFlow'
import DiagnoseResultPage from './pages/Diagnose/DiagnoseResultPage'
import ChatPage from './pages/Chat/ChatPage'
import ForumPage from './pages/Forum/ForumPage'
import NewStoryPage from './pages/Forum/NewStoryPage'
import HelpPage from './pages/Help/HelpPage'

// Admin Pages (Stubs for now, will be implemented next)
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserManagement from './pages/Admin/UserManagement'
import AssessmentAnalytics from './pages/Admin/AssessmentAnalytics'
import SpecialistManagement from './pages/Admin/SpecialistManagement'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
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

      {/* Admin (requires auth AND admin role) */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/assessments" element={<AssessmentAnalytics />} />
          <Route path="/admin/specialists" element={<SpecialistManagement />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

