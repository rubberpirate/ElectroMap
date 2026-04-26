import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Navigation,
  ParkingCircle,
  Share2,
  Shield,
  Star,
  Toilet,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getMockStationById } from '../../data/mockStations'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useStationStore } from '../../store/stationStore'
import { isMockModeEnabled, isMockStationId } from '../../utils/mockMode'
import AuthModal from '../auth/AuthModal'
import { Avatar, Badge, Button, Spinner } from '../ui'

const reviewTagOptions = [
  'Fast',
  'Clean',
  'Safe',
  'Good Lighting',
  'Reliable',
  'Accessible',
]

const amenityIconMap = {
  wifi: Wifi,
  parking: ParkingCircle,
  restrooms: Toilet,
  cafe: Car,
  security: Shield,
}

const createMockReviews = (stationId) =>
  Array.from({ length: 4 }).map((_, index) => ({
    _id: `mock-drawer-review-${stationId}-${index + 1}`,
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

const normalizeAmenityKey = (value) => String(value || '').trim().toLowerCase()

const toCurrency = (value, currency = 'INR') => {
  const amount = Number(value) || 0

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

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

const haversineDistanceKm = (from, to) => {
  if (!from || !to) {
    return null
  }

  const fromLat = Number(from.lat)
  const fromLng = Number(from.lng)
  const toLat = Number(to.lat)
  const toLng = Number(to.lng)

  if ([fromLat, fromLng, toLat, toLng].some((value) => Number.isNaN(value))) {
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

function StationDrawer({ stationId, isOpen, onClose, socket, userLocation, onNavigate }) {
  const [station, setStation] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    tags: [],
    comment: '',
  })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [pendingAuthAction, setPendingAuthAction] = useState(null)

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const authUser = useAuthStore((state) => state.user)
  const saveStation = useStationStore((state) => state.saveStation)
  const unsaveStation = useStationStore((state) => state.unsaveStation)
  const setSavedStations = useStationStore((state) => state.setSavedStations)
  const savedStations = useStationStore((state) => state.savedStations)

  const shouldUseMockData = isMockModeEnabled() || isMockStationId(stationId)

  const requestAuthAction = (action) => {
    setPendingAuthAction(action)
    setIsAuthModalOpen(true)
  }

  const performToggleSavedStation = async () => {
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

  const distanceKm = useMemo(() => {
    if (Number.isFinite(Number(station?.distanceKm))) {
      return Number(station.distanceKm)
    }

    const [lng, lat] = station?.location?.coordinates || []

    return haversineDistanceKm(userLocation, {
      lat,
      lng,
    })
  }, [station?.distanceKm, station?.location?.coordinates, userLocation])

  const ratingBreakdownData = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} star`,
      value: 0,
    }))

    for (const review of reviews) {
      const rating = Number(review?.rating)
      const index = counts.findIndex((item) => Number(item.label[0]) === rating)

      if (index >= 0) {
        counts[index].value += 1
      }
    }

    return counts
  }, [reviews])

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return Number(station?.rating) || 0
    }

    const total = reviews.reduce((sum, review) => sum + (Number(review?.rating) || 0), 0)
    return total / reviews.length
  }, [reviews, station?.rating])

  useEffect(() => {
    if (!isOpen || !stationId) {
      return
    }

    let isActive = true

    const loadStationDetails = async () => {
      setIsLoading(true)
      setError('')

      try {
        if (shouldUseMockData) {
          const mockStation = getMockStationById(stationId)

          if (!mockStation?._id) {
            setError('Station not found.')
            setStation(null)
            setReviews([])
            return
          }

          if (!isActive) {
            return
          }

          const savedSet = new Set((savedStations || []).map((item) => String(item)))
          setStation({
            ...mockStation,
            isSaved: savedSet.has(String(mockStation._id)),
          })
          setReviews(createMockReviews(stationId))
          setActiveImageIndex(0)
          return
        }

        const [stationResponse, reviewResponse] = await Promise.all([
          api.get(`/stations/${stationId}`),
          api.get(`/reviews/station/${stationId}`, {
            params: {
              page: 1,
              limit: 5,
              sortBy: 'newest',
            },
          }),
        ])

        if (!isActive) {
          return
        }

        const stationData = stationResponse?.data?.data?.station || null
        const latestReviews =
          reviewResponse?.data?.data?.reviews || stationData?.reviews || []

        setStation(stationData)
        setReviews(latestReviews)
        setActiveImageIndex(0)
      } catch (requestError) {
        if (!isActive) {
          return
        }

        const mockStation = getMockStationById(stationId)
        if (mockStation?._id) {
          const savedSet = new Set((savedStations || []).map((item) => String(item)))
          setStation({
            ...mockStation,
            isSaved: savedSet.has(String(mockStation._id)),
          })
          setReviews(createMockReviews(stationId))
          setActiveImageIndex(0)
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

    loadStationDetails()

    return () => {
      isActive = false
    }
  }, [isOpen, savedStations, shouldUseMockData, stationId])

  useEffect(() => {
    if (!socket || !isOpen || !stationId || shouldUseMockData) {
      return undefined
    }

    const handleChargerStatusUpdate = (payload) => {
      if (String(payload?.stationId) !== String(stationId)) {
        return
      }

      useStationStore.getState().updateChargerStatusRealtime(payload)

      setStation((current) => {
        if (!current) {
          return current
        }

        const updatedChargers = Array.isArray(current.chargers)
          ? current.chargers.map((charger) =>
              String(charger._id) === String(payload?.chargerId)
                ? {
                    ...charger,
                    status: payload?.status,
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
    }

    socket.emit('subscribe:station', stationId)
    socket.on('charger:status_update', handleChargerStatusUpdate)

    return () => {
      socket.emit('unsubscribe:station', stationId)
      socket.off('charger:status_update', handleChargerStatusUpdate)
    }
  }, [isOpen, shouldUseMockData, socket, stationId])

  const handleToggleSavedStation = async () => {
    if (!station?._id) {
      return
    }

    if (!useAuthStore.getState().isAuthenticated) {
      requestAuthAction('save')
      return
    }

    await performToggleSavedStation()
  }

  const handleAuthModalClose = () => {
    setPendingAuthAction(null)
    setIsAuthModalOpen(false)
  }

  const handleAuthModalSuccess = async () => {
    const action = pendingAuthAction
    setPendingAuthAction(null)
    setIsAuthModalOpen(false)

    if (action === 'save') {
      await performToggleSavedStation()
      return
    }

    if (action === 'review') {
      setShowReviewForm(true)
    }
  }

  const handleShareStation = async () => {
    if (!station?._id) {
      return
    }

    const stationUrl = `${window.location.origin}/station/${station._id}`

    try {
      await navigator.clipboard.writeText(stationUrl)
      toast.success('Station link copied to clipboard.')
    } catch {
      toast.error('Could not copy station URL.')
    }
  }

  const handleNavigateToStation = async () => {
    if (!station) {
      return
    }

    const routeRendered = await onNavigate?.(station)

    if (routeRendered) {
      return
    }

    const [lng, lat] = station?.location?.coordinates || []
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')
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
      toast.error('Review comment must contain at least 10 characters.')
      return
    }

    setIsSubmittingReview(true)

    try {
      if (isMockStationId(station._id)) {
        const mockReview = {
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

        setReviews((current) => [mockReview, ...current].slice(0, 20))
        setReviewForm({
          rating: 5,
          tags: [],
          comment: '',
        })
        setShowReviewForm(false)
        toast.success('Review submitted.')
        return
      }

      const { data } = await api.post(`/reviews/station/${station._id}`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        tags: reviewForm.tags,
      })

      const newReview = data?.data?.review

      if (newReview) {
        setReviews((current) => [newReview, ...current].slice(0, 20))
      }

      setReviewForm({
        rating: 5,
        tags: [],
        comment: '',
      })

      setShowReviewForm(false)
      toast.success('Review submitted.')
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

  const stationImages = station?.images?.length
    ? station.images
    : [
        'https://images.unsplash.com/photo-1568884109018-27513648f6ca?auto=format&fit=crop&w=1200&q=80',
      ]

  const safeImageIndex = Math.max(0, Math.min(activeImageIndex, stationImages.length - 1))
  const currentImage = stationImages[safeImageIndex]

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(3, 8, 14, 0.55)',
              zIndex: 44,
            }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            className="glass-card station-drawer-sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(560px, 96vw)',
              borderRadius: 0,
              borderLeft: '1px solid var(--border)',
              zIndex: 45,
              display: 'grid',
              gridTemplateRows: 'auto minmax(0, 1fr)',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.8rem',
                padding: '0.9rem 1rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2 style={{ fontSize: '1.2rem' }}>Station Details</h2>
              <button
                type="button"
                className="focus-ring"
                onClick={onClose}
                aria-label="Close station details"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'rgba(10, 22, 40, 0.7)',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={18} style={{ margin: '0 auto' }} />
              </button>
            </header>

            <div style={{ overflowY: 'auto', padding: '1rem', display: 'grid', gap: '0.95rem' }}>
              {isLoading ? (
                <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
                  <Spinner />
                </div>
              ) : null}

              {!isLoading && error ? (
                <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', color: 'var(--accent-red)' }}>
                  {error}
                </div>
              ) : null}

              {!isLoading && !error && station ? (
                <>
                  <div className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 220 }}>
                      <img
                        src={currentImage}
                        alt={station.stationName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(180deg, rgba(5, 10, 14, 0.1), rgba(5, 10, 14, 0.65) 80%)',
                        }}
                      />

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
                              left: '0.45rem',
                              transform: 'translateY(-50%)',
                              width: 32,
                              height: 32,
                              borderRadius: '999px',
                              border: '1px solid rgba(255, 255, 255, 0.35)',
                              background: 'rgba(5, 10, 14, 0.65)',
                              color: '#fff',
                            }}
                            aria-label="Previous image"
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
                              right: '0.45rem',
                              transform: 'translateY(-50%)',
                              width: 32,
                              height: 32,
                              borderRadius: '999px',
                              border: '1px solid rgba(255, 255, 255, 0.35)',
                              background: 'rgba(5, 10, 14, 0.65)',
                              color: '#fff',
                            }}
                            aria-label="Next image"
                          >
                            <ChevronRight size={16} style={{ margin: '0 auto' }} />
                          </button>
                        </>
                      ) : null}

                      <div style={{ position: 'absolute', left: '0.75rem', bottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.4rem' }}>{station.stationName}</h3>
                        <p style={{ color: 'rgba(232, 244, 248, 0.88)', marginTop: '0.3rem' }}>
                          {station.city}, {station.state}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem' }}>
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <MapPin size={14} />
                        {station.address}
                      </p>

                      {station.isVerified ? (
                        <p style={{ marginTop: '0.35rem', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <BadgeCheck size={14} />
                          Verified station
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="station-drawer-metrics">
                    <div className="glass-card station-drawer-metric-card">
                      <small style={{ color: 'var(--text-secondary)' }}>Available</small>
                      <div className="mono-data status-available" style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>
                        {Number(station.availableChargers) || 0}
                      </div>
                    </div>
                    <div className="glass-card station-drawer-metric-card">
                      <small style={{ color: 'var(--text-secondary)' }}>Total chargers</small>
                      <div className="mono-data" style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>
                        {Number(station.totalChargers) || 0}
                      </div>
                    </div>
                    <div className="glass-card station-drawer-metric-card">
                      <small style={{ color: 'var(--text-secondary)' }}>Rating</small>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Star size={16} color="var(--accent-amber)" fill="var(--accent-amber)" />
                        <span className="mono-data" style={{ fontSize: '1.2rem' }}>
                          {averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="glass-card station-drawer-metric-card">
                      <small style={{ color: 'var(--text-secondary)' }}>Distance</small>
                      <div className="mono-data" style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
                        {Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card station-drawer-section-card">
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Chargers</h4>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                      {(station.chargers || []).length ? (
                        (station.chargers || []).map((charger, index) => (
                          <div
                            key={charger._id || `${station._id}-charger-${index}`}
                            className="station-drawer-charger-row"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.95rem' }}>
                                {charger.chargerType} • {charger.connectorType}
                              </strong>
                              <Badge kind="status" value={charger.status}>
                                {charger.status}
                              </Badge>
                            </div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              {Number(charger.powerOutput) || 0} kW
                            </small>
                          </div>
                        ))
                      ) : (
                        <small style={{ color: 'var(--text-secondary)' }}>
                          Charger details are not available for this station yet.
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="station-drawer-split-cards">
                    <div className="glass-card station-drawer-section-card">
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.45rem' }}>Pricing</h4>
                      <p style={{ color: 'var(--text-secondary)' }}>Per kWh</p>
                      <strong>{toCurrency(station.pricing?.perKwh, station.pricing?.currency)}</strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.45rem' }}>Per minute</p>
                      <strong>{toCurrency(station.pricing?.perMinute, station.pricing?.currency)}</strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.45rem' }}>Session fee</p>
                      <strong>{toCurrency(station.pricing?.sessionFee, station.pricing?.currency)}</strong>
                    </div>

                    <div className="glass-card station-drawer-section-card">
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.45rem' }}>Operating Hours</h4>
                      <p
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: isOpenNow(station.operatingHours)
                            ? 'var(--accent-green)'
                            : 'var(--accent-red)',
                        }}
                      >
                        <Clock3 size={14} />
                        {isOpenNow(station.operatingHours) ? 'Open now' : 'Closed'}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                        {station.operatingHours?.is24Hours
                          ? 'Open 24 hours'
                          : `${station.operatingHours?.open || '--:--'} - ${station.operatingHours?.close || '--:--'}`}
                      </p>
                    </div>
                  </div>

                  <div className="glass-card station-drawer-section-card">
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.45rem' }}>Amenities</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {(station.amenities || []).length ? (
                        (station.amenities || []).map((amenity) => {
                          const AmenityIcon =
                            amenityIconMap[normalizeAmenityKey(amenity)] || Zap

                          return (
                            <span
                              key={`${station._id}-${amenity}`}
                              className="chip"
                              style={{
                                borderColor: 'rgba(255, 255, 255, 0.25)',
                                background: 'rgba(10, 22, 40, 0.78)',
                              }}
                            >
                              <AmenityIcon size={13} />
                              {amenity}
                            </span>
                          )
                        })
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Amenities not listed.</span>
                      )}
                    </div>
                  </div>

                  <div className="station-drawer-actions">
                    <Button
                      className="station-drawer-action-btn"
                      leftIcon={<Navigation size={15} />}
                      onClick={handleNavigateToStation}
                    >
                      Navigate
                    </Button>
                    <Button
                      className="station-drawer-action-btn"
                      variant={station?.isSaved ? 'secondary' : 'ghost'}
                      leftIcon={<Heart size={15} />}
                      onClick={handleToggleSavedStation}
                    >
                      {station?.isSaved ? 'Saved' : 'Save Station'}
                    </Button>
                    <Button
                      className="station-drawer-action-btn"
                      variant="ghost"
                      leftIcon={<Share2 size={15} />}
                      onClick={handleShareStation}
                    >
                      Share
                    </Button>
                  </div>

                  <div className="glass-card" style={{ borderRadius: '12px', padding: '0.8rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.55rem' }}>Reviews</h4>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr',
                        gap: '0.65rem',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div className="mono-data" style={{ fontSize: '1.7rem' }}>
                          {averageRating.toFixed(1)}
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>{reviews.length} reviews</small>
                      </div>

                      <div style={{ width: '100%', height: 132 }}>
                        <ResponsiveContainer>
                          <BarChart data={ratingBreakdownData} layout="vertical" margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(122, 157, 181, 0.2)" />
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="label"
                              type="category"
                              width={52}
                              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }}
                              contentStyle={{
                                background: 'rgba(5, 10, 14, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }}
                            />
                            <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 4, 4]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.65rem' }}>
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review._id} style={{ border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', padding: '0.55rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.55rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Avatar
                                size="sm"
                                src={review?.userId?.avatar}
                                name={review?.userId?.username || 'User'}
                              />
                              <strong>{review?.userId?.username || 'User'}</strong>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {review?.createdAt
                                ? new Date(review.createdAt).toLocaleDateString('en-IN')
                                : '--'}
                            </span>
                          </div>
                          <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)' }}>{review?.comment}</p>
                          {review?.tags?.length ? (
                            <div style={{ marginTop: '0.45rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {review.tags.map((tag) => (
                                <span key={`${review._id}-${tag}`} className="chip" style={{ fontSize: '0.74rem' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
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

                    <AnimatePresence initial={false}>
                      {showReviewForm ? (
                        <motion.form
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          onSubmit={handleSubmitReview}
                          style={{
                            marginTop: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            display: 'grid',
                            gap: '0.7rem',
                          }}
                        >
                          <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Rating</p>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
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
                                    <Star size={17} fill={active ? 'currentColor' : 'none'} />
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Tags</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
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
                                      padding: '0.24rem 0.58rem',
                                    }}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="review-comment" style={{ color: 'var(--text-secondary)' }}>
                              Comment
                            </label>
                            <textarea
                              id="review-comment"
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
                          </div>

                          <Button type="submit" isLoading={isSubmittingReview}>
                            Submit Review
                          </Button>
                        </motion.form>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </>
              ) : null}
            </div>
          </motion.aside>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={handleAuthModalClose}
            initialTab="login"
            redirectTo={station?._id ? `/station/${station._id}` : '/map'}
            onSuccess={() => {
              void handleAuthModalSuccess()
            }}
          />

          <style>
            {`
              @media (max-width: 900px) {
                .station-drawer-sheet {
                  width: 100% !important;
                  top: auto !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  max-height: 86vh;
                  border-radius: 16px 16px 0 0 !important;
                  border-left: none !important;
                  border-top: 1px solid var(--border);
                }
              }

              .station-drawer-metrics {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.7rem;
              }

              .station-drawer-metric-card {
                border-radius: 12px;
                padding: 0.72rem;
                min-height: 82px;
                display: grid;
                align-content: space-between;
              }

              .station-drawer-section-card {
                border-radius: 12px;
                padding: 0.8rem;
              }

              .station-drawer-charger-row {
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 0.55rem;
                display: grid;
                gap: 0.32rem;
              }

              .station-drawer-split-cards {
                display: grid;
                gap: 0.7rem;
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }

              .station-drawer-actions {
                display: grid;
                gap: 0.55rem;
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }

              .station-drawer-action-btn {
                width: 100%;
              }

              @media (max-width: 680px) {
                .station-drawer-metrics {
                  grid-template-columns: 1fr;
                }

                .station-drawer-split-cards {
                  grid-template-columns: 1fr;
                }

                .station-drawer-actions {
                  grid-template-columns: 1fr;
                }
              }
            `}
          </style>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default StationDrawer
