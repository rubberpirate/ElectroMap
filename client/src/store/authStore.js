import { create } from 'zustand'

import api from '../services/api'
import { useStationStore } from './stationStore'

const TOKEN_KEY = 'electromap_token'

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

const persistToken = (token) => {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(TOKEN_KEY)
}

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Request failed.'

const syncSavedStations = (user) => {
  const savedStations = Array.isArray(user?.savedStations)
    ? user.savedStations.map((item) => String(item))
    : []

  useStationStore.getState().setSavedStations(savedStations)
}

export const useAuthStore = create((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredToken()),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      const { data } = await api.post('/auth/login', payload)
      const token = data?.data?.token || data?.token || null
      const user = data?.data?.user || data?.user || null

      persistToken(token)

      set({
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
        error: null,
      })
      syncSavedStations(user)

      return { user, token }
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) })
      throw error
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      const { data } = await api.post('/auth/register', payload)
      const token = data?.data?.token || data?.token || null
      const user = data?.data?.user || data?.user || null

      persistToken(token)

      set({
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
        error: null,
      })
      syncSavedStations(user)

      return { user, token }
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null })

    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore logout failures because token cleanup is local and stateless.
    }

    persistToken(null)

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    syncSavedStations(null)
  },

  checkAuth: async () => {
    const token = getStoredToken()

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      return null
    }

    set({ isLoading: true, token, error: null })

    try {
      const { data } = await api.get('/auth/me')
      const user = data?.data?.user || data?.data || data?.user || null

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      syncSavedStations(user)

      return user
    } catch {
      persistToken(null)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      syncSavedStations(null)
      return null
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData

      const { data } = await api.put('/auth/update-profile', payload, {
        headers: isFormData
          ? {
              'Content-Type': 'multipart/form-data',
            }
          : undefined,
      })
      const user = data?.data?.user || data?.data || data?.user || null

      set({ user, isLoading: false, error: null })
      syncSavedStations(user)

      return user
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) })
      throw error
    }
  },
}))
