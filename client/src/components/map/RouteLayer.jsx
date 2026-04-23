import { useEffect } from 'react'

const SOURCE_ID = 'electromap-route-source'
const LAYER_ID_OUTER = 'electromap-route-line-outer'
const LAYER_ID_INNER = 'electromap-route-line-inner'

const removeRouteVisuals = (map) => {
  if (!map) {
    return
  }

  if (map.getLayer(LAYER_ID_INNER)) {
    map.removeLayer(LAYER_ID_INNER)
  }

  if (map.getLayer(LAYER_ID_OUTER)) {
    map.removeLayer(LAYER_ID_OUTER)
  }

  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID)
  }
}

const drawRouteVisuals = (map, routeGeoJSON) => {
  if (!map || !routeGeoJSON) {
    return
  }

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
}

function RouteLayer({ map, routeGeoJSON }) {
  useEffect(() => {
    if (!map) {
      return undefined
    }

    const redraw = () => {
      if (!routeGeoJSON) {
        removeRouteVisuals(map)
        return
      }

      drawRouteVisuals(map, routeGeoJSON)
    }

    redraw()
    map.on('styledata', redraw)

    return () => {
      map.off('styledata', redraw)
      if (!routeGeoJSON) {
        removeRouteVisuals(map)
      }
    }
  }, [map, routeGeoJSON])

  return null
}

export default RouteLayer
