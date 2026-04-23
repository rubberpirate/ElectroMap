import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getMapTilerKey, getMapTilerStyle } from '../../utils/maptiler'
import RouteLayer from './RouteLayer'
import {
  applyMarkerHighlightState,
  createClusterMarkerElement,
  createStationMarkerElement,
  updateStationMarkerElement,
} from './StationMarker'

const INDIA_CENTER = [78.9629, 20.5937]

const getStationCoordinates = (station) => {
  const coordinates = station?.location?.coordinates

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lng = Number(coordinates[0])
    const lat = Number(coordinates[1])

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lng, lat]
    }
  }

  const lng = Number(station?.lng)
  const lat = Number(station?.lat)

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lng, lat]
  }

  return null
}

const haversineDistanceKm = (from, to) => {
  const fromLat = Number(from?.lat)
  const fromLng = Number(from?.lng)
  const toLat = Number(to?.lat)
  const toLng = Number(to?.lng)

  if ([fromLat, fromLng, toLat, toLng].some((value) => !Number.isFinite(value))) {
    return null
  }

  const earthRadiusKm = 6371
  const toRadians = (value) => (value * Math.PI) / 180

  const dLat = toRadians(toLat - fromLat)
  const dLng = toRadians(toLng - fromLng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function MapView({
  stations,
  selectedStation,
  highlightedStationId,
  userLocation,
  mapCenter,
  mapZoom,
  mapStyle,
  routeGeoJSON,
  routePlannerStops = [],
  onStationSelect,
  onStationHover,
  onViewportSettled,
  onVisibleStationsChange,
  onUserLocationChange,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const stationMarkersRef = useRef(new Map())
  const clusterMarkersRef = useRef([])
  const routePlannerMarkersRef = useRef([])
  const viewportDebounceRef = useRef(null)
  const mapStyleRef = useRef('')
  const hasCenteredOnUserRef = useRef(false)
  const hasAutoFitStationsRef = useRef(false)
  const initialUserLocationRef = useRef(userLocation)

  const onStationSelectRef = useRef(onStationSelect)
  const onStationHoverRef = useRef(onStationHover)
  const onUserLocationChangeRef = useRef(onUserLocationChange)

  const syncMarkersRef = useRef(() => {})
  const scheduleViewportSnapshotRef = useRef(() => {})
  const emitViewportSnapshotRef = useRef(() => {})

  const [mapInstance, setMapInstance] = useState(null)
  const [mapError, setMapError] = useState('')

  const maptilerKey = getMapTilerKey()
  const tokenError = !maptilerKey
    ? 'A valid VITE_MAPTILER_KEY is required to render the map.'
    : ''

  const clusterEngineRef = useRef(
    new Supercluster({
      radius: 65,
      maxZoom: 16,
      minZoom: 0,
    }),
  )

  useEffect(() => {
    onStationSelectRef.current = onStationSelect
  }, [onStationSelect])

  useEffect(() => {
    onStationHoverRef.current = onStationHover
  }, [onStationHover])

  useEffect(() => {
    onUserLocationChangeRef.current = onUserLocationChange
  }, [onUserLocationChange])

  const stationById = useMemo(() => {
    return new Map((stations || []).map((station) => [String(station?._id), station]))
  }, [stations])

  const pointFeatures = useMemo(() => {
    return (stations || [])
      .map((station) => {
        const coordinates = getStationCoordinates(station)

        if (!coordinates) {
          return null
        }

        return {
          type: 'Feature',
          properties: {
            stationId: String(station._id),
          },
          geometry: {
            type: 'Point',
            coordinates,
          },
        }
      })
      .filter(Boolean)
  }, [stations])

  const ensureUserMarker = useCallback(({ lat, lng }) => {
    const map = mapRef.current

    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return
    }

    const nextLngLat = [lng, lat]

    if (!userMarkerRef.current) {
      const markerElement = document.createElement('div')
      markerElement.className = 'electromap-user-marker'
      markerElement.setAttribute('aria-label', 'Your current location')

      const centerDot = document.createElement('span')
      centerDot.className = 'electromap-user-marker-dot'

      markerElement.appendChild(centerDot)

      userMarkerRef.current = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(nextLngLat)
        .addTo(map)

      return
    }

    userMarkerRef.current.setLngLat(nextLngLat)
  }, [])

  const cleanupStationMarker = useCallback((stationId) => {
    const markerState = stationMarkersRef.current.get(stationId)

    if (!markerState) {
      return
    }

    markerState.element.removeEventListener('mouseenter', markerState.onMouseEnter)
    markerState.element.removeEventListener('mouseleave', markerState.onMouseLeave)
    markerState.element.removeEventListener('click', markerState.onClick)
    markerState.marker.remove()
    stationMarkersRef.current.delete(stationId)
  }, [])

  const cleanupClusterMarkers = useCallback(() => {
    clusterMarkersRef.current.forEach((marker) => marker.remove())
    clusterMarkersRef.current = []
  }, [])

  const cleanupRoutePlannerMarkers = useCallback(() => {
    routePlannerMarkersRef.current.forEach((marker) => marker.remove())
    routePlannerMarkersRef.current = []
  }, [])

  const cleanupAllStationMarkers = useCallback(() => {
    const stationIds = Array.from(stationMarkersRef.current.keys())

    for (const stationId of stationIds) {
      cleanupStationMarker(stationId)
    }
  }, [cleanupStationMarker])

  const emitViewportSnapshot = useCallback(() => {
    const map = mapRef.current

    if (!map || !onViewportSettled) {
      return
    }

    const center = map.getCenter()
    const bounds = map.getBounds()
    const northEast = bounds.getNorthEast()

    const radiusKm =
      haversineDistanceKm(
        { lat: center.lat, lng: center.lng },
        { lat: northEast.lat, lng: northEast.lng },
      ) || 10

    onViewportSettled({
      lat: center.lat,
      lng: center.lng,
      radiusKm,
      zoom: map.getZoom(),
    })
  }, [onViewportSettled])

  const scheduleViewportSnapshot = useCallback(() => {
    if (viewportDebounceRef.current) {
      window.clearTimeout(viewportDebounceRef.current)
    }

    viewportDebounceRef.current = window.setTimeout(() => {
      emitViewportSnapshot()
    }, 500)
  }, [emitViewportSnapshot])

  const syncMarkers = useCallback(() => {
    const map = mapRef.current

    if (!map || !map.isStyleLoaded()) {
      return
    }

    const bounds = map.getBounds()
    const zoom = Math.round(map.getZoom())

    const clusterResults = clusterEngineRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom,
    )

    const selectedStationId = String(selectedStation?._id || '')
    const hoveredStationId = String(highlightedStationId || '')
    const activeStationIds = new Set()

    cleanupClusterMarkers()

    for (const item of clusterResults) {
      const [lng, lat] = item.geometry.coordinates

      if (item.properties.cluster) {
        const clusterCount = Number(item.properties.point_count) || 0
        const clusterId = item.id

        const clusterElement = createClusterMarkerElement({ count: clusterCount })

        clusterElement.addEventListener('click', () => {
          const expansionZoom = Math.min(
            clusterEngineRef.current.getClusterExpansionZoom(clusterId),
            18,
          )

          map.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 500,
          })
        })

        const clusterMarker = new maplibregl.Marker({
          element: clusterElement,
          anchor: 'center',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        clusterMarkersRef.current.push(clusterMarker)
        continue
      }

      const stationId = String(item.properties.stationId)
      const station = stationById.get(stationId)

      if (!station) {
        continue
      }

      activeStationIds.add(stationId)

      if (!stationMarkersRef.current.has(stationId)) {
        const markerElement = createStationMarkerElement({ station })

        const onMouseEnter = () => {
          onStationHoverRef.current?.(stationId)
        }

        const onMouseLeave = () => {
          onStationHoverRef.current?.(null)
        }

        const onClick = (event) => {
          event.stopPropagation()

          markerElement.classList.remove('station-map-marker-bounce')
          // Trigger the bounce animation on every click.
          void markerElement.offsetWidth
          markerElement.classList.add('station-map-marker-bounce')

          onStationSelectRef.current?.(station)

          map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 12.8),
            duration: 550,
            essential: true,
          })
        }

        markerElement.addEventListener('mouseenter', onMouseEnter)
        markerElement.addEventListener('mouseleave', onMouseLeave)
        markerElement.addEventListener('click', onClick)

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        stationMarkersRef.current.set(stationId, {
          marker,
          element: markerElement,
          onMouseEnter,
          onMouseLeave,
          onClick,
        })
      } else {
        const markerState = stationMarkersRef.current.get(stationId)

        markerState.marker.setLngLat([lng, lat])
        updateStationMarkerElement({ markerElement: markerState.element, station })
      }

      const markerState = stationMarkersRef.current.get(stationId)

      applyMarkerHighlightState({
        markerElement: markerState.element,
        isSelected: selectedStationId === stationId,
        isHovered: hoveredStationId === stationId,
      })
    }

    for (const [stationId] of stationMarkersRef.current.entries()) {
      if (!activeStationIds.has(stationId)) {
        cleanupStationMarker(stationId)
      }
    }

    if (onVisibleStationsChange) {
      const visibleStations = (stations || []).filter((station) => {
        const coordinates = getStationCoordinates(station)

        if (!coordinates) {
          return false
        }

        return bounds.contains(coordinates)
      })

      onVisibleStationsChange(visibleStations)
    }
  }, [
    cleanupClusterMarkers,
    cleanupStationMarker,
    highlightedStationId,
    onVisibleStationsChange,
    selectedStation?._id,
    stationById,
    stations,
  ])

  useEffect(() => {
    syncMarkersRef.current = syncMarkers
  }, [syncMarkers])

  useEffect(() => {
    scheduleViewportSnapshotRef.current = scheduleViewportSnapshot
  }, [scheduleViewportSnapshot])

  useEffect(() => {
    emitViewportSnapshotRef.current = emitViewportSnapshot
  }, [emitViewportSnapshot])

  useEffect(() => {
    clusterEngineRef.current.load(pointFeatures)
    syncMarkersRef.current()
  }, [pointFeatures])

  useEffect(() => {
    if (stationMarkersRef.current.size === 0) {
      return
    }

    const selectedStationId = String(selectedStation?._id || '')
    const hoveredStationId = String(highlightedStationId || '')

    stationMarkersRef.current.forEach(({ element }, stationId) => {
      applyMarkerHighlightState({
        markerElement: element,
        isSelected: stationId === selectedStationId,
        isHovered: stationId === hoveredStationId,
      })
    })
  }, [highlightedStationId, selectedStation?._id])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return undefined
    }

    cleanupRoutePlannerMarkers()

    if (!Array.isArray(routePlannerStops) || !routePlannerStops.length) {
      return undefined
    }

    routePlannerStops.forEach((stop, index) => {
      const [lng, lat] = stop?.coordinates || []

      if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
        return
      }

      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.className = `focus-ring route-stop-marker route-stop-marker-${stop?.kind || 'checkpoint'}`
      markerElement.setAttribute(
        'aria-label',
        `Route stop ${index + 1}: ${stop?.stationName || 'Charging checkpoint'}`,
      )
      markerElement.title = `Stop ${index + 1}: ${stop?.stationName || 'Charging checkpoint'}`
      markerElement.innerHTML = `<span>${index + 1}</span>`

      if (stop?.kind === 'station' && stop?.station) {
        markerElement.addEventListener('click', () => {
          onStationSelectRef.current?.(stop.station)
        })
      }

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([Number(lng), Number(lat)])
        .addTo(map)

      routePlannerMarkersRef.current.push(marker)
    })

    return () => {
      cleanupRoutePlannerMarkers()
    }
  }, [cleanupRoutePlannerMarkers, routePlannerStops])

  useEffect(() => {
    if (!mapContainerRef.current) {
      return undefined
    }

    if (mapRef.current) {
      return undefined
    }

    if (!maptilerKey) {
      return undefined
    }

    const initialStyle = getMapTilerStyle(mapStyle)
    mapStyleRef.current = initialStyle
    const centerLng = Number(mapCenter?.[0])
    const centerLat = Number(mapCenter?.[1])
    const hasMapCenter = Number.isFinite(centerLng) && Number.isFinite(centerLat)

    const initialCenter = initialUserLocationRef.current
      ? [
          Number(initialUserLocationRef.current.lng),
          Number(initialUserLocationRef.current.lat),
        ]
      : hasMapCenter
        ? [centerLng, centerLat]
        : INDIA_CENTER

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyleRef.current,
      center: initialCenter,
      zoom: initialUserLocationRef.current ? 11.8 : Number(mapZoom) || 5,
      minZoom: 3,
      projection: 'mercator',
      antialias: true,
      attributionControl: false,
    })

    mapRef.current = map

    const navigationControl = new maplibregl.NavigationControl({ showCompass: true })
    map.addControl(navigationControl, 'top-right')

    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
      showUserLocation: false,
      showAccuracyCircle: false,
    })

    map.addControl(geolocateControl, 'top-right')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right')

    const handleGeolocate = (event) => {
      const nextLocation = {
        lat: Number(event?.coords?.latitude),
        lng: Number(event?.coords?.longitude),
      }

      if (!Number.isFinite(nextLocation.lat) || !Number.isFinite(nextLocation.lng)) {
        return
      }

      ensureUserMarker(nextLocation)
      onUserLocationChangeRef.current?.(nextLocation)
    }

    const handleMapUpdate = () => {
      syncMarkersRef.current()
      scheduleViewportSnapshotRef.current()
    }

    const handleMapLoad = () => {
      setMapInstance(map)
      syncMarkersRef.current()
      emitViewportSnapshotRef.current()

      if (!initialUserLocationRef.current) {
        window.setTimeout(() => {
          geolocateControl.trigger()
        }, 350)
      }
    }

    const handleMapError = (event) => {
      const message = event?.error?.message || 'Map rendering issue encountered.'
      setMapError(message)
    }

    geolocateControl.on('geolocate', handleGeolocate)
    map.on('load', handleMapLoad)
    map.on('moveend', handleMapUpdate)
    map.on('zoomend', handleMapUpdate)
    map.on('styledata', handleMapUpdate)
    map.on('error', handleMapError)

    return () => {
      geolocateControl.off('geolocate', handleGeolocate)
      map.off('load', handleMapLoad)
      map.off('moveend', handleMapUpdate)
      map.off('zoomend', handleMapUpdate)
      map.off('styledata', handleMapUpdate)
      map.off('error', handleMapError)

      cleanupClusterMarkers()
      cleanupRoutePlannerMarkers()

      cleanupAllStationMarkers()

      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }

      if (viewportDebounceRef.current) {
        window.clearTimeout(viewportDebounceRef.current)
      }

      map.remove()
      mapRef.current = null
      setMapInstance(null)
    }
  }, [
    cleanupAllStationMarkers,
    cleanupClusterMarkers,
    cleanupRoutePlannerMarkers,
    ensureUserMarker,
    mapCenter,
    mapStyle,
    mapZoom,
    maptilerKey,
  ])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !userLocation) {
      return
    }

    const nextLocation = {
      lat: Number(userLocation.lat),
      lng: Number(userLocation.lng),
    }

    if (!Number.isFinite(nextLocation.lat) || !Number.isFinite(nextLocation.lng)) {
      return
    }

    ensureUserMarker(nextLocation)

    if (!hasCenteredOnUserRef.current) {
      map.easeTo({
        center: [nextLocation.lng, nextLocation.lat],
        zoom: Math.max(map.getZoom(), 11),
        duration: 620,
      })

      hasCenteredOnUserRef.current = true
    }
  }, [ensureUserMarker, userLocation])

  useEffect(() => {
    const map = mapRef.current

    if (!map || selectedStation?._id) {
      return
    }

    const centerLng = Number(mapCenter?.[0])
    const centerLat = Number(mapCenter?.[1])

    if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) {
      return
    }

    const currentCenter = map.getCenter()
    const centerChanged =
      Math.abs(Number(currentCenter.lng) - centerLng) > 0.00001 ||
      Math.abs(Number(currentCenter.lat) - centerLat) > 0.00001

    if (!centerChanged) {
      return
    }

    const nextZoom = Number(mapZoom)
    map.easeTo({
      center: [centerLng, centerLat],
      zoom: Number.isFinite(nextZoom) ? nextZoom : map.getZoom(),
      duration: 420,
      essential: true,
    })
  }, [mapCenter, mapZoom, selectedStation?._id])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !map.isStyleLoaded() || selectedStation?._id || userLocation) {
      return
    }

    if (hasAutoFitStationsRef.current) {
      return
    }

    const coordinates = (stations || [])
      .map((station) => getStationCoordinates(station))
      .filter(Boolean)

    if (!coordinates.length) {
      return
    }

    hasAutoFitStationsRef.current = true

    if (coordinates.length === 1) {
      map.easeTo({
        center: coordinates[0],
        zoom: Math.max(map.getZoom(), 12),
        duration: 480,
        essential: true,
      })
      return
    }

    const bounds = new maplibregl.LngLatBounds()
    coordinates.forEach((coordinate) => {
      bounds.extend(coordinate)
    })

    map.fitBounds(bounds, {
      padding: { top: 90, right: 90, bottom: 90, left: 90 },
      maxZoom: 12.5,
      duration: 520,
      essential: true,
    })
  }, [selectedStation?._id, stations, userLocation])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    const nextStyle = getMapTilerStyle(mapStyle)

    if (mapStyleRef.current === nextStyle) {
      return
    }

    mapStyleRef.current = nextStyle
    map.setStyle(nextStyle)
  }, [mapStyle, maptilerKey])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !selectedStation) {
      return
    }

    const coordinates = getStationCoordinates(selectedStation)

    if (!coordinates) {
      return
    }

    map.flyTo({
      center: coordinates,
      zoom: Math.max(map.getZoom(), 12.8),
      duration: 550,
      essential: true,
    })
  }, [selectedStation])

  return (
    <div
      className="electromap-map-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary)',
      }}
    >
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

      {mapError || tokenError ? (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            left: '0.8rem',
            top: '0.8rem',
            zIndex: 4,
            maxWidth: 320,
            borderRadius: '2px',
            padding: '0.7rem 0.8rem',
            color: 'var(--accent-red)',
          }}
        >
          {mapError || tokenError}
        </div>
      ) : null}

      <RouteLayer map={mapInstance} routeGeoJSON={routeGeoJSON} />

      <style>
        {`
          .electromap-map-root .maplibregl-ctrl-group {
            border: 1px solid #2a2a2a;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
            background: rgba(18, 18, 18, 0.92);
          }

          .electromap-map-root .maplibregl-ctrl button .maplibregl-ctrl-icon {
            filter: invert(0.88);
          }

          .electromap-map-root .maplibregl-ctrl-scale {
            border: 1px solid #2a2a2a;
            background: rgba(18, 18, 18, 0.9);
            color: #f0f0f0;
          }

          .electromap-map-root .electromap-user-marker {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.82);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.25);
            display: grid;
            place-items: center;
            animation: pulse-glow 1.9s ease-in-out infinite;
          }

          .electromap-map-root .electromap-user-marker-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #f0f0f0;
          }

          .electromap-map-root .route-stop-marker {
            width: 28px;
            height: 28px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.65);
            color: #f0f0f0;
            font-family: 'Space Mono', monospace;
            font-size: 0.74rem;
            font-weight: 700;
            display: grid;
            place-items: center;
            box-shadow: 0 0 14px rgba(255, 255, 255, 0.18);
            background: #161616;
          }

          .electromap-map-root .route-stop-marker-station {
            border-color: rgba(255, 51, 51, 0.9);
            box-shadow: 0 0 0 2px #ff3333, 0 0 14px rgba(255, 51, 51, 0.36);
          }

          .electromap-map-root .station-map-marker-bounce {
            animation: station-marker-bounce 420ms ease;
          }

          @keyframes station-marker-bounce {
            0% { transform: translateY(0) scale(1); }
            35% { transform: translateY(-9px) scale(1.06); }
            70% { transform: translateY(2px) scale(1); }
            100% { transform: translateY(0) scale(1); }
          }
        `}
      </style>
    </div>
  )
}

export default MapView
