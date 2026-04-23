import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getMockNearbyStations } from '../data/mockStations'
import api from '../services/api'
import { useMapStore } from '../store/mapStore'
import { isMockModeEnabled } from '../utils/mockMode'

const PAGE_SIZE = 20
const EMPTY_ARRAY = []

const dedupeById = (items) => {
  const seen = new Set()

  return items.filter((item) => {
    const key = String(item?._id)
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const sortStations = (stations, sortBy) => {
  const items = [...stations]

  if (sortBy === 'highest_rated') {
    return items.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
  }

  if (sortBy === 'most_available') {
    return items.sort(
      (a, b) => (Number(b.availableChargers) || 0) - (Number(a.availableChargers) || 0),
    )
  }

  return items.sort((a, b) => {
    const first = Number(a.distanceKm)
    const second = Number(b.distanceKm)

    if (Number.isNaN(first) && Number.isNaN(second)) {
      return 0
    }

    if (Number.isNaN(first)) {
      return 1
    }

    if (Number.isNaN(second)) {
      return -1
    }

    return first - second
  })
}

function useStations({ lat, lng, radius, filters }) {
  const [rawStations, setRawStations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const requestIdRef = useRef(0)

  const mapStoreSetStations = useMapStore((state) => state.setStations)
  const mapStoreSetIsLoading = useMapStore((state) => state.setIsLoading)

  const canQuery = Number.isFinite(lat) && Number.isFinite(lng)
  const sortBy = filters?.sortBy || 'nearest'
  const chargerType = Array.isArray(filters?.chargerType)
    ? filters.chargerType
    : EMPTY_ARRAY
  const minRating = Number(filters?.minRating) || undefined
  const openNow = filters?.openNow || undefined

  const fetchPage = useCallback(
    async ({ targetPage = 1, append = false } = {}) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!canQuery) {
        setRawStations([])
        setHasMore(false)
        setError('')
        mapStoreSetStations([])
        return
      }

      if (isMockModeEnabled()) {
        const fallback = getMockNearbyStations({
          lat,
          lng,
          radiusKm:
            Number(radius) > 100
              ? Number(radius) / 1000
              : Number(radius) || 12,
          page: targetPage,
          limit: PAGE_SIZE,
        })

        const incomingStations = fallback?.stations || []
        const pagination = fallback?.pagination || {}
        const totalPages = Number(pagination.pages) || 1
        const currentPage = Number(pagination.page) || targetPage

        setRawStations((previous) =>
          append ? dedupeById([...previous, ...incomingStations]) : incomingStations,
        )
        setPage(currentPage)
        setHasMore(currentPage < totalPages)
        setError('')
        mapStoreSetIsLoading(false)
        return
      }

      setIsLoading(true)
      mapStoreSetIsLoading(true)
      setError('')

      try {
        const { data } = await api.get('/stations/nearby', {
          params: {
            lat,
            lng,
            radius,
            page: targetPage,
            limit: PAGE_SIZE,
            chargerType,
            minRating,
            isOpen: openNow,
          },
        })

        if (requestIdRef.current !== requestId) {
          return
        }

        const incomingStations = data?.data?.stations || []
        const pagination = data?.data?.pagination || {}
        const totalPages = Number(pagination.pages) || 1
        const currentPage = Number(pagination.page) || targetPage

        setRawStations((previous) => {
          return append ? dedupeById([...previous, ...incomingStations]) : incomingStations
        })

        setPage(currentPage)
        setHasMore(currentPage < totalPages)
      } catch {
        if (requestIdRef.current !== requestId) {
          return
        }

        const fallback = getMockNearbyStations({
          lat,
          lng,
          radiusKm:
            Number(radius) > 100
              ? Number(radius) / 1000
              : Number(radius) || 12,
          page: targetPage,
          limit: PAGE_SIZE,
        })

        const incomingStations = fallback?.stations || []
        const pagination = fallback?.pagination || {}
        const totalPages = Number(pagination.pages) || 1
        const currentPage = Number(pagination.page) || targetPage

        setRawStations((previous) =>
          append ? dedupeById([...previous, ...incomingStations]) : incomingStations,
        )
        setPage(currentPage)
        setHasMore(currentPage < totalPages)
        setError('')
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
          mapStoreSetIsLoading(false)
        }
      }
    },
    [
      canQuery,
      chargerType,
      lat,
      lng,
      mapStoreSetIsLoading,
      mapStoreSetStations,
      minRating,
      openNow,
      radius,
    ],
  )

  const stations = useMemo(() => {
    return sortStations(rawStations, sortBy)
  }, [rawStations, sortBy])

  const refetch = useCallback(() => {
    return fetchPage({ targetPage: 1, append: false })
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) {
      return Promise.resolve()
    }

    return fetchPage({ targetPage: page + 1, append: true })
  }, [fetchPage, hasMore, isLoading, page])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchPage({ targetPage: 1, append: false })
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchPage])

  useEffect(() => {
    mapStoreSetStations(stations)
  }, [mapStoreSetStations, stations])

  return {
    stations,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
  }
}

export default useStations
