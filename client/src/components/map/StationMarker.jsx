const getStationMarkerTone = (station) => {
  const available = Number(station?.availableChargers) || 0
  const total = Number(station?.totalChargers) || 0

  if (total <= 0 || station?.status === 'offline') {
    return {
      fill: '#9a9a9a',
      glow: '0 0 0 1px rgba(154, 154, 154, 0.35)',
    }
  }

  if (available > 0) {
    return {
      fill: '#f0f0f0',
      glow: '0 0 0 1px rgba(240, 240, 240, 0.45), 0 0 10px rgba(255, 255, 255, 0.12)',
    }
  }

  return {
    fill: '#ff3333',
    glow: '0 0 0 2px #ff3333, 0 0 12px rgba(255, 51, 51, 0.42)',
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
      borderRadius: '2px',
      border: '1px solid #2a2a2a',
      background: 'rgba(13, 13, 13, 0.95)',
      color: '#f0f0f0',
      fontSize: '0.66rem',
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
  const available = Number(station?.availableChargers) || 0
  const total = Number(station?.totalChargers) || 0

  marker.type = 'button'
  marker.className = 'focus-ring station-map-marker'
  marker.dataset.stationId = String(station?._id)
  marker.dataset.stationName = String(station?.stationName || 'Station')
  marker.setAttribute('aria-label', `Station marker for ${station?.stationName || 'station'}`)
  marker.title = `${station?.stationName || 'Station'}${station?.city ? `, ${station.city}` : ''}`

  Object.assign(marker.style, {
    width: '32px',
    height: '32px',
    borderRadius: '999px',
    border: '1px solid rgba(240, 240, 240, 0.8)',
    background: 'rgba(26, 26, 26, 0.96)',
    color: '#f0f0f0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 1px rgba(240, 240, 240, 0.2)',
    cursor: 'pointer',
    transition: 'transform 140ms ease, box-shadow 180ms ease, color 180ms ease',
    position: 'relative',
  })

  marker.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">${lightningPath}</svg>
    <span class="station-marker-capacity">${available}/${total || 0}</span>
  `

  const capacityElement = marker.querySelector('.station-marker-capacity')
  if (capacityElement) {
    Object.assign(capacityElement.style, {
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#8c8c8c',
      fontSize: '0.58rem',
      letterSpacing: '0.08em',
      fontFamily: 'Space Mono, monospace',
      fontWeight: '500',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    })
  }

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

  const available = Number(station?.availableChargers) || 0
  const total = Number(station?.totalChargers) || 0
  const capacityElement = markerElement.querySelector('.station-marker-capacity')
  if (capacityElement) {
    capacityElement.textContent = `${available}/${total || 0}`
  }

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
    minWidth: '26px',
    height: '26px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(240, 240, 240, 0.75)',
    fontFamily: 'Space Mono, monospace',
    fontWeight: '500',
    fontSize: '0.84rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textShadow: '0 0 10px rgba(240, 240, 240, 0.2)',
    cursor: 'pointer',
    transition: 'transform 140ms ease, color 180ms ease',
  })

  marker.textContent = String(count)

  marker.onmouseenter = () => {
    marker.style.transform = 'scale(1.06)'
    marker.style.color = '#ffffff'
  }

  marker.onmouseleave = () => {
    marker.style.transform = 'scale(1)'
    marker.style.color = 'rgba(240, 240, 240, 0.75)'
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
