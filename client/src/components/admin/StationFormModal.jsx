import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ImagePlus, MapPin, Plus, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import api from '../../services/api'
import { getMapTilerKey, getMapTilerStyle } from '../../utils/maptiler'
import { Button, Input, Modal } from '../ui'

const CHARGER_TYPES = [
  { value: 'Level1', label: 'Level 1' },
  { value: 'Level2', label: 'Level 2' },
  { value: 'DC_Fast', label: 'DC Fast' },
  { value: 'Tesla_Supercharger', label: 'Tesla Supercharger' },
]

const CONNECTOR_TYPES = ['Type1', 'Type2', 'CCS2', 'CHAdeMO', 'Tesla']

const CHARGER_STATUS = ['available', 'occupied', 'offline', 'maintenance']

const defaultFormState = () => ({
  stationName: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  coordinates: {
    lat: '',
    lng: '',
  },
  isVerified: false,
  chargers: [
    {
      chargerType: 'Level2',
      powerOutput: '22',
      connectorType: 'Type2',
      status: 'available',
    },
  ],
  pricing: {
    perKwh: '18',
    perMinute: '0',
    sessionFee: '0',
    currency: 'INR',
  },
  operatingHours: {
    is24Hours: false,
    open: '06:00',
    close: '23:00',
  },
  amenitiesInput: '',
  existingImages: [],
  newImageFiles: [],
})

const toSafeNumber = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return 0
  }

  return number
}

const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ''))

const normalizeStationForForm = (station) => {
  if (!station) {
    return defaultFormState()
  }

  const [lng, lat] = station?.location?.coordinates || []
  const chargers = Array.isArray(station?.chargers) && station.chargers.length
    ? station.chargers.map((charger) => ({
        chargerType: charger?.chargerType || 'Level2',
        powerOutput: String(toSafeNumber(charger?.powerOutput)),
        connectorType: charger?.connectorType || 'Type2',
        status: charger?.status || 'available',
      }))
    : defaultFormState().chargers

  const amenities = Array.isArray(station?.amenities) ? station.amenities.join(', ') : ''
  const existingImages = Array.isArray(station?.images) ? station.images : []

  return {
    stationName: station?.stationName || '',
    address: station?.address || '',
    city: station?.city || '',
    state: station?.state || '',
    country: station?.country || 'India',
    coordinates: {
      lat: Number.isFinite(Number(lat)) ? String(lat) : '',
      lng: Number.isFinite(Number(lng)) ? String(lng) : '',
    },
    isVerified: Boolean(station?.isVerified),
    chargers,
    pricing: {
      perKwh: String(toSafeNumber(station?.pricing?.perKwh)),
      perMinute: String(toSafeNumber(station?.pricing?.perMinute)),
      sessionFee: String(toSafeNumber(station?.pricing?.sessionFee)),
      currency: station?.pricing?.currency || 'INR',
    },
    operatingHours: {
      is24Hours: Boolean(station?.operatingHours?.is24Hours),
      open: station?.operatingHours?.open || '06:00',
      close: station?.operatingHours?.close || '23:00',
    },
    amenitiesInput: amenities,
    existingImages,
    newImageFiles: [],
  }
}

const StepIndicator = ({ step }) => {
  const steps = ['Basic Info', 'Chargers', 'Details']

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '0.45rem',
      }}
    >
      {steps.map((label, index) => {
        const current = index + 1
        const active = step === current
        const completed = step > current

        return (
          <div
            key={label}
            className="glass-card"
            style={{
              borderRadius: '10px',
              borderColor: active || completed ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
              background: active
                ? 'rgba(255, 255, 255, 0.12)'
                : completed
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(10, 22, 40, 0.62)',
              padding: '0.45rem',
              textAlign: 'center',
            }}
          >
            <div className="mono-data" style={{ fontSize: '0.8rem', opacity: completed ? 0.8 : 1 }}>
              {current}
            </div>
            <small
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.74rem',
              }}
            >
              {label}
            </small>
          </div>
        )
      })}
    </div>
  )
}

function StationFormModal({ isOpen, mode = 'create', station, onClose, onSuccess }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const dropzoneRef = useRef(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => defaultFormState())
  const [fieldError, setFieldError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const maptilerKey = getMapTilerKey()
  const isEdit = mode === 'edit'

  const newImagePreviews = useMemo(
    () => form.newImageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.newImageFiles],
  )

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [newImagePreviews])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setStep(1)
      setFieldError('')
      setForm(normalizeStationForForm(station))
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isOpen, station])

  useEffect(() => {
    if (!isOpen || !maptilerKey || !mapContainerRef.current) {
      return undefined
    }

    if (!mapRef.current) {
      const lng = Number(form.coordinates.lng) || 78.9629
      const lat = Number(form.coordinates.lat) || 20.5937

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapTilerStyle('dark'),
        center: [lng, lat],
        zoom: Number(form.coordinates.lng) && Number(form.coordinates.lat) ? 10.5 : 3.8,
        projection: 'mercator',
      })

      mapRef.current = map

      map.on('click', (event) => {
        const nextLng = Number(event.lngLat.lng.toFixed(6))
        const nextLat = Number(event.lngLat.lat.toFixed(6))

        setForm((current) => ({
          ...current,
          coordinates: {
            lng: String(nextLng),
            lat: String(nextLat),
          },
        }))
      })
    }
  }, [form.coordinates.lat, form.coordinates.lng, isOpen, maptilerKey])

  useEffect(() => {
    if (isOpen) {
      return
    }

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !mapRef.current) {
      return
    }

    const map = mapRef.current
    const lng = Number(form.coordinates.lng)
    const lat = Number(form.coordinates.lat)

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    const coordinates = [lng, lat]

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#00e8cc' })
        .setLngLat(coordinates)
        .addTo(map)
    } else {
      markerRef.current.setLngLat(coordinates)
    }

    map.easeTo({ center: coordinates, duration: 360 })
  }, [form.coordinates.lat, form.coordinates.lng, isOpen])

  const updateForm = (patch) => {
    setForm((current) => ({
      ...current,
      ...patch,
    }))
  }

  const updateCoordinates = (key, value) => {
    setForm((current) => ({
      ...current,
      coordinates: {
        ...current.coordinates,
        [key]: value,
      },
    }))
  }

  const updatePricing = (key, value) => {
    setForm((current) => ({
      ...current,
      pricing: {
        ...current.pricing,
        [key]: value,
      },
    }))
  }

  const updateOperatingHours = (key, value) => {
    setForm((current) => ({
      ...current,
      operatingHours: {
        ...current.operatingHours,
        [key]: value,
      },
    }))
  }

  const updateChargerRow = (index, key, value) => {
    setForm((current) => ({
      ...current,
      chargers: current.chargers.map((charger, rowIndex) =>
        rowIndex === index
          ? {
              ...charger,
              [key]: value,
            }
          : charger,
      ),
    }))
  }

  const addChargerRow = () => {
    setForm((current) => ({
      ...current,
      chargers: [
        ...current.chargers,
        {
          chargerType: 'Level2',
          powerOutput: '22',
          connectorType: 'Type2',
          status: 'available',
        },
      ],
    }))
  }

  const removeChargerRow = (index) => {
    setForm((current) => {
      if (current.chargers.length <= 1) {
        return current
      }

      return {
        ...current,
        chargers: current.chargers.filter((_, rowIndex) => rowIndex !== index),
      }
    })
  }

  const handleDropFiles = (files) => {
    const imageFiles = Array.from(files || []).filter((file) =>
      String(file?.type || '').startsWith('image/'),
    )

    if (!imageFiles.length) {
      return
    }

    setForm((current) => ({
      ...current,
      newImageFiles: [...current.newImageFiles, ...imageFiles].slice(0, 5),
    }))
  }

  const validateStep = (targetStep) => {
    if (targetStep === 1) {
      if (!form.stationName.trim()) {
        return 'Station name is required.'
      }

      if (!form.address.trim()) {
        return 'Address is required.'
      }

      if (!form.city.trim() || !form.state.trim() || !form.country.trim()) {
        return 'City, state, and country are required.'
      }

      const lat = Number(form.coordinates.lat)
      const lng = Number(form.coordinates.lng)

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return 'Set valid coordinates using map click or manual inputs.'
      }

      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return 'Coordinates are out of range.'
      }
    }

    if (targetStep === 2) {
      if (!form.chargers.length) {
        return 'Add at least one charger.'
      }

      const hasInvalidRow = form.chargers.some((charger) => {
        if (!charger.chargerType || !charger.connectorType || !charger.status) {
          return true
        }

        return !Number.isFinite(Number(charger.powerOutput))
      })

      if (hasInvalidRow) {
        return 'Each charger row must include type, connector, status, and power.'
      }
    }

    if (targetStep === 3) {
      if (!Number.isFinite(Number(form.pricing.perKwh))) {
        return 'Pricing (per kWh) must be a valid number.'
      }

      if (!form.operatingHours.is24Hours) {
        if (!isValidTime(form.operatingHours.open) || !isValidTime(form.operatingHours.close)) {
          return 'Operating hours must be valid time values (HH:mm).'
        }
      }
    }

    return ''
  }

  const goNext = () => {
    const error = validateStep(step)
    setFieldError(error)

    if (error) {
      return
    }

    setStep((current) => Math.min(3, current + 1))
  }

  const goBack = () => {
    setFieldError('')
    setStep((current) => Math.max(1, current - 1))
  }

  const buildPayload = () => {
    const lat = Number(form.coordinates.lat)
    const lng = Number(form.coordinates.lng)
    const chargers = form.chargers.map((charger) => ({
      chargerType: charger.chargerType,
      powerOutput: Number(charger.powerOutput),
      connectorType: charger.connectorType,
      status: charger.status,
    }))
    const chargerTypes = [...new Set(chargers.map((charger) => charger.chargerType))]
    const amenities = form.amenitiesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const payload = new FormData()
    payload.append('stationName', form.stationName.trim())
    payload.append('address', form.address.trim())
    payload.append('city', form.city.trim())
    payload.append('state', form.state.trim())
    payload.append('country', form.country.trim())
    payload.append('location', JSON.stringify({ type: 'Point', coordinates: [lng, lat] }))
    payload.append('chargerTypes', JSON.stringify(chargerTypes))
    payload.append('totalChargers', String(chargers.length))
    payload.append(
      'availableChargers',
      String(chargers.filter((charger) => charger.status === 'available').length),
    )
    payload.append(
      'pricing',
      JSON.stringify({
        perKwh: Number(form.pricing.perKwh),
        perMinute: Number(form.pricing.perMinute),
        sessionFee: Number(form.pricing.sessionFee),
        currency: form.pricing.currency.trim() || 'INR',
      }),
    )
    payload.append(
      'operatingHours',
      JSON.stringify({
        is24Hours: Boolean(form.operatingHours.is24Hours),
        open: form.operatingHours.open,
        close: form.operatingHours.close,
      }),
    )
    payload.append('amenities', JSON.stringify(amenities))
    payload.append('chargers', JSON.stringify(chargers))
    payload.append('isVerified', String(Boolean(form.isVerified)))

    if (isEdit) {
      payload.append('existingImages', JSON.stringify(form.existingImages))
    }

    form.newImageFiles.forEach((file) => {
      payload.append('images', file)
    })

    return payload
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const error = validateStep(3)
    setFieldError(error)
    if (error) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildPayload()

      const request = isEdit && station?._id
        ? api.put(`/stations/${station._id}`, payload)
        : api.post('/stations', payload)

      await request
      toast.success(isEdit ? 'Station updated.' : 'Station created.')
      onSuccess?.()
      onClose?.()
    } catch (requestError) {
      setFieldError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to save station right now.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Station' : 'Add Station'}
      className="glass-card"
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
        <StepIndicator step={step} />

        {fieldError ? (
          <div
            className="glass-card"
            style={{
              borderRadius: '10px',
              borderColor: 'rgba(255, 61, 90, 0.38)',
              background: 'rgba(255, 61, 90, 0.08)',
              padding: '0.55rem 0.65rem',
              color: 'var(--accent-red)',
              fontSize: '0.86rem',
            }}
          >
            {fieldError}
          </div>
        ) : null}

        {step === 1 ? (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <Input
              label="Station Name"
              value={form.stationName}
              onChange={(event) => updateForm({ stationName: event.target.value })}
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(event) => updateForm({ address: event.target.value })}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.55rem',
              }}
            >
              <Input
                label="City"
                value={form.city}
                onChange={(event) => updateForm({ city: event.target.value })}
              />
              <Input
                label="State"
                value={form.state}
                onChange={(event) => updateForm({ state: event.target.value })}
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(event) => updateForm({ country: event.target.value })}
              />
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--text-secondary)',
                fontSize: '0.86rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(event) => updateForm({ isVerified: event.target.checked })}
              />
              Mark as verified station
            </label>

            <div className="glass-card" style={{ borderRadius: '12px', padding: '0.62rem', display: 'grid', gap: '0.52rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={14} />
                <strong style={{ fontSize: '0.9rem' }}>Coordinate Picker</strong>
              </div>
              <div style={{ height: 190, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                {maptilerKey ? (
                  <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.86rem',
                    }}
                  >
                    Add a valid VITE_MAPTILER_KEY for map click picking.
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem' }}>
                <Input
                  label="Latitude"
                  value={form.coordinates.lat}
                  onChange={(event) => updateCoordinates('lat', event.target.value)}
                />
                <Input
                  label="Longitude"
                  value={form.coordinates.lng}
                  onChange={(event) => updateCoordinates('lng', event.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div style={{ display: 'grid', gap: '0.62rem' }}>
            {form.chargers.map((charger, index) => (
              <div
                key={`charger-row-${index}`}
                className="glass-card"
                style={{
                  borderRadius: '12px',
                  padding: '0.62rem',
                  display: 'grid',
                  gap: '0.55rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Charger {index + 1}</strong>
                  <button
                    type="button"
                    className="focus-ring"
                    onClick={() => removeChargerRow(index)}
                    aria-label={`Remove charger ${index + 1}`}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '9px',
                      border: '1px solid rgba(255, 61, 90, 0.34)',
                      background: 'rgba(255, 61, 90, 0.08)',
                      color: 'var(--accent-red)',
                    }}
                  >
                    <Trash2 size={14} style={{ margin: '0 auto' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Type
                    <select
                      className="focus-ring"
                      value={charger.chargerType}
                      onChange={(event) => updateChargerRow(index, 'chargerType', event.target.value)}
                      style={{
                        marginTop: '0.32rem',
                        width: '100%',
                        minHeight: 38,
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.26)',
                        background: 'rgba(10, 22, 40, 0.72)',
                        paddingInline: '0.55rem',
                      }}
                    >
                      {CHARGER_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Power (kW)"
                    value={charger.powerOutput}
                    onChange={(event) => updateChargerRow(index, 'powerOutput', event.target.value)}
                  />
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Connector
                    <select
                      className="focus-ring"
                      value={charger.connectorType}
                      onChange={(event) =>
                        updateChargerRow(index, 'connectorType', event.target.value)
                      }
                      style={{
                        marginTop: '0.32rem',
                        width: '100%',
                        minHeight: 38,
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.26)',
                        background: 'rgba(10, 22, 40, 0.72)',
                        paddingInline: '0.55rem',
                      }}
                    >
                      {CONNECTOR_TYPES.map((connector) => (
                        <option key={connector} value={connector}>
                          {connector}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Status
                    <select
                      className="focus-ring"
                      value={charger.status}
                      onChange={(event) => updateChargerRow(index, 'status', event.target.value)}
                      style={{
                        marginTop: '0.32rem',
                        width: '100%',
                        minHeight: 38,
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.26)',
                        background: 'rgba(10, 22, 40, 0.72)',
                        paddingInline: '0.55rem',
                      }}
                    >
                      {CHARGER_STATUS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              leftIcon={<Plus size={14} />}
              onClick={addChargerRow}
            >
              Add Charger Row
            </Button>
          </div>
        ) : null}

        {step === 3 ? (
          <div style={{ display: 'grid', gap: '0.62rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.55rem' }}>
              <Input
                label="Per kWh"
                value={form.pricing.perKwh}
                onChange={(event) => updatePricing('perKwh', event.target.value)}
              />
              <Input
                label="Per Minute"
                value={form.pricing.perMinute}
                onChange={(event) => updatePricing('perMinute', event.target.value)}
              />
              <Input
                label="Session Fee"
                value={form.pricing.sessionFee}
                onChange={(event) => updatePricing('sessionFee', event.target.value)}
              />
            </div>

            <Input
              label="Currency"
              value={form.pricing.currency}
              onChange={(event) => updatePricing('currency', event.target.value)}
            />

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--text-secondary)',
                fontSize: '0.86rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.operatingHours.is24Hours}
                onChange={(event) =>
                  updateOperatingHours('is24Hours', event.target.checked)
                }
              />
              Open 24 hours
            </label>

            {!form.operatingHours.is24Hours ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem' }}>
                <Input
                  label="Open (HH:mm)"
                  value={form.operatingHours.open}
                  onChange={(event) => updateOperatingHours('open', event.target.value)}
                />
                <Input
                  label="Close (HH:mm)"
                  value={form.operatingHours.close}
                  onChange={(event) => updateOperatingHours('close', event.target.value)}
                />
              </div>
            ) : null}

            <Input
              label="Amenities (comma separated)"
              value={form.amenitiesInput}
              onChange={(event) => updateForm({ amenitiesInput: event.target.value })}
              placeholder="wifi, parking, restrooms, cafe"
            />

            <div
              ref={dropzoneRef}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDraggingOver(false)
                handleDropFiles(event.dataTransfer.files)
              }}
              className="glass-card"
              style={{
                borderRadius: '12px',
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: isDraggingOver
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(255, 255, 255, 0.24)',
                background: isDraggingOver ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 22, 40, 0.62)',
                minHeight: 110,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                padding: '0.7rem',
              }}
            >
              <div>
                <UploadCloud size={18} style={{ margin: '0 auto 0.32rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  Drag and drop station images or upload manually
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => handleDropFiles(event.target.files)}
                  style={{ marginTop: '0.45rem' }}
                  aria-label="Upload station images"
                />
              </div>
            </div>

            {(form.existingImages.length || newImagePreviews.length) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.52rem' }}>
                {form.existingImages.map((imageUrl) => (
                  <div
                    key={`existing-${imageUrl}`}
                    style={{
                      width: 82,
                      height: 64,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Existing station"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="focus-ring"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          existingImages: current.existingImages.filter((url) => url !== imageUrl),
                        }))
                      }
                      aria-label="Remove existing image"
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        border: 'none',
                        background: 'rgba(5, 10, 14, 0.78)',
                        color: '#fff',
                      }}
                    >
                      <Trash2 size={12} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                ))}

                {newImagePreviews.map((item, index) => (
                  <div
                    key={`new-preview-${item.url}`}
                    style={{
                      width: 82,
                      height: 64,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                    }}
                  >
                    <img
                      src={item.url}
                      alt={`Uploaded preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="focus-ring"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          newImageFiles: current.newImageFiles.filter((file) => file !== item.file),
                        }))
                      }
                      aria-label={`Remove preview ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        border: 'none',
                        background: 'rgba(5, 10, 14, 0.78)',
                        color: '#fff',
                      }}
                    >
                      <Trash2 size={12} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="glass-card"
                style={{
                  borderRadius: '10px',
                  padding: '0.55rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.36rem',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <ImagePlus size={14} />
                No images selected.
              </div>
            )}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
            ) : null}

            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? 'Update Station' : 'Create Station'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default StationFormModal
