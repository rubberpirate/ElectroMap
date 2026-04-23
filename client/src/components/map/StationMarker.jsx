const getStationMarkerTone = (station) => {
  const available = Number(station?.availableChargers) || 0
  const total = Number(station?.totalChargers) || 0

  if (total <= 0 || station?.status === 'offline') {
    return {
      fill: '#8ca1b5',
      glow: '0 0 0 1px rgba(140, 161, 181, 0.42), 0 0 18px rgba(140, 161, 181, 0.24)',
    }
  }

  if (available > 0) {
    return {
      fill: '#00ff88',
      glow: '0 0 0 1px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.34)',
    }
  }

  return {
    fill: '#ff3d5a',
    glow: '0 0 0 1px rgba(255, 61, 90, 0.48), 0 0 20px rgba(255, 61, 90, 0.3)',
  }
}

const lightningPath =
  '<path d="M13.5 2L5 13h5l-1 9 9-12h-5l.5-8z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'

const updateStationTooltip = ({ markerElement, station }) => {
  if (!markerElement) {
    return
  }

  const stationName = station?.stationName || 'Station'
  const stationCity = station?.city ? ` - ${station.city}` : ''

  let tooltip = markerElement.querySelector('.station-marker-tooltip')

  if (!tooltip) {
    tooltip = document.createElement('span')
    tooltip.className = 'station-marker-tooltip'

    Object.assign(tooltip.style, {
      position: 'absolute',
      left: '50%',
      bottom: 'calc(100% + 10px)',
      transform: 'translateX(-50%)',
      borderRadius: '999px',
      border: '1px solid rgba(0, 212, 255, 0.35)',
      background: 'rgba(5, 10, 14, 0.92)',
      color: '#dff8ff',
      fontSize: '0.72rem',
      lineHeight: '1',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      padding: '0.34rem 0.55rem',
      opacity: '0',
      transition: 'opacity 130ms ease, transform 130ms ease',
      zIndex: '12',
    })

    markerElement.appendChild(tooltip)
  }

  tooltip.textContent = `${stationName}${stationCity}`
}

const applyStationTone = ({ markerElement, station }) => {
  if (!markerElement) {
    return
  }

  const tone = getStationMarkerTone(station)

  markerElement.style.color = tone.fill
  markerElement.style.boxShadow = tone.glow
}

export const createStationMarkerElement = ({ station }) => {
  const marker = document.createElement('button')

  marker.type = 'button'
  marker.className = 'focus-ring station-map-marker'
  marker.dataset.stationId = String(station?._id)
  marker.dataset.stationName = String(station?.stationName || 'Station')
  marker.setAttribute('aria-label', `Station marker for ${station?.stationName || 'station'}`)
  marker.title = `${station?.stationName || 'Station'}${station?.city ? `, ${station.city}` : ''}`

  Object.assign(marker.style, {
    width: '34px',
    height: '34px',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.62)',
    background: 'rgba(5, 10, 14, 0.92)',
    color: '#00ff88',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 1px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.34)',
    cursor: 'pointer',
    transition: 'transform 140ms ease, box-shadow 180ms ease, color 180ms ease',
    position: 'relative',
  })

  marker.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">${lightningPath}</svg>`

  marker.addEventListener('mouseenter', () => {
    const tooltip = marker.querySelector('.station-marker-tooltip')

    if (!tooltip) {
      return
    }

    tooltip.style.opacity = '1'
    tooltip.style.transform = 'translateX(-50%) translateY(-2px)'
  })

  marker.addEventListener('mouseleave', () => {
    const tooltip = marker.querySelector('.station-marker-tooltip')

    if (!tooltip) {
      return
    }

    tooltip.style.opacity = '0'
    tooltip.style.transform = 'translateX(-50%)'
  })

  updateStationMarkerElement({ markerElement: marker, station })

  return marker
}

export const updateStationMarkerElement = ({ markerElement, station }) => {
  if (!markerElement) {
    return
  }

  markerElement.dataset.stationName = String(station?.stationName || 'Station')
  markerElement.title = `${station?.stationName || 'Station'}${station?.city ? `, ${station.city}` : ''}`
  markerElement.setAttribute('aria-label', `Station marker for ${station?.stationName || 'station'}`)

  applyStationTone({ markerElement, station })
  updateStationTooltip({ markerElement, station })
}

export const createClusterMarkerElement = ({ count }) => {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = 'focus-ring'
  marker.setAttribute('aria-label', `Cluster marker with ${count} stations`)
  marker.title = `${count} stations`

  Object.assign(marker.style, {
    minWidth: '40px',
    height: '40px',
    paddingInline: '0.5rem',
    borderRadius: '999px',
    border: '1px solid rgba(0, 212, 255, 0.55)',
    background:
      'radial-gradient(circle at 30% 20%, rgba(0, 212, 255, 0.62), rgba(9, 32, 52, 0.96) 75%)',
    color: '#dff8ff',
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 26px rgba(0, 212, 255, 0.3)',
    cursor: 'pointer',
    transition: 'transform 140ms ease, box-shadow 180ms ease',
  })

  marker.textContent = String(count)

  marker.onmouseenter = () => {
    marker.style.transform = 'scale(1.06)'
    marker.style.boxShadow = '0 0 32px rgba(0, 212, 255, 0.38)'
  }

  marker.onmouseleave = () => {
    marker.style.transform = 'scale(1)'
    marker.style.boxShadow = '0 0 26px rgba(0, 212, 255, 0.3)'
  }

  return marker
}

export const applyMarkerHighlightState = ({ markerElement, isSelected, isHovered }) => {
  if (!markerElement) {
    return
  }

  const scale = isHovered ? 1.16 : isSelected ? 1.1 : 1
  markerElement.style.transform = `scale(${scale})`
  markerElement.style.zIndex = isHovered || isSelected ? '4' : '1'
}

export default createStationMarkerElement
