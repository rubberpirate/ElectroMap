import { create } from 'zustand'

import api from '../services/api'

export const useStationStore = create((set, get) => ({
  stations: [],
  nearbyStations: [],
  currentStation: null,
  savedStations: [],
  isLoading: false,

  fetchNearby: async (params = {}) => {
    set({ isLoading: true })

    try {
      const { data } = await api.get('/stations/nearby', { params })
      const stations = data?.data?.stations || data?.data || []

      set({
        stations,
        nearbyStations: stations,
        isLoading: false,
      })

      return stations
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  fetchStation: async (stationId) => {
    set({ isLoading: true })

    try {
      const { data } = await api.get(`/stations/${stationId}`)
      const currentStation = data?.data?.station || data?.data || null

      set({ currentStation, isLoading: false })

      return currentStation
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  saveStation: async (stationId) => {
    await api.post(`/stations/${stationId}/save`)

    set((state) => {
      if (state.savedStations.includes(stationId)) {
        return state
      }

      return {
        savedStations: [...state.savedStations, stationId],
      }
    })
  },

  unsaveStation: async (stationId) => {
    await api.delete(`/stations/${stationId}/save`)

    const updated = get().savedStations.filter((id) => id !== stationId)
    set({ savedStations: updated })
  },
}))
