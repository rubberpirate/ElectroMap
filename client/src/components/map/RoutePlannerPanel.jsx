import { Navigation, Route, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { fetchMapTilerGeocodeSuggestions } from '../../utils/maptiler'
import { Button, Input } from '../ui'

const toSuggestion = (feature) => {
  const [lng, lat] = feature?.center || []

  return {
    id: feature?.id || `${lng}-${lat}`,
    placeName: feature?.place_name || feature?.text || 'Selected location',
    coordinates:
      Number.isFinite(Number(lng)) && Number.isFinite(Number(lat))
        ? [Number(lng), Number(lat)]
        : null,
  }
}

const fetchGeocodeSuggestions = async (apiKey, query) => {
  if (!apiKey || !query) {
    return []
  }

  const features = await fetchMapTilerGeocodeSuggestions(apiKey, query, 5)
  return features.map(toSuggestion).filter((item) => Array.isArray(item.coordinates))
}

function RoutePlannerPanel({
  maptilerKey,
  isPlanning,
  summary,
  hasActiveRoute,
  onPlanRoute,
  onClearRoute,
}) {
  const [open, setOpen] = useState(true)
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [startSelection, setStartSelection] = useState(null)
  const [endSelection, setEndSelection] = useState(null)
  const [batteryRange, setBatteryRange] = useState('220')
  const [startSuggestions, setStartSuggestions] = useState([])
  const [endSuggestions, setEndSuggestions] = useState([])
  const [isSearchingStart, setIsSearchingStart] = useState(false)
  const [isSearchingEnd, setIsSearchingEnd] = useState(false)
  const [plannerError, setPlannerError] = useState('')

  useEffect(() => {
    const query = startInput.trim()
    if (query.length < 3) {
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setIsSearchingStart(true)
      try {
        const suggestions = await fetchGeocodeSuggestions(maptilerKey, query)
        if (active) {
          setStartSuggestions(suggestions)
        }
      } catch {
        if (active) {
          setStartSuggestions([])
        }
      } finally {
        if (active) {
          setIsSearchingStart(false)
        }
      }
    }, 320)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [maptilerKey, startInput])

  useEffect(() => {
    const query = endInput.trim()
    if (query.length < 3) {
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setIsSearchingEnd(true)
      try {
        const suggestions = await fetchGeocodeSuggestions(maptilerKey, query)
        if (active) {
          setEndSuggestions(suggestions)
        }
      } catch {
        if (active) {
          setEndSuggestions([])
        }
      } finally {
        if (active) {
          setIsSearchingEnd(false)
        }
      }
    }, 320)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [endInput, maptilerKey])

  const handleSubmitPlanner = async (event) => {
    event.preventDefault()
    setPlannerError('')

    const range = Number(batteryRange)
    if (!startSelection?.coordinates || !endSelection?.coordinates) {
      setPlannerError('Select both start and end locations from suggestions.')
      return
    }

    if (!Number.isFinite(range) || range <= 0) {
      setPlannerError('Battery range must be a valid positive number.')
      return
    }

    try {
      await onPlanRoute?.({
        start: startSelection,
        end: endSelection,
        batteryRangeKm: range,
      })
    } catch (requestError) {
      setPlannerError(requestError?.message || 'Unable to plan route right now.')
    }
  }

  return (
    <div className="glass-card" style={{ borderRadius: '12px', overflow: 'visible' }}>
      <button
        type="button"
        className="focus-ring"
        onClick={() => setOpen((current) => !current)}
        aria-label="Toggle route planner"
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          padding: '0.72rem 0.8rem',
          display: 'inline-flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Route size={15} />
          Trip Planner
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          {open ? 'Hide' : 'Plan'}
        </span>
      </button>

      {open ? (
        <div style={{ padding: '0 0.8rem 0.8rem', display: 'grid', gap: '0.62rem' }}>
          {!maptilerKey ? (
            <div
              className="glass-card"
              style={{
                borderRadius: '12px',
                borderColor: 'rgba(255, 77, 109, 0.34)',
                background: 'rgba(255, 77, 109, 0.08)',
                color: 'var(--red-alert)',
                fontSize: '0.82rem',
                padding: '0.5rem',
              }}
            >
              A valid VITE_MAPTILER_KEY is required for route planning.
            </div>
          ) : null}

          {plannerError ? (
            <div
              className="glass-card"
              style={{
                borderRadius: '2px',
                borderColor: 'rgba(255, 61, 90, 0.4)',
                background: 'rgba(255, 61, 90, 0.08)',
                color: 'var(--accent-red)',
                fontSize: '0.82rem',
                padding: '0.5rem',
              }}
            >
              {plannerError}
            </div>
          ) : null}

          <form onSubmit={handleSubmitPlanner} style={{ display: 'grid', gap: '0.58rem' }}>
            <div style={{ position: 'relative' }}>
              <Input
                label="Start location"
                value={startInput}
                onChange={(event) => {
                  setStartInput(event.target.value)
                  setStartSelection(null)
                  if (event.target.value.trim().length < 3) {
                    setStartSuggestions([])
                  }
                }}
                placeholder="Search start location"
                aria-label="Route start location"
              />
              {(isSearchingStart || startSuggestions.length > 0) && startInput.trim().length >= 3 ? (
                <div className="map-geocode-dropdown">
                  {isSearchingStart ? (
                    <small style={{ color: 'var(--text-secondary)' }}>Searching...</small>
                  ) : (
                    startSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="focus-ring map-geocode-option"
                        onClick={() => {
                          setStartSelection(item)
                          setStartInput(item.placeName)
                          setStartSuggestions([])
                        }}
                      >
                        {item.placeName}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div style={{ position: 'relative' }}>
              <Input
                label="End location"
                value={endInput}
                onChange={(event) => {
                  setEndInput(event.target.value)
                  setEndSelection(null)
                  if (event.target.value.trim().length < 3) {
                    setEndSuggestions([])
                  }
                }}
                placeholder="Search destination"
                aria-label="Route end location"
              />
              {(isSearchingEnd || endSuggestions.length > 0) && endInput.trim().length >= 3 ? (
                <div className="map-geocode-dropdown">
                  {isSearchingEnd ? (
                    <small style={{ color: 'var(--text-secondary)' }}>Searching...</small>
                  ) : (
                    endSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="focus-ring map-geocode-option"
                        onClick={() => {
                          setEndSelection(item)
                          setEndInput(item.placeName)
                          setEndSuggestions([])
                        }}
                      >
                        {item.placeName}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <Input
              label="Current battery range (km)"
              type="number"
              min={20}
              value={batteryRange}
              onChange={(event) => setBatteryRange(event.target.value)}
              aria-label="Battery range in kilometers"
            />

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <Button
                type="submit"
                size="sm"
                leftIcon={<Navigation size={14} />}
                isLoading={isPlanning}
                disabled={!maptilerKey}
              >
                Plan Route
              </Button>
              {hasActiveRoute ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  leftIcon={<X size={14} />}
                  onClick={onClearRoute}
                >
                  Clear Route
                </Button>
              ) : null}
            </div>
          </form>

          {summary ? (
            <div
              className="glass-card"
              style={{
                borderRadius: '2px',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: '0.55rem',
                display: 'grid',
                gap: '0.3rem',
                fontSize: '0.82rem',
              }}
            >
              <strong>{summary.title || 'Route summary'}</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {summary.distanceKm.toFixed(1)} km • {Math.round(summary.durationMin)} min
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Stops needed: {summary.requiredStops} • Charging time: {summary.estimatedChargingMin} min
              </span>
              {summary.foundStations < summary.requiredStops ? (
                <span style={{ color: 'var(--accent-amber)' }}>
                  Limited nearby stations found for all planned stops.
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <style>
        {`
          .map-geocode-dropdown {
            position: absolute;
            top: calc(100% + 0.35rem);
            left: 0;
            right: 0;
            z-index: 17;
            display: grid;
            gap: 0.28rem;
            background: rgba(15, 30, 48, 0.96);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 0.34rem;
            max-height: 180px;
            overflow-y: auto;
          }

          .map-geocode-option {
            width: 100%;
            border: none;
            background: transparent;
            color: var(--text-primary);
            text-align: left;
            border-radius: 2px;
            min-height: 32px;
            padding: 0.34rem 0.45rem;
            font-size: 0.8rem;
          }

          .map-geocode-option:hover {
            background: rgba(255, 255, 255, 0.06);
          }
        `}
      </style>
    </div>
  )
}

export default RoutePlannerPanel
