import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Filter,
  LocateFixed,
  MapPinned,
  Search,
  Star,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import api from '../../services/api'
import { Input, Spinner } from '../ui'
import StationCard from '../station/StationCard'
import RoutePlannerPanel from './RoutePlannerPanel'

const chargerTypeOptions = [
  { label: 'Level 1', value: 'Level1' },
  { label: 'Level 2', value: 'Level2' },
  { label: 'DC Fast', value: 'DC_Fast' },
  { label: 'Tesla', value: 'Tesla_Supercharger' },
]

const sortOptions = [
  { label: 'Nearest', value: 'nearest' },
  { label: 'Highest Rated', value: 'highest_rated' },
  { label: 'Most Available', value: 'most_available' },
]

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
  routePlannerSummary,
  hasActiveRoute,
  isRoutePlanning,
  mapboxToken,
  onPlanRoute,
  onClearRoute,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const listContainerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const activeFilterChips = useMemo(() => {
    const chips = []

    for (const chargerType of filters?.chargerType || []) {
      const option = chargerTypeOptions.find((item) => item.value === chargerType)
      chips.push({
        key: `charger-${chargerType}`,
        label: option?.label || chargerType,
        remove: () => {
          onFiltersChange({
            chargerType: (filters?.chargerType || []).filter((value) => value !== chargerType),
          })
        },
      })
    }

    if (Number(filters?.minRating) > 0) {
      chips.push({
        key: 'min-rating',
        label: `Min ${filters.minRating} stars`,
        remove: () => onFiltersChange({ minRating: 0 }),
      })
    }

    if (filters?.openNow) {
      chips.push({
        key: 'open-now',
        label: 'Open now',
        remove: () => onFiltersChange({ openNow: false }),
      })
    }

    if (Number(filters?.maxDistance) !== 10) {
      chips.push({
        key: 'max-distance',
        label: `${filters.maxDistance} km`,
        remove: () => onFiltersChange({ maxDistance: 10 }),
      })
    }

    if ((filters?.sortBy || 'nearest') !== 'nearest') {
      const option = sortOptions.find((item) => item.value === filters.sortBy)
      chips.push({
        key: 'sort',
        label: option?.label || 'Sorted',
        remove: () => onFiltersChange({ sortBy: 'nearest' }),
      })
    }

    return chips
  }, [filters, onFiltersChange])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery.length < 2) {
      return undefined
    }

    let isActive = true

    const timer = window.setTimeout(async () => {
      setSearchLoading(true)

      try {
        const { data } = await api.get('/stations/search', {
          params: { q: trimmedQuery },
        })

        if (!isActive) {
          return
        }

        setSearchResults(data?.data?.stations || [])
      } catch {
        if (isActive) {
          setSearchResults([])
        }
      } finally {
        if (isActive) {
          setSearchLoading(false)
        }
      }
    }, 320)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [searchQuery])

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
        threshold: 0.35,
      },
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore])

  const toggleChargerType = (value) => {
    const current = filters?.chargerType || []

    if (current.includes(value)) {
      onFiltersChange({ chargerType: current.filter((item) => item !== value) })
      return
    }

    onFiltersChange({ chargerType: [...current, value] })
  }

  const handleSearchInputChange = (event) => {
    const nextQuery = event.target.value

    setSearchQuery(nextQuery)

    if (nextQuery.trim().length < 2) {
      setSearchResults([])
      setSearchLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto auto auto minmax(0, 1fr)',
        gap: '0.8rem',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Input
          value={searchQuery}
          onChange={handleSearchInputChange}
          placeholder="Search stations by name or city"
          leftIcon={<Search size={16} />}
          aria-label="Search stations"
        />

        <AnimatePresence>
          {(searchLoading || searchResults.length > 0) && searchQuery.trim().length >= 2 ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.35rem)',
                left: 0,
                right: 0,
                zIndex: 14,
                maxHeight: 240,
                overflowY: 'auto',
                borderRadius: '12px',
                padding: '0.3rem',
              }}
            >
              {searchLoading ? (
                <div
                  style={{
                    minHeight: 78,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Spinner size="sm" />
                </div>
              ) : (
                searchResults.map((station) => (
                  <button
                    key={station._id}
                    type="button"
                    className="focus-ring"
                    onClick={() => {
                      onSearchSelect?.(station)
                      setSearchQuery(station.stationName || '')
                      setSearchResults([])
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      textAlign: 'left',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      display: 'grid',
                      gap: '0.2rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{station.stationName}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {station.city}
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <RoutePlannerPanel
        mapboxToken={mapboxToken}
        isPlanning={isRoutePlanning}
        summary={routePlannerSummary}
        hasActiveRoute={hasActiveRoute}
        onPlanRoute={onPlanRoute}
        onClearRoute={onClearRoute}
      />

      <div className="glass-card" style={{ borderRadius: '12px' }}>
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          className="focus-ring"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            padding: '0.72rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
          }}
          aria-label="Toggle filter panel"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Filter size={15} />
            Filters
          </span>
          <ChevronDown
            size={16}
            style={{ transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
          />
        </button>

        <AnimatePresence initial={false}>
          {filtersOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 0.8rem 0.85rem', display: 'grid', gap: '0.8rem' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Charger Type
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {chargerTypeOptions.map((option) => {
                      const active = (filters?.chargerType || []).includes(option.value)

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className="focus-ring"
                          onClick={() => toggleChargerType(option.value)}
                          style={{
                            borderRadius: '999px',
                            border: active
                              ? '1px solid rgba(0, 212, 255, 0.6)'
                              : '1px solid rgba(0, 212, 255, 0.22)',
                            background: active ? 'rgba(0, 212, 255, 0.14)' : 'rgba(10, 22, 40, 0.62)',
                            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            padding: '0.28rem 0.68rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Min Rating
                  </p>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 2, 3, 4, 5].map((ratingValue) => {
                      const active = Number(filters?.minRating || 0) >= ratingValue

                      return (
                        <button
                          key={ratingValue}
                          type="button"
                          className="focus-ring"
                          onClick={() => onFiltersChange({ minRating: ratingValue })}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: active ? 'var(--accent-amber)' : 'rgba(122, 157, 181, 0.7)',
                            padding: 0,
                          }}
                          aria-label={`Set minimum rating ${ratingValue}`}
                        >
                          <Star size={16} fill={active ? 'currentColor' : 'none'} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Open Now</span>
                  <button
                    type="button"
                    className="focus-ring"
                    onClick={() => onFiltersChange({ openNow: !filters?.openNow })}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: '999px',
                      border: '1px solid rgba(0, 212, 255, 0.28)',
                      background: filters?.openNow ? 'rgba(0, 212, 255, 0.32)' : 'rgba(10, 22, 40, 0.72)',
                      position: 'relative',
                      padding: 0,
                    }}
                    aria-label="Toggle open now"
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: filters?.openNow ? 22 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: '999px',
                        background: '#d8f6ff',
                        transition: 'left 180ms ease',
                      }}
                    />
                  </button>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.32rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Distance</span>
                    <span className="mono-data" style={{ fontSize: '0.85rem' }}>
                      {filters?.maxDistance || 10} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={filters?.maxDistance || 10}
                    onChange={(event) =>
                      onFiltersChange({
                        maxDistance: Number(event.target.value),
                      })
                    }
                    style={{ width: '100%' }}
                    aria-label="Set max distance"
                  />
                </div>

                <div>
                  <label htmlFor="sort-select" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Sort By
                  </label>
                  <select
                    id="sort-select"
                    className="focus-ring"
                    value={filters?.sortBy || 'nearest'}
                    onChange={(event) => onFiltersChange({ sortBy: event.target.value })}
                    style={{
                      width: '100%',
                      marginTop: '0.35rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 212, 255, 0.24)',
                      background: 'rgba(10, 22, 40, 0.68)',
                      minHeight: 38,
                      paddingInline: '0.55rem',
                    }}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFilterChips.length ? (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {activeFilterChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        className="focus-ring"
                        onClick={chip.remove}
                        style={{
                          border: '1px solid rgba(0, 212, 255, 0.28)',
                          borderRadius: '999px',
                          background: 'rgba(10, 22, 40, 0.76)',
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.28rem',
                          fontSize: '0.76rem',
                          padding: '0.24rem 0.58rem',
                        }}
                      >
                        {chip.label}
                        <X size={12} />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="focus-ring"
                      onClick={onResetFilters}
                      style={{
                        border: '1px solid rgba(255, 61, 90, 0.36)',
                        borderRadius: '999px',
                        background: 'rgba(255, 61, 90, 0.1)',
                        color: 'var(--accent-red)',
                        fontSize: '0.76rem',
                        padding: '0.24rem 0.58rem',
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        ref={listContainerRef}
        style={{
          minHeight: 0,
          overflowY: 'auto',
          display: 'grid',
          gap: '0.62rem',
          paddingRight: '0.2rem',
          alignContent: 'start',
        }}
      >
        {stations.map((station) => (
          <StationCard
            key={station._id}
            station={station}
            isActive={String(selectedStationId) === String(station._id)}
            onClick={() => onSelectStation?.(station)}
            onMouseEnter={() => onHoverStation?.(station._id)}
            onMouseLeave={() => onHoverStation?.(null)}
          />
        ))}

        {!isLoading && stations.length === 0 ? (
          <div
            className="glass-card"
            style={{
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <MapPinned size={24} style={{ margin: '0 auto 0.42rem', opacity: 0.86 }} />
            <p style={{ marginBottom: '0.35rem' }}>No stations found.</p>
            <small>Try widening distance or changing filters.</small>
          </div>
        ) : null}

        {isLoading && stations.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="glass-card skeleton" style={{ height: 118, borderRadius: '12px' }} />
            ))
          : null}

        {error ? (
          <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--accent-red)' }}>
            {error}
          </div>
        ) : null}

        <div ref={loadMoreRef} style={{ height: 10 }} aria-hidden="true" />

        {hasMore ? (
          <div style={{ paddingBottom: '0.5rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.82rem' }}>
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Spinner size="sm" />
                Loading more stations
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <LocateFixed size={14} />
                Scroll for more
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MapSidebar
