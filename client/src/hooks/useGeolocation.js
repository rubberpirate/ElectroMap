import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useMapStore } from '../store/mapStore'

function useGeolocation() {
  const userLocation = useMapStore((state) => state.userLocation)
  const setUserLocation = useMapStore((state) => state.setUserLocation)

  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const lastLocationToastAtRef = useRef(0)

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        setUserLocation(location)
        setIsLoading(false)

        const now = Date.now()
        if (now - lastLocationToastAtRef.current > 10000) {
          toast.success('Location detected')
          lastLocationToastAtRef.current = now
        }
      },
      (geoError) => {
        setError(geoError.message || 'Unable to fetch location.')
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      },
    )
  }, [setUserLocation])

  return {
    location: userLocation,
    error,
    isLoading,
    requestLocation,
  }
}

export default useGeolocation
