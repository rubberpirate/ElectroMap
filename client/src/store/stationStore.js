import { create } from 'zustand'

import api from '../services/api'

export const useStationStore = create((set, get) => ({
  stations: [],
  nearbyStations: [],
  currentStation: null,
  savedStations: [],
  isLoading: false,

  setCurrentStation: (currentStation) => set({ currentStation }),
  setSavedStations: (savedStations) => set({ savedStations }),

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
    const { data } = await api.post(`/stations/${stationId}/save`)
    const savedStations = data?.data?.savedStations

    if (Array.isArray(savedStations)) {
      set({
        savedStations: savedStations.map((id) => String(id)),
      })
      return
    }

    set((state) => {
      if (state.savedStations.includes(String(stationId))) {
        return state
      }

      return {
        savedStations: [...state.savedStations, String(stationId)],
      }
    })
  },

  unsaveStation: async (stationId) => {
    const { data } = await api.delete(`/stations/${stationId}/save`)
    const savedStations = data?.data?.savedStations

    if (Array.isArray(savedStations)) {
      set({
        savedStations: savedStations.map((id) => String(id)),
      })
      return
    }

    const updated = get().savedStations.filter((id) => String(id) !== String(stationId))
    set({ savedStations: updated })
  },

  updateChargerStatusRealtime: ({ stationId, chargerId, status, availableChargers }) => {
    const stationIdString = String(stationId)
    const chargerIdString = String(chargerId)

    set((state) => {
      const patchStationList = (list) =>
        list.map((station) =>
          String(station._id) === stationIdString
            ? {
                ...station,
                availableChargers:
                  typeof availableChargers === 'number'
                    ? availableChargers
                    : station.availableChargers,
              }
            : station,
        )

      let currentStation = state.currentStation

      if (currentStation && String(currentStation._id) === stationIdString) {
        const updatedChargers = Array.isArray(currentStation.chargers)
          ? currentStation.chargers.map((charger) =>
              String(charger._id) === chargerIdString
                ? {
                    ...charger,
                    status,
                    lastUpdated: new Date().toISOString(),
                  }
                : charger,
            )
          : currentStation.chargers

        currentStation = {
          ...currentStation,
          chargers: updatedChargers,
          availableChargers:
            typeof availableChargers === 'number'
              ? availableChargers
              : currentStation.availableChargers,
        }
      }

      return {
        currentStation,
        stations: patchStationList(state.stations),
        nearbyStations: patchStationList(state.nearbyStations),
      }
    })
  },
}))
