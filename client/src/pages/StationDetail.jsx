import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Bolt,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Copy,
  MapPin,
  Navigation,
  ParkingCircle,
  Route,
  Shield,
  Star,
  Timer,
  Toilet,
  Wifi,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AuthModal from '../components/auth/AuthModal'
import { Navbar, PageWrapper } from '../components/layout'
import StationCard from '../components/station/StationCard'
import { Avatar, Badge, Button, Spinner } from '../components/ui'
import { getMockNearbyStations, getMockStationById } from '../data/mockStations'
import useAuth from '../hooks/useAuth'
import useSocket from '../hooks/useSocket'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useStationStore } from '../store/stationStore'
import { isMockModeEnabled, isMockStationId } from '../utils/mockMode'

const reviewTagOptions = ['Fast', 'Clean', 'Safe', 'Good Lighting', 'Reliable', 'Accessible']

const amenityIconMap = {
  wifi: Wifi,
  parking: ParkingCircle,
  restrooms: Toilet,
  cafe: Coffee,
  security: Shield,
}

const pricingMeta = [
  {
    key: 'perKwh',
    label: 'Per kWh',
    icon: Zap,
  },
  {
    key: 'perMinute',
    label: 'Per Minute',
    icon: Timer,
  },
  {
    key: 'sessionFee',
    label: 'Session Fee',
    icon: Bolt,
  },
]

const normalizeStatusKey = (value) => String(value || '').trim().toLowerCase()

const normalizeAmenityKey = (value) => String(value || '').trim().toLowerCase()

const parseClockToMinutes = (clockValue) => {
  if (!clockValue || typeof clockValue !== 'string') {
    return null
  }

  const [hours, minutes] = clockValue.split(':').map((part) => Number(part))

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

const isOpenNow = (operatingHours) => {
  if (!operatingHours) {
    return false
  }

  if (operatingHours.is24Hours) {
    return true
  }

  const openMinutes = parseClockToMinutes(operatingHours.open)
  const closeMinutes = parseClockToMinutes(operatingHours.close)

  if (openMinutes === null || closeMinutes === null) {
    return false
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes
}

const toCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (value) => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const getInitials = (value) => {
  const words = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) {
    return 'EM'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

const getStationCoordinates = (station) => {
  const coordinates = station?.location?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null
  }

  const lng = Number(coordinates[0])
  const lat = Number(coordinates[1])

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lng, lat]
}

const getLatestChargerUpdate = (chargers = []) => {
  if (!Array.isArray(chargers) || !chargers.length) {
    return null
  }

  return chargers.reduce((latest, charger) => {
    if (!charger?.lastUpdated) {
      return latest
    }

    const timestamp = new Date(charger.lastUpdated).getTime()
    if (Number.isNaN(timestamp)) {
      return latest
    }

    if (timestamp > latest) {
      return timestamp
    }

    return latest
  }, 0)
}

const formatChargerType = (value) => {
  if (value === 'DC_Fast') {
    return 'DC Fast'
  }

  if (value === 'Tesla_Supercharger') {
    return 'Tesla Supercharger'
  }

  return value || '--'
}

function StationDetail() {
  const { id: stationId } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const { isAuthenticated } = useAuth()
  const authUser = useAuthStore((state) => state.user)
  const saveStation = useStationStore((state) => state.saveStation)
  const unsaveStation = useStationStore((state) => state.unsaveStation)
  const setSavedStations = useStationStore((state) => state.setSavedStations)
  const savedStations = useStationStore((state) => state.savedStations)

  const [station, setStation] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(stationId))
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lastAvailabilityUpdate, setLastAvailabilityUpdate] = useState(null)

  const [reviews, setReviews] = useState([])
  const [reviewsPage, setReviewsPage] = useState(1)
  const [hasMoreReviews, setHasMoreReviews] = useState(false)
  const [isReviewsLoading, setIsReviewsLoading] = useState(false)
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    tags: [],
  })

  const [nearbyStations, setNearbyStations] = useState([])
  const [isNearbyLoading, setIsNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState('')

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [pendingAuthAction, setPendingAuthAction] = useState(null)

  const shouldUseMockData = isMockModeEnabled() || isMockStationId(stationId)

  const stationCoordinates = getStationCoordinates(station)

  const stationImages =
    Array.isArray(station?.images) && station.images.length ? station.images : []

  const safeImageIndex = Math.max(0, Math.min(activeImageIndex, stationImages.length - 1))
  const currentImage = stationImages[safeImageIndex]

  const totalChargers = Number(station?.totalChargers) || 0
  const availableChargers = Number(station?.availableChargers) || 0
  const availabilityPercent = totalChargers
    ? Math.round((availableChargers / totalChargers) * 100)
    : 0

  const isStationOpen = station?.isOpen ?? isOpenNow(station?.operatingHours)

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return Number(station?.rating) || 0
    }

    const total = reviews.reduce((sum, review) => sum + (Number(review?.rating) || 0), 0)
    return total / reviews.length
  }, [reviews, station?.rating])

  const totalReviewCount = Math.max(Number(station?.totalReviews) || 0, reviews.length)

  const ratingBreakdown = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: 0,
      percentage: 0,
    }))

    reviews.forEach((review) => {
      const rating = Number(review?.rating)
      const match = buckets.find((item) => item.star === rating)
      if (match) {
        match.count += 1
      }
    })

    const total = buckets.reduce((sum, item) => sum + item.count, 0)
    return buckets.map((item) => ({
      ...item,
      percentage: total ? Math.round((item.count / total) * 100) : 0,
    }))
  }, [reviews])

  useEffect(() => {
    if (!station?.stationName) {
      return undefined
    }

    const descriptionContent = `${station.stationName} in ${
      station.city || 'India'
    } with live charger availability, pricing, amenities, and EV driver reviews on ElectroMap.`

    let metaDescription = document.querySelector('meta[name="description"]')
    const previousDescription = metaDescription?.getAttribute('content') || ''

    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }

    metaDescription.setAttribute('content', descriptionContent)

    return () => {
      if (metaDescription) {
        metaDescription.setAttribute('content', previousDescription)
      }
    }
  }, [station?.city, station?.stationName])

  const requestAuthAction = (action) => {
    setPendingAuthAction(action)
    setIsAuthModalOpen(true)
  }

  const loadReviews = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!stationId) {
        return
      }

      if (append) {
        setIsLoadingMoreReviews(true)
      } else {
        setIsReviewsLoading(true)
      }
      setReviewsError('')

      try {
        if (shouldUseMockData) {
          const mockReviews = Array.from({ length: 4 }).map((_, index) => ({
            _id: `mock-review-${stationId}-${index + 1}`,
            rating: Math.max(3, 5 - (index % 3)),
            comment: 'Reliable charging session with predictable slot availability.',
            tags: ['Fast', 'Reliable'],
            createdAt: new Date(Date.now() - index * 86400000).toISOString(),
            userId: {
              _id: `mock-user-${index + 1}`,
              username: `driver_${index + 1}`,
              avatar: '',
            },
          }))

          setReviewsPage(1)
          setHasMoreReviews(false)
          setReviews((current) => (append ? [...current, ...mockReviews] : mockReviews))
          return
        }

        const { data } = await api.get(`/reviews/station/${stationId}`, {
          params: {
            page,
            limit: 5,
            sortBy: 'newest',
          },
        })

        const payload = data?.data || {}
        const nextReviews = payload?.reviews || []
        const pagination = payload?.pagination || {}
        const currentPage = Number(pagination.page) || page
        const totalPages = Number(pagination.pages) || 1

        setReviewsPage(currentPage)
        setHasMoreReviews(currentPage < totalPages)

        if (append) {
          setReviews((current) => {
            const seen = new Set(current.map((review) => String(review?._id)))
            const uniqueIncoming = nextReviews.filter(
              (review) => !seen.has(String(review?._id)),
            )
            return [...current, ...uniqueIncoming]
          })
          return
        }

        setReviews(nextReviews)
      } catch (requestError) {
        setReviewsError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Unable to load station reviews.',
        )
      } finally {
        setIsReviewsLoading(false)
        setIsLoadingMoreReviews(false)
      }
    },
    [shouldUseMockData, stationId],
  )

  useEffect(() => {
    if (!stationId) {
      return
    }

    let isActive = true

    const loadStation = async () => {
      setIsLoading(true)
      setError('')

      try {
        if (shouldUseMockData) {
          const mockStation = getMockStationById(stationId)

          if (!mockStation?._id) {
            setError('Station not found.')
            setStation(null)
            return
          }

          setStation(mockStation)
          setActiveImageIndex(0)
          setLastAvailabilityUpdate(new Date().toISOString())
          return
        }

        const { data } = await api.get(`/stations/${stationId}`)
        const stationData = data?.data?.station || null

        if (!isActive) {
          return
        }

        if (!stationData?._id) {
          setError('Station not found.')
          setStation(null)
          return
        }

        setStation(stationData)
        setActiveImageIndex(0)

        const latestChargerTimestamp = getLatestChargerUpdate(stationData?.chargers || [])
        setLastAvailabilityUpdate(
          latestChargerTimestamp || stationData?.updatedAt || new Date().toISOString(),
        )
      } catch (requestError) {
        if (!isActive) {
          return
        }

        const mockStation = getMockStationById(stationId)
        if (mockStation?._id) {
          setStation(mockStation)
          setActiveImageIndex(0)
          setLastAvailabilityUpdate(new Date().toISOString())
          setError('')
          return
        }

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Unable to load station details.',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadStation()
      void loadReviews({ page: 1, append: false })
    }, 0)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [loadReviews, shouldUseMockData, stationId])

  useEffect(() => {
    if (!socket || !station?._id) {
      return undefined
    }

    const currentStationId = String(station._id)

    const handleRealtimeChargerStatus = (payload) => {
      if (String(payload?.stationId) !== currentStationId) {
        return
      }

      useStationStore.getState().updateChargerStatusRealtime(payload)

      setStation((current) => {
        if (!current) {
          return current
        }

        const updatedChargers = Array.isArray(current.chargers)
          ? current.chargers.map((charger) =>
              String(charger?._id) === String(payload?.chargerId)
                ? {
                    ...charger,
                    status: payload?.status || charger?.status,
                    lastUpdated: new Date().toISOString(),
                  }
                : charger,
            )
          : current.chargers

        return {
          ...current,
          chargers: updatedChargers,
          availableChargers:
            typeof payload?.availableChargers === 'number'
              ? payload.availableChargers
              : current.availableChargers,
        }
      })

      setLastAvailabilityUpdate(new Date().toISOString())
    }

    socket.emit('subscribe:station', currentStationId)
    socket.on('charger:status_update', handleRealtimeChargerStatus)

    return () => {
      socket.emit('unsubscribe:station', currentStationId)
      socket.off('charger:status_update', handleRealtimeChargerStatus)
    }
  }, [socket, station?._id])

  useEffect(() => {
    if (!stationCoordinates || !station?._id) {
      return
    }

    let isActive = true

    const loadNearbyStations = async () => {
      setIsNearbyLoading(true)
      setNearbyError('')

      try {
        const [lng, lat] = stationCoordinates

        if (shouldUseMockData) {
          const fallback = getMockNearbyStations({
            lat,
            lng,
            radiusKm: 60,
            page: 1,
            limit: 6,
          })
          const filtered = (fallback?.stations || []).filter(
            (item) => String(item?._id) !== String(station?._id),
          )
          setNearbyStations(filtered.slice(0, 5))
          return
        }

        const { data } = await api.get('/stations/nearby', {
          params: {
            lat,
            lng,
            radius: 50000,
            limit: 6,
            page: 1,
          },
        })

        if (!isActive) {
          return
        }

        const stations = data?.data?.stations || []
        const filtered = stations.filter(
          (item) => String(item?._id) !== String(station?._id),
        )
        setNearbyStations(filtered.slice(0, 5))
      } catch {
        if (!isActive) {
          return
        }

        const [lng, lat] = stationCoordinates || []
        const fallback = getMockNearbyStations({
          lat,
          lng,
          radiusKm: 60,
          page: 1,
          limit: 6,
        })
        const filtered = (fallback?.stations || []).filter(
          (item) => String(item?._id) !== String(station?._id),
        )
        setNearbyStations(filtered.slice(0, 5))
        setNearbyError('')
      } finally {
        if (isActive) {
          setIsNearbyLoading(false)
        }
      }
    }

    void loadNearbyStations()

    return () => {
      isActive = false
    }
  }, [shouldUseMockData, station?._id, stationCoordinates])

  const handleAuthModalClose = () => {
    setPendingAuthAction(null)
    setIsAuthModalOpen(false)
  }

  const toggleSavedStation = async () => {
    if (!station?._id) {
      return
    }

    const stationKey = String(station._id)

    if (isMockStationId(stationKey)) {
      if (station?.isSaved) {
        setSavedStations(savedStations.filter((item) => String(item) !== stationKey))
        setStation((current) => ({
          ...current,
          isSaved: false,
        }))
        toast.success('Removed from favourites')
        return
      }

      setSavedStations(
        savedStations.includes(stationKey) ? savedStations : [...savedStations, stationKey],
      )
      setStation((current) => ({
        ...current,
        isSaved: true,
      }))
      toast.success('Saved to favourites')
      return
    }

    try {
      if (station?.isSaved) {
        await unsaveStation(stationKey)
        setStation((current) => ({
          ...current,
          isSaved: false,
        }))
        toast.success('Removed from favourites')
        return
      }

      await saveStation(stationKey)
      setStation((current) => ({
        ...current,
        isSaved: true,
      }))
      toast.success('Saved to favourites')
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to update saved station.',
      )
    }
  }

  const handleAuthModalSuccess = async () => {
    const action = pendingAuthAction
    setPendingAuthAction(null)
    setIsAuthModalOpen(false)

    if (action === 'save') {
      await toggleSavedStation()
      return
    }

    if (action === 'review') {
      setShowReviewForm(true)
    }
  }

  const handleToggleSavedStation = async () => {
    if (!station?._id) {
      return
    }

    if (!useAuthStore.getState().isAuthenticated) {
      requestAuthAction('save')
      return
    }

    await toggleSavedStation()
  }

  const handleCopyAddress = async () => {
    if (!station?.address) {
      return
    }

    try {
      await navigator.clipboard.writeText(station.address)
      toast.success('Address copied to clipboard.')
    } catch {
      toast.error('Could not copy address.')
    }
  }

  const handleOpenInMap = () => {
    if (!station?._id) {
      return
    }

    navigate(`/map?stationId=${station._id}`)
  }

  const handleDirections = () => {
    if (!stationCoordinates) {
      toast.error('Coordinates unavailable for this station.')
      return
    }

    const [lng, lat] = stationCoordinates
    const directionsUrl = new URL('https://www.google.com/maps/dir/')
    directionsUrl.searchParams.set('api', '1')
    directionsUrl.searchParams.set('destination', `${lat},${lng}`)
    directionsUrl.searchParams.set('travelmode', 'driving')

    window.open(directionsUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const handleReviewTagToggle = (tag) => {
    setReviewForm((current) => {
      if (current.tags.includes(tag)) {
        return {
          ...current,
          tags: current.tags.filter((item) => item !== tag),
        }
      }

      return {
        ...current,
        tags: [...current.tags, tag],
      }
    })
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()

    if (!useAuthStore.getState().isAuthenticated) {
      requestAuthAction('review')
      return
    }

    if (!station?._id) {
      return
    }

    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 10) {
      toast.error('Review comment must include at least 10 characters.')
      return
    }

    setIsSubmittingReview(true)

    try {
      if (isMockStationId(station._id)) {
        const createdReview = {
          _id: `mock-review-${station._id}-${Date.now()}`,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
          tags: [...reviewForm.tags],
          createdAt: new Date().toISOString(),
          userId: {
            _id: authUser?._id || 'mock-user-auth',
            username: authUser?.username || 'You',
            avatar: authUser?.avatar || '',
          },
        }

        setReviews((current) => [createdReview, ...current])
        setStation((current) => {
          if (!current) {
            return current
          }

          const previousCount = Number(current.totalReviews) || 0
          const previousAverage = Number(current.rating) || 0
          const nextCount = previousCount + 1
          const nextAverage =
            nextCount > 0
              ? (previousAverage * previousCount + Number(reviewForm.rating)) / nextCount
              : Number(reviewForm.rating)

          return {
            ...current,
            rating: Number(nextAverage.toFixed(2)),
            totalReviews: nextCount,
          }
        })

        setReviewForm({
          rating: 5,
          comment: '',
          tags: [],
        })
        setShowReviewForm(false)
        toast.success('Review submitted successfully.')
        return
      }

      const { data } = await api.post(`/reviews/station/${station._id}`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        tags: reviewForm.tags,
      })

      const createdReview = data?.data?.review
      if (createdReview) {
        setReviews((current) => [createdReview, ...current])
      }

      setStation((current) => {
        if (!current) {
          return current
        }

        const previousCount = Number(current.totalReviews) || 0
        const previousAverage = Number(current.rating) || 0
        const nextCount = previousCount + 1
        const nextAverage =
          nextCount > 0
            ? (previousAverage * previousCount + Number(reviewForm.rating)) / nextCount
            : Number(reviewForm.rating)

        return {
          ...current,
          rating: Number(nextAverage.toFixed(2)),
          totalReviews: nextCount,
        }
      })

      setReviewForm({
        rating: 5,
        comment: '',
        tags: [],
      })
      setShowReviewForm(false)
      toast.success('Review submitted successfully.')
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to submit review.',
      )
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleLoadMoreReviews = () => {
    if (!hasMoreReviews || isLoadingMoreReviews) {
      return
    }

    void loadReviews({ page: reviewsPage + 1, append: true })
  }

  return (
    <PageWrapper title={station?.stationName || 'Station Detail'} className="hero-gradient">
      <Navbar />

      <section
        className="container-shell"
        style={{
          minHeight: '100vh',
          paddingTop: '5rem',
          paddingBottom: '2rem',
          display: 'grid',
          alignContent: 'start',
          gap: '0.9rem',
        }}
      >
        {isLoading ? (
          <div style={{ minHeight: 380, display: 'grid', placeItems: 'center' }}>
            <Spinner />
          </div>
        ) : null}

        {!stationId ? (
          <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem', color: 'var(--accent-red)' }}>
            Station not found.
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem', color: 'var(--accent-red)' }}>
            {error}
          </div>
        ) : null}

        {!isLoading && !error && station ? (
          <>
            <div className="station-detail-top">
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                <div className="glass-card" style={{ borderRadius: '16px', padding: '0.8rem' }}>
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      minHeight: 330,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {currentImage ? (
                        <motion.img
                          key={currentImage}
                          src={currentImage}
                          alt={station.stationName}
                          initial={{ opacity: 0.4, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0.2 }}
                          transition={{ duration: 0.24 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(255, 51, 51, 0.25))',
                            display: 'grid',
                            placeItems: 'center',
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '3.3rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {getInitials(station.stationName)}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {stationImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          className="focus-ring"
                          onClick={() =>
                            setActiveImageIndex((current) =>
                              current <= 0 ? stationImages.length - 1 : current - 1,
                            )
                          }
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0.65rem',
                            transform: 'translateY(-50%)',
                            width: 34,
                            height: 34,
                            borderRadius: '999px',
                            border: '1px solid rgba(232, 244, 248, 0.4)',
                            background: 'rgba(5, 10, 14, 0.62)',
                            color: '#fff',
                          }}
                          aria-label="Previous station image"
                        >
                          <ChevronLeft size={16} style={{ margin: '0 auto' }} />
                        </button>
                        <button
                          type="button"
                          className="focus-ring"
                          onClick={() =>
                            setActiveImageIndex((current) =>
                              current >= stationImages.length - 1 ? 0 : current + 1,
                            )
                          }
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '0.65rem',
                            transform: 'translateY(-50%)',
                            width: 34,
                            height: 34,
                            borderRadius: '999px',
                            border: '1px solid rgba(232, 244, 248, 0.4)',
                            background: 'rgba(5, 10, 14, 0.62)',
                            color: '#fff',
                          }}
                          aria-label="Next station image"
                        >
                          <ChevronRight size={16} style={{ margin: '0 auto' }} />
                        </button>
                      </>
                    ) : null}
                  </div>

                  {stationImages.length > 1 ? (
                    <div className="station-thumbnail-strip">
                      {stationImages.map((image, index) => (
                        <button
                          key={`${station?._id}-${image}-${index}`}
                          type="button"
                          className="focus-ring"
                          onClick={() => setActiveImageIndex(index)}
                          style={{
                            border: index === safeImageIndex ? '1px solid rgba(255, 255, 255, 0.66)' : '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            padding: 0,
                            width: 72,
                            height: 54,
                            flexShrink: 0,
                            background: 'rgba(10, 22, 40, 0.72)',
                          }}
                        >
                          <img
                            src={image}
                            alt={`${station.stationName} thumbnail ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                  <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.9rem)', lineHeight: 1.05 }}>
                    {station.stationName}
                  </h1>

                  <div style={{ display: 'inline-flex', gap: '0.36rem', alignItems: 'center', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>{station.country || 'India'}</span>
                    <span>{'>'}</span>
                    <span>{station.city || '--'}</span>
                    <span>{'>'}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{station.stationName}</span>
                  </div>

                  <div
                    className="glass-card"
                    style={{
                      borderRadius: '12px',
                      borderColor: 'rgba(255, 255, 255, 0.24)',
                      padding: '0.78rem',
                      display: 'grid',
                      gap: '0.55rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', alignItems: 'start', flexWrap: 'wrap' }}>
                      <p style={{ color: 'var(--text-secondary)', display: 'inline-flex', gap: '0.42rem', alignItems: 'center' }}>
                        <MapPin size={15} />
                        {station.address || '--'}
                      </p>
                      <Button variant="secondary" size="sm" leftIcon={<Copy size={14} />} onClick={handleCopyAddress}>
                        Copy address
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '0.2rem 0.6rem',
                        border: `1px solid ${isStationOpen ? 'rgba(0, 255, 136, 0.42)' : 'rgba(255, 61, 90, 0.42)'}`,
                        background: isStationOpen ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 61, 90, 0.08)',
                        color: isStationOpen ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {isStationOpen ? 'Open now' : 'Closed'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', gap: '0.36rem', alignItems: 'center' }}>
                      <Clock3 size={14} />
                      {station?.operatingHours?.is24Hours
                        ? 'Open 24 hours'
                        : `${station?.operatingHours?.open || '--:--'} - ${station?.operatingHours?.close || '--:--'}`}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)' }}>
                    {station?.description?.trim() || 'EV Charging Station'}
                  </p>

                  {station?.isVerified ? (
                    <p
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--accent-green)',
                      }}
                    >
                      <BadgeCheck size={14} />
                      Verified station
                    </p>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.8rem', alignContent: 'start' }}>
                <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', alignItems: 'start' }}>
                    <div>
                      <small style={{ color: 'var(--text-secondary)' }}>Availability</small>
                      <div className="mono-data" style={{ fontSize: '1.65rem', marginTop: '0.3rem' }}>
                        {availableChargers} / {totalChargers}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.86rem' }}>
                        chargers available
                      </p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.95, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        width: 104,
                        height: 104,
                        borderRadius: '999px',
                        background: `conic-gradient(var(--accent-primary) ${availabilityPercent * 3.6}deg, rgba(122, 157, 181, 0.18) 0deg)`,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <span
                        className="mono-data"
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '999px',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(5, 10, 14, 0.88)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {availabilityPercent}%
                      </span>
                    </motion.div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                    <span>
                      {isConnected ? 'Live updates active' : 'Realtime reconnecting'}
                    </span>
                    <span>Last updated: {formatDateTime(lastAvailabilityUpdate)}</span>
                  </div>
                </div>

                <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                  <h2 style={{ fontSize: '1.15rem' }}>Pricing</h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.55rem',
                    }}
                  >
                    {pricingMeta.map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.key}
                          className="glass-card"
                          style={{
                            borderRadius: '12px',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.58rem',
                            display: 'grid',
                            gap: '0.25rem',
                          }}
                        >
                          <small style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Icon size={13} />
                            {item.label}
                          </small>
                          <strong>{toCurrency(station?.pricing?.[item.key], station?.pricing?.currency || 'INR')}</strong>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem' }}>
                  <div className="station-action-grid">
                    <Button leftIcon={<Route size={15} />} onClick={handleOpenInMap}>
                      Open in Map
                    </Button>
                    <Button variant="secondary" leftIcon={<Navigation size={15} />} onClick={handleDirections}>
                      Get Directions
                    </Button>
                    <Button
                      variant={station?.isSaved ? 'secondary' : 'ghost'}
                      leftIcon={<Bookmark size={15} />}
                      onClick={() => {
                        void handleToggleSavedStation()
                      }}
                    >
                      {station?.isSaved ? 'Saved Station' : 'Save Station'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Chargers</h2>
                <small style={{ color: 'var(--text-secondary)' }}>Live status indicators</small>
              </div>

              <div className="chargers-table-shell">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      <th style={{ padding: '0.55rem 0.45rem' }}>Charger #</th>
                      <th style={{ padding: '0.55rem 0.45rem' }}>Type</th>
                      <th style={{ padding: '0.55rem 0.45rem' }}>Connector</th>
                      <th style={{ padding: '0.55rem 0.45rem' }}>Power (kW)</th>
                      <th style={{ padding: '0.55rem 0.45rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(station?.chargers || []).length ? (
                      (station?.chargers || []).map((charger, index) => (
                        <tr key={charger?._id || `${station?._id}-charger-${index}`} style={{ borderTop: '1px solid rgba(122, 157, 181, 0.16)' }}>
                          <td style={{ padding: '0.65rem 0.45rem' }} className="mono-data">
                            {index + 1}
                          </td>
                          <td style={{ padding: '0.65rem 0.45rem' }}>{formatChargerType(charger?.chargerType)}</td>
                          <td style={{ padding: '0.65rem 0.45rem' }}>{charger?.connectorType || '--'}</td>
                          <td style={{ padding: '0.65rem 0.45rem' }}>{Number(charger?.powerOutput) || 0}</td>
                          <td style={{ padding: '0.65rem 0.45rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.34rem' }}>
                              <span className={`charger-status-dot ${normalizeStatusKey(charger?.status)}`} />
                              <Badge kind="status" value={charger?.status || 'offline'}>
                                {charger?.status || 'offline'}
                              </Badge>
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '0.8rem 0.45rem', color: 'var(--text-secondary)' }}>
                          No charger metadata available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.8rem' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Amenities</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.55rem',
                }}
              >
                {(station?.amenities || []).length ? (
                  (station?.amenities || []).map((amenity) => {
                    const AmenityIcon = amenityIconMap[normalizeAmenityKey(amenity)] || Zap

                    return (
                      <div
                        key={`${station?._id}-${amenity}`}
                        className="glass-card"
                        style={{
                          borderRadius: '12px',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '0.62rem',
                          display: 'inline-flex',
                          gap: '0.42rem',
                          alignItems: 'center',
                          minHeight: 42,
                        }}
                      >
                        <AmenityIcon size={15} color="var(--accent-primary)" />
                        <span>{amenity}</span>
                      </div>
                    )
                  })
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Amenities not listed.</p>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>Reviews</h2>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {reviews.length ? 'Latest community feedback' : 'No reviews yet'}
                  </small>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!isAuthenticated) {
                      requestAuthAction('review')
                      return
                    }

                    setShowReviewForm((current) => !current)
                  }}
                >
                  {showReviewForm ? 'Hide Review Form' : 'Write a Review'}
                </Button>
              </div>

              <div className="reviews-summary-shell">
                <div>
                  <div className="mono-data" style={{ fontSize: '2rem' }}>
                    {averageRating.toFixed(1)}
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>{totalReviewCount} total reviews</small>
                </div>

                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  {ratingBreakdown.map((entry) => (
                    <div
                      key={`rating-breakdown-${entry.star}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px minmax(0, 1fr) 36px',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.84rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.star}★</span>
                      <span
                        style={{
                          width: '100%',
                          height: 7,
                          borderRadius: '999px',
                          background: 'rgba(122, 157, 181, 0.2)',
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            width: `${entry.percentage}%`,
                            background: 'linear-gradient(90deg, var(--accent-amber), #ffd978)',
                          }}
                        />
                      </span>
                      <span className="mono-data" style={{ color: 'var(--text-secondary)' }}>
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showReviewForm ? (
                  <motion.form
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onSubmit={handleSubmitReview}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.24)',
                      borderRadius: '12px',
                      padding: '0.8rem',
                      display: 'grid',
                      gap: '0.7rem',
                    }}
                  >
                    <div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Rating</p>
                      <div style={{ display: 'inline-flex', gap: '0.2rem' }}>
                        {[1, 2, 3, 4, 5].map((value) => {
                          const active = reviewForm.rating >= value

                          return (
                            <button
                              key={value}
                              type="button"
                              className="focus-ring"
                              onClick={() =>
                                setReviewForm((current) => ({
                                  ...current,
                                  rating: value,
                                }))
                              }
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: active ? 'var(--accent-amber)' : 'rgba(122, 157, 181, 0.72)',
                                padding: 0,
                              }}
                            >
                              <Star size={18} fill={active ? 'currentColor' : 'none'} />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Tags</p>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {reviewTagOptions.map((tag) => {
                          const active = reviewForm.tags.includes(tag)

                          return (
                            <button
                              key={tag}
                              type="button"
                              className="focus-ring"
                              onClick={() => handleReviewTagToggle(tag)}
                              style={{
                                borderRadius: '999px',
                                border: active
                                  ? '1px solid rgba(255, 255, 255, 0.62)'
                                  : '1px solid rgba(255, 255, 255, 0.24)',
                                background: active
                                  ? 'rgba(255, 255, 255, 0.14)'
                                  : 'rgba(10, 22, 40, 0.72)',
                                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: '0.78rem',
                                padding: '0.22rem 0.58rem',
                              }}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <label htmlFor="station-review-comment" style={{ color: 'var(--text-secondary)' }}>
                      Comment
                      <textarea
                        id="station-review-comment"
                        className="focus-ring"
                        value={reviewForm.comment}
                        onChange={(event) =>
                          setReviewForm((current) => ({
                            ...current,
                            comment: event.target.value,
                          }))
                        }
                        rows={4}
                        style={{
                          marginTop: '0.35rem',
                          width: '100%',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.26)',
                          background: 'rgba(10, 22, 40, 0.72)',
                          padding: '0.55rem',
                          resize: 'vertical',
                        }}
                      />
                    </label>

                    <Button type="submit" isLoading={isSubmittingReview}>
                      Submit Review
                    </Button>
                  </motion.form>
                ) : null}
              </AnimatePresence>

              {isReviewsLoading ? (
                <div style={{ minHeight: 160, display: 'grid', placeItems: 'center' }}>
                  <Spinner />
                </div>
              ) : null}

              {!isReviewsLoading && reviewsError ? (
                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--accent-red)' }}>
                  {reviewsError}
                </div>
              ) : null}

              {!isReviewsLoading && !reviewsError && !reviews.length ? (
                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--text-secondary)' }}>
                  No reviews yet. Be the first to share your experience.
                </div>
              ) : null}

              {!isReviewsLoading && !reviewsError && reviews.length ? (
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {reviews.map((review) => (
                    <article
                      key={review?._id}
                      className="glass-card"
                      style={{
                        borderRadius: '12px',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.75rem',
                        display: 'grid',
                        gap: '0.45rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Avatar
                            size="sm"
                            src={review?.userId?.avatar}
                            name={review?.userId?.username || 'User'}
                          />
                          <strong>{review?.userId?.username || 'User'}</strong>
                        </div>

                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {formatDate(review?.createdAt)}
                        </span>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Star size={14} color="var(--accent-amber)" fill="var(--accent-amber)" />
                        <span className="mono-data">{Number(review?.rating || 0).toFixed(1)}</span>
                      </div>

                      <p style={{ color: 'var(--text-secondary)' }}>{review?.comment}</p>

                      {review?.tags?.length ? (
                        <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap' }}>
                          {review.tags.map((tag) => (
                            <span key={`${review?._id}-${tag}`} className="chip" style={{ fontSize: '0.74rem' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {hasMoreReviews ? (
                <Button
                  variant="secondary"
                  onClick={handleLoadMoreReviews}
                  isLoading={isLoadingMoreReviews}
                >
                  Load More Reviews
                </Button>
              ) : null}
            </div>

            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Nearby Stations</h2>
                <Link to="/map" className="focus-ring" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Explore all on map
                </Link>
              </div>

              {isNearbyLoading ? (
                <div style={{ minHeight: 140, display: 'grid', placeItems: 'center' }}>
                  <Spinner />
                </div>
              ) : null}

              {!isNearbyLoading && nearbyError ? (
                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--accent-red)' }}>
                  {nearbyError}
                </div>
              ) : null}

              {!isNearbyLoading && !nearbyError && !nearbyStations.length ? (
                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--text-secondary)' }}>
                  No nearby stations found.
                </div>
              ) : null}

              {!isNearbyLoading && !nearbyError && nearbyStations.length ? (
                <div className="nearby-strip">
                  {nearbyStations.map((nearbyStation) => (
                    <div key={nearbyStation?._id} style={{ width: 290, flexShrink: 0 }}>
                      <StationCard
                        station={nearbyStation}
                        variant="full"
                        onClick={() => navigate(`/station/${nearbyStation?._id}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        initialTab={pendingAuthAction === 'review' ? 'register' : 'login'}
        redirectTo={station?._id ? `/station/${station._id}` : '/map'}
        onSuccess={() => {
          void handleAuthModalSuccess()
        }}
      />

      <style>
        {`
          .station-detail-top {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
            gap: 0.9rem;
          }

          .station-thumbnail-strip {
            margin-top: 0.65rem;
            display: flex;
            gap: 0.45rem;
            overflow-x: auto;
            padding-bottom: 0.1rem;
          }

          .station-action-grid {
            display: grid;
            gap: 0.55rem;
          }

          .chargers-table-shell {
            overflow-x: auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
          }

          .reviews-summary-shell {
            display: grid;
            grid-template-columns: 110px minmax(0, 1fr);
            gap: 0.7rem;
            align-items: center;
          }

          .nearby-strip {
            display: flex;
            gap: 0.7rem;
            overflow-x: auto;
            padding-bottom: 0.2rem;
          }

          .charger-status-dot {
            width: 9px;
            height: 9px;
            border-radius: 999px;
            background: rgba(122, 157, 181, 0.8);
          }

          .charger-status-dot.available {
            background: var(--accent-green);
            box-shadow: 0 0 12px rgba(0, 255, 136, 0.38);
            animation: pulse-glow 1.8s ease-in-out infinite;
          }

          .charger-status-dot.occupied {
            background: var(--accent-red);
          }

          .charger-status-dot.maintenance {
            background: var(--accent-amber);
          }

          .charger-status-dot.offline {
            background: #90a6b8;
          }

          @media (max-width: 1120px) {
            .station-detail-top {
              grid-template-columns: minmax(0, 1fr);
            }
          }

          @media (max-width: 720px) {
            .reviews-summary-shell {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        `}
      </style>
    </PageWrapper>
  )
}

export default StationDetail
