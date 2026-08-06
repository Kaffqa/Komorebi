import { Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router'
import { useAuthStore } from './stores/useAuthStore'
import { useThemeStore } from './stores/useThemeStore'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import ToastContainer from './components/ui/ToastContainer'

import { lazy } from 'react'
import LandingPage from './pages/LandingPage/LandingPage'

const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const JournalingPage = lazy(() => import('./pages/Journaling/JournalingPage'))
const DiagnosePage = lazy(() => import('./pages/Diagnose/DiagnosePage'))
const MindCheckFlow = lazy(() => import('./pages/Diagnose/MindCheckFlow'))
const DiagnoseResultPage = lazy(() => import('./pages/Diagnose/DiagnoseResultPage'))
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'))
const ForumPage = lazy(() => import('./pages/Forum/ForumPage'))
const NewStoryPage = lazy(() => import('./pages/Forum/NewStoryPage'))
const HelpPage = lazy(() => import('./pages/Help/HelpPage'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'))
const AssessmentAnalytics = lazy(() => import('./pages/Admin/AssessmentAnalytics'))
const SpecialistManagement = lazy(() => import('./pages/Admin/SpecialistManagement'))
const ForumModeration = lazy(() => import('./pages/Admin/ForumModeration'))

function App() {
  const { initialize } = useAuthStore()
  const { isDarkMode } = useThemeStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-komorebi-cream dark:bg-komorebi-dark-bg">
        <div className="w-10 h-10 border-4 border-komorebi-green/30 border-t-komorebi-green rounded-full animate-spin"></div>
      </div>
    }>
      <ToastContainer />
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
            <Route path="/admin/moderation" element={<ForumModeration />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App

