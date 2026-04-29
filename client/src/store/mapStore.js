import { create } from 'zustand'

const INDIA_CENTER = [78.9629, 20.5937]

const createDefaultFilters = () => ({
  chargerType: [],
  minRating: 0,
  openNow: false,
  maxDistance: 20,
  sortBy: 'nearest',
})

export const useMapStore = create((set) => ({
  userLocation: null,
  mapCenter: INDIA_CENTER,
  zoom: 5,
  selectedStation: null,
  highlightedStationId: null,
  filters: createDefaultFilters(),
  stations: [],
  visibleStations: [],
  isLoading: false,

  setUserLocation: (userLocation) =>
    set({
      userLocation,
      mapCenter: userLocation
        ? [userLocation.lng, userLocation.lat]
        : INDIA_CENTER,
    }),

  setSelectedStation: (selectedStation) => set({ selectedStation }),

  setHighlightedStationId: (highlightedStationId) => set({ highlightedStationId }),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  resetFilters: () =>
    set({
      filters: createDefaultFilters(),
    }),

  setStations: (stations) =>
    set((state) => ({
      stations: typeof stations === 'function' ? stations(state.stations) : stations,
    })),
  setVisibleStations: (visibleStations) =>
    set((state) => ({
      visibleStations:
        typeof visibleStations === 'function'
          ? visibleStations(state.visibleStations)
          : visibleStations,
    })),
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setZoom: (zoom) => set({ zoom }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
