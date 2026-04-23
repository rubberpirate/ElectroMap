const MIN_MAPBOX_TOKEN_LENGTH = 20

export const isValidMapboxToken = (token) => {
  if (typeof token !== 'string') {
    return false
  }

  const normalized = token.trim()
  if (!normalized || normalized.includes('...')) {
    return false
  }

  const hasValidPrefix = normalized.startsWith('pk.') || normalized.startsWith('sk.')

  return hasValidPrefix && normalized.length >= MIN_MAPBOX_TOKEN_LENGTH
}

export const getMapboxToken = () => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  return isValidMapboxToken(token) ? token.trim() : ''
}
