import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui'

const buildRedirectTarget = (location) => {
  const path = location?.pathname || '/'
  const search = location?.search || ''
  const hash = location?.hash || ''

  return `${path}${search}${hash}`
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectTarget = encodeURIComponent(buildRedirectTarget(location))
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
