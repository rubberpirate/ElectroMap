const MIN_MAPTILER_KEY_LENGTH = 20
const DEFAULT_MAPTILER_STYLE = 'dark'

const MAP_STYLE_PATHS = {
  dark: 'streets-v4-dark',
  satellite: 'hybrid-v4',
}

export const isValidMapTilerKey = (key) => {
  if (typeof key !== 'string') {
    return false
  }

  const normalized = key.trim()
  return Boolean(normalized && !normalized.includes('...') && normalized.length >= MIN_MAPTILER_KEY_LENGTH)
}

export const getMapTilerKey = () => {
  const key = import.meta.env.VITE_MAPTILER_KEY
  return isValidMapTilerKey(key) ? key.trim() : ''
}

export const getMapTilerStyle = (style = DEFAULT_MAPTILER_STYLE) => {
  const apiKey = getMapTilerKey()
  if (!apiKey) {
    return ''
  }

  const styleKey = style === 'satellite' ? 'satellite' : 'dark'
  const stylePath = MAP_STYLE_PATHS[styleKey] || MAP_STYLE_PATHS.dark
  const url = new URL(`https://api.maptiler.com/maps/${stylePath}/style.json`)
  url.searchParams.set('key', apiKey)
  return url.toString()
}

export const buildOsrmRouteUrl = ({ start, end }) => {
  const [startLng, startLat] = start || []
  const [endLng, endLat] = end || []

  if (![startLng, startLat, endLng, endLat].every((value) => Number.isFinite(Number(value)))) {
    return ''
  }

  const endpoint = `https://router.project-osrm.org/route/v1/driving/${Number(startLng)},${Number(startLat)};${Number(endLng)},${Number(endLat)}`
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
  })

  return `${endpoint}?${params.toString()}`
}

export const fetchMapTilerGeocodeSuggestions = async (apiKey, query, limit = 5) => {
  if (!apiKey || !query) {
    return []
  }

  const endpoint = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`
  const params = new URLSearchParams({
    key: apiKey,
    autocomplete: 'true',
    limit: String(Math.max(1, Math.min(10, Number(limit) || 5))),
  })

  const response = await fetch(`${endpoint}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Unable to fetch location suggestions.')
  }

  const payload = await response.json()
  return Array.isArray(payload?.features) ? payload.features : []
}
