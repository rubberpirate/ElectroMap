import { AnimatePresence, motion } from 'framer-motion'
import {
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import api from '../../services/api'
import { fetchMapTilerGeocodeSuggestions } from '../../utils/maptiler'
import { isMockModeEnabled } from '../../utils/mockMode'
import { Spinner } from '../ui'

const sortOptions = [
  { label: 'Nearest', value: 'nearest' },
  { label: 'Highest Rated', value: 'highest_rated' },
  { label: 'Most Available', value: 'most_available' },
]

const chargerTypeOptions = [
  { label: 'Level 1', value: 'Level1' },
  { label: 'Level 2', value: 'Level2' },
  { label: 'DC Fast', value: 'DC_Fast' },
  { label: 'Tesla', value: 'Tesla_Supercharger' },
]

const toStationCode = (station, index) => {
  const raw = String(station?.stationCode || station?._id || '').replace(/[^a-zA-Z0-9]/g, '')
  if (!raw) {
    return `IN-${String(index + 1).padStart(4, '0')}`
  }

  if (raw.length >= 8) {
    return `${raw.slice(0, 2).toUpperCase()}-${raw.slice(-6).toUpperCase()}`
  }

  return raw.toUpperCase()
}

const getTypeBadge = (station) => {
  const primary = String(station?.chargerTypes?.[0] || '').toLowerCase()

  if (primary.includes('level1')) {
    return 'T1'
  }

  if (primary.includes('level2')) {
    return 'T2'
  }

  if (primary.includes('dc')) {
    return 'CH'
  }

  return 'M'
}

const getStatusTone = (station) => {
  const available = Number(station?.availableChargers) || 0
  const total = Number(station?.totalChargers) || 0

  if (total <= 0 || String(station?.status || '').toLowerCase() === 'offline') {
    return {
      color: '#588197',
      label: 'Offline',
    }
  }

  if (available > 0) {
    return {
      color: '#00c48c',
      label: 'Open',
    }
  }

  return {
    color: '#fd7a01',
    label: 'Busy',
  }
}

const toLocationSuggestion = (feature) => {
  const [lng, lat] = feature?.center || []

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return null
  }

  return {
    id: feature?.id || `${lng}-${lat}`,
    placeName: feature?.place_name || feature?.text || 'Selected location',
    coordinates: [Number(lng), Number(lat)],
  }
}

function MapSidebar({
  stations,
  isLoading,
  error,
  filters,
  selectedStationId,
  onFiltersChange,
  onResetFilters,
  onSelectStation,
  onHoverStation,
  onSearchSelect,
  hasMore,
  onLoadMore,
  maptilerKey,
  locationError,
  isLocating,
  onRequestLocation,
  onManualLocationSelect,
  manualLocationLabel,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [manualQuery, setManualQuery] = useState('')
  const [manualResults, setManualResults] = useState([])
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState('')

  const listContainerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters?.openNow) {
      count += 1
    }
    if (Number(filters?.maxDistance || 10) !== 10) {
      count += 1
    }
    if ((filters?.sortBy || 'nearest') !== 'nearest') {
      count += 1
    }
    if (Array.isArray(filters?.chargerType) && filters.chargerType.length) {
      count += filters.chargerType.length
    }

    return count
  }, [filters?.chargerType, filters?.maxDistance, filters?.openNow, filters?.sortBy])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery.length < 2) {
      return
    }

    let isActive = true

    const timer = window.setTimeout(async () => {
      setSearchLoading(true)

      if (isMockModeEnabled()) {
        const localMatches = stations.filter((station) => {
          const haystack = `${station?.stationName || ''} ${station?.city || ''}`.toLowerCase()
          return haystack.includes(trimmedQuery.toLowerCase())
        })

        if (isActive) {
          setSearchResults(localMatches.slice(0, 8))
          setSearchLoading(false)
        }
        return
      }

      try {
        const { data } = await api.get('/stations/search', {
          params: { q: trimmedQuery },
        })

        if (!isActive) {
          return
        }

        const remoteResults = data?.data?.stations || []
        if (remoteResults.length > 0) {
          setSearchResults(remoteResults.slice(0, 8))
          return
        }

        const localMatches = stations.filter((station) => {
          const haystack = `${station?.stationName || ''} ${station?.city || ''}`.toLowerCase()
          return haystack.includes(trimmedQuery.toLowerCase())
        })
        setSearchResults(localMatches.slice(0, 8))
      } catch {
        if (isActive) {
          const localMatches = stations.filter((station) => {
            const haystack = `${station?.stationName || ''} ${station?.city || ''}`.toLowerCase()
            return haystack.includes(trimmedQuery.toLowerCase())
          })
          setSearchResults(localMatches.slice(0, 8))
        }
      } finally {
        if (isActive) {
          setSearchLoading(false)
        }
      }
    }, 280)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [searchQuery, stations])

  useEffect(() => {
    const trimmed = manualQuery.trim()

    if (trimmed.length < 2) {
      return
    }

    if (!maptilerKey) {
      return
    }

    let active = true

    const timer = window.setTimeout(async () => {
      setManualLoading(true)
      setManualError('')

      try {
        const features = await fetchMapTilerGeocodeSuggestions(maptilerKey, trimmed, 6)

        if (!active) {
          return
        }

        const suggestions = features.map(toLocationSuggestion).filter(Boolean)
        setManualResults(suggestions)
      } catch {
        if (active) {
          setManualResults([])
          setManualError('Unable to fetch location suggestions right now.')
        }
      } finally {
        if (active) {
          setManualLoading(false)
        }
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [manualQuery, maptilerKey])

  const manualKeyError =
    !maptilerKey && manualQuery.trim().length >= 2
      ? 'Map key is missing. Set VITE_MAPTILER_KEY to search locations.'
      : ''

  useEffect(() => {
    if (!loadMoreRef.current || !listContainerRef.current) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry?.isIntersecting || !hasMore || isLoading) {
          return
        }

        onLoadMore?.()
      },
      {
        root: listContainerRef.current,
        threshold: 0.4,
      },
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore])

  return (
    <div className="nothing-sidebar-root map-core-sidebar">
      <header className="nothing-sidebar-header">
        <div className="nothing-brand">
          <span className="nothing-brand-icon" aria-hidden="true">
            <MapPin size={15} />
          </span>
          <div>
            <strong>electromap</strong>
            <small>core map</small>
          </div>
        </div>

        <button
          type="button"
          className="focus-ring nothing-locate-btn"
          onClick={onRequestLocation}
          disabled={isLocating}
          aria-label="Use device location"
        >
          <LocateFixed size={13} />
          {isLocating ? 'Locating' : 'Locate'}
        </button>
      </header>

      <div className="nothing-search-wrap">
        <div className="nothing-search-input">
          <Search size={14} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => {
              const nextValue = event.target.value
              setSearchQuery(nextValue)

              if (nextValue.trim().length < 2) {
                setSearchResults([])
                setSearchLoading(false)
              }
            }}
            placeholder="Search stations"
            aria-label="Search stations"
          />
        </div>

        <AnimatePresence>
          {(searchLoading || searchResults.length > 0) && searchQuery.trim().length >= 2 ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="nothing-search-dropdown"
            >
              {searchLoading ? (
                <div className="nothing-inline-loading">
                  <Spinner size="sm" />
                  <span>Searching</span>
                </div>
              ) : (
                searchResults.map((station, index) => (
                  <button
                    key={station?._id || `search-${index}`}
                    type="button"
                    className="focus-ring nothing-search-option"
                    onClick={() => {
                      onSearchSelect?.(station)
                      setSearchQuery(station.stationName || '')
                      setSearchResults([])
                    }}
                  >
                    <span>{station.stationName}</span>
                    <small>{station.city || 'Unknown city'}</small>
                  </button>
                ))
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <section className="nothing-filter-shell">
        <button
          type="button"
          className="focus-ring nothing-filter-toggle"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-label="Toggle core filters"
        >
          <span>
            <SlidersHorizontal size={13} />
            Charger filters
            {activeFilterCount > 0 ? <small>{activeFilterCount}</small> : null}
          </span>
          <span>{filtersOpen ? 'Hide' : 'Show'}</span>
        </button>

        <AnimatePresence initial={false}>
          {filtersOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="nothing-filter-body"
            >
              <label className="nothing-toggle-row" htmlFor="open-now-toggle">
                <input
                  id="open-now-toggle"
                  type="checkbox"
                  checked={Boolean(filters?.openNow)}
                  onChange={(event) => onFiltersChange({ openNow: event.target.checked })}
                />
                Open now
              </label>

              <div className="nothing-filter-row">
                <label>Charger type</label>
                <div className="nothing-chip-grid">
                  {chargerTypeOptions.map((option) => {
                    const active = Array.isArray(filters?.chargerType)
                      ? filters.chargerType.includes(option.value)
                      : false

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`focus-ring nothing-chip ${active ? 'is-active' : ''}`}
                        onClick={() => {
                          const current = Array.isArray(filters?.chargerType)
                            ? filters.chargerType
                            : []
                          onFiltersChange({
                            chargerType: active
                              ? current.filter((item) => item !== option.value)
                              : [...current, option.value],
                          })
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="nothing-filter-row">
                <label htmlFor="distance-range">
                  Search radius {Number(filters?.maxDistance) || 10} km
                </label>
                <input
                  id="distance-range"
                  type="range"
                  min={1}
                  max={50}
                  value={Number(filters?.maxDistance) || 10}
                  onChange={(event) =>
                    onFiltersChange({
                      maxDistance: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className="nothing-filter-row">
                <label htmlFor="sort-select">Sort stations</label>
                <select
                  id="sort-select"
                  className="focus-ring nothing-select"
                  value={filters?.sortBy || 'nearest'}
                  onChange={(event) => onFiltersChange({ sortBy: event.target.value })}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="focus-ring nothing-clear-chip"
                onClick={onResetFilters}
              >
                Reset filters
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="nothing-filter-shell map-manual-shell">
        <div className="map-manual-header">
          <strong>Manual location</strong>
          {manualLocationLabel ? <small>{manualLocationLabel}</small> : null}
        </div>

        <div className="nothing-search-wrap">
          <div className="nothing-search-input">
            <MapPin size={14} aria-hidden="true" />
            <input
              value={manualQuery}
              onChange={(event) => {
                const nextValue = event.target.value
                setManualQuery(nextValue)
                setManualError('')

                if (nextValue.trim().length < 2) {
                  setManualResults([])
                  setManualLoading(false)
                }
              }}
              placeholder="Type your city or area"
              aria-label="Type location manually"
            />
          </div>

          <AnimatePresence>
            {(manualLoading || manualResults.length > 0) && manualQuery.trim().length >= 2 ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="nothing-search-dropdown"
              >
                {manualLoading ? (
                  <div className="nothing-inline-loading">
                    <Spinner size="sm" />
                    <span>Searching location</span>
                  </div>
                ) : (
                  manualResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="focus-ring nothing-search-option"
                      onClick={() => {
                        setManualQuery(item.placeName)
                        setManualResults([])
                        onManualLocationSelect?.(item)
                      }}
                    >
                      <span>{item.placeName}</span>
                    </button>
                  ))
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {locationError && !manualLocationLabel ? (
          <small className="map-manual-note">{locationError}</small>
        ) : null}
        {manualKeyError ? <small className="map-manual-error">{manualKeyError}</small> : null}
        {manualError ? <small className="map-manual-error">{manualError}</small> : null}
      </section>

      <div ref={listContainerRef} className="nothing-station-list">
        {stations.map((station, index) => {
          const isActive = String(selectedStationId) === String(station?._id)
          const tone = getStatusTone(station)
          const available = Number(station?.availableChargers) || 0
          const total = Number(station?.totalChargers) || 0
          const distance = Number(station?.distanceKm)

          return (
            <button
              key={station?._id || `station-${index}`}
              type="button"
              className={`focus-ring nothing-station-row ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectStation?.(station)}
              onMouseEnter={() => onHoverStation?.(station?._id)}
              onMouseLeave={() => onHoverStation?.(null)}
              aria-label={`Open station ${station?.stationName || 'station'}`}
            >
              <span className="left-bar" aria-hidden="true" />
              <span className="type-pill">{getTypeBadge(station)}</span>
              <span className="meta">
                <strong>{station?.stationName || toStationCode(station, index)}</strong>
                <small>
                  {distance > 0 ? `${distance.toFixed(1)} km` : '--'} | {tone.label}
                </small>
              </span>
              <span className="right">
                <i style={{ background: tone.color }} aria-hidden="true" />
                <small>
                  {available}/{total || 0}
                </small>
              </span>
            </button>
          )
        })}

        {!isLoading && stations.length === 0 ? (
          <div className="nothing-empty-state">
            <LocateFixed size={14} />
            <p>No stations found in this map area.</p>
            <small>Change your location or widen the search radius.</small>
          </div>
        ) : null}

        {isLoading && stations.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="glass-card skeleton"
                style={{ height: 62, borderRadius: '2px' }}
              />
            ))
          : null}

        {error ? <div className="nothing-error-state">{error}</div> : null}

        <div ref={loadMoreRef} style={{ height: 8 }} aria-hidden="true" />

        {hasMore ? (
          <div className="nothing-loadmore-state">
            {isLoading ? (
              <span className="nothing-inline-loading">
                <Spinner size="sm" />
                <small>Loading more stations</small>
              </span>
            ) : (
              <small>Scroll for more</small>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MapSidebar
