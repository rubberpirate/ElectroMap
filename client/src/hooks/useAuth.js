import { useAuthStore } from '../store/authStore'

function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const error = useAuthStore((state) => state.error)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const clearError = useAuthStore((state) => state.clearError)

  return {
    user,
    token,
    error,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    clearError,
  }
}

export default useAuth
