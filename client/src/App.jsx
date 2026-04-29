import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLoadingScreen from './components/layout/AppLoadingScreen'
import { useAuthStore } from './store/authStore'

const Admin = lazy(() => import('./pages/Admin'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const MapPage = lazy(() => import('./pages/Map'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Register = lazy(() => import('./pages/Register'))
const StationDetail = lazy(() => import('./pages/StationDetail'))

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const location = useLocation()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Suspense fallback={<AppLoadingScreen />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/station/:id" element={<StationDetail />} />
          <Route path="/stations/:id" element={<StationDetail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default App
