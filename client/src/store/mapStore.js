import { create } from 'zustand'

const INDIA_CENTER = [78.9629, 20.5937]

const defaultFilters = {
  chargerType: [],
  minRating: 0,
  openNow: false,
  maxDistance: 10,
  sortBy: 'nearest',
}

export const useMapStore = create((set) => ({
  userLocation: null,
  mapCenter: INDIA_CENTER,
  zoom: 5,
  selectedStation: null,
  filters: defaultFilters,
  stations: [],
  isLoading: false,

  setUserLocation: (userLocation) =>
    set({
      userLocation,
      mapCenter: userLocation
        ? [userLocation.lng, userLocation.lat]
        : INDIA_CENTER,
    }),

  setSelectedStation: (selectedStation) => set({ selectedStation }),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  setStations: (stations) => set({ stations }),
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setZoom: (zoom) => set({ zoom }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
