import { create } from 'zustand'

import api from '../services/api'

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

export const useAuthStore = create((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredToken()),
  isLoading: false,

  login: async (payload) => {
    set({ isLoading: true })

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
      })

      return { user, token }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (payload) => {
    set({ isLoading: true })

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
      })

      return { user, token }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })

    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Ignore logout failures because token cleanup is local and stateless.
    }

    persistToken(null)

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  checkAuth: async () => {
    const token = getStoredToken()

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return null
    }

    set({ isLoading: true, token })

    try {
      const { data } = await api.get('/auth/me')
      const user = data?.data?.user || data?.data || data?.user || null

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })

      return user
    } catch (error) {
      persistToken(null)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return null
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true })

    try {
      const { data } = await api.put('/auth/update-profile', payload)
      const user = data?.data?.user || data?.data || data?.user || null

      set({ user, isLoading: false })

      return user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
