import { useEffect } from 'react'

const SOURCE_ID = 'electromap-route-source'
const LAYER_ID_OUTER = 'electromap-route-line-outer'
const LAYER_ID_INNER = 'electromap-route-line-inner'

const hasUsableStyle = (map) => Boolean(map && map.style)

const removeRouteVisuals = (map) => {
  if (!map || !hasUsableStyle(map)) {
    return
  }

  try {
    if (map.getLayer(LAYER_ID_INNER)) {
      map.removeLayer(LAYER_ID_INNER)
    }

    if (map.getLayer(LAYER_ID_OUTER)) {
      map.removeLayer(LAYER_ID_OUTER)
    }

    if (map.getSource(SOURCE_ID)) {
      map.removeSource(SOURCE_ID)
    }
  } catch {
    // Ignore style teardown race conditions during route cleanup.
  }
}

const drawRouteVisuals = (map, routeGeoJSON) => {
  if (!map || !routeGeoJSON || !hasUsableStyle(map)) {
    return
  }

  try {
    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(routeGeoJSON)
    } else {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: routeGeoJSON,
      })
    }

    if (!map.getLayer(LAYER_ID_OUTER)) {
      map.addLayer({
        id: LAYER_ID_OUTER,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f0f0f0',
          'line-width': 10,
          'line-opacity': 0.25,
          'line-blur': 1,
        },
      })
    }

    if (!map.getLayer(LAYER_ID_INNER)) {
      map.addLayer({
        id: LAYER_ID_INNER,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f0f0f0',
          'line-width': 4,
          'line-opacity': 0.95,
        },
      })
    }
  } catch {
    // Ignore style teardown/reload races; styledata listener will redraw.
  }
}

function RouteLayer({ map, routeGeoJSON }) {
  useEffect(() => {
    if (!map) {
      return undefined
    }

    let active = true

    const redraw = () => {
      if (!active || !hasUsableStyle(map)) {
        return
      }

      if (!routeGeoJSON) {
        removeRouteVisuals(map)
        return
      }

      drawRouteVisuals(map, routeGeoJSON)
    }

    try {
      redraw()
      map.on('styledata', redraw)
    } catch {
      return undefined
    }

    return () => {
      active = false

      try {
        map.off('styledata', redraw)
      } catch {
        // Ignore.
      }

      if (!routeGeoJSON && hasUsableStyle(map)) {
        try {
          removeRouteVisuals(map)
        } catch {
          // Ignore cleanup races.
        }
      }
    }
  }, [map, routeGeoJSON])

  return null
}

export default RouteLayer
