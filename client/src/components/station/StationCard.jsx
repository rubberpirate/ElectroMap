import { MapPin, Star, Zap } from 'lucide-react'

import { Badge, Card } from '../ui'

const formatChargerTypeLabel = (value) => {
  if (value === 'DC_Fast') {
    return 'DC Fast'
  }

  if (value === 'Tesla_Supercharger') {
    return 'Tesla'
  }

  return String(value || '')
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

function StationCard({
  station,
  variant = 'compact',
  isActive = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  const totalChargers = Number(station?.totalChargers) || 0
  const availableChargers = Number(station?.availableChargers) || 0
  const rating = Number(station?.rating) || 0
  const distanceKm = Number(station?.distanceKm)
  const isFull = variant === 'full'
  const stationName = station?.stationName || 'Unnamed station'
  const stationImage =
    Array.isArray(station?.images) && station.images.length ? station.images[0] : ''
  const imageFallbackInitials = getInitials(stationName)
  const locationLabel = station?.city
    ? station?.state
      ? `${station.city}, ${station.state}`
      : station.city
    : 'Unknown city'
  const openStateLabel =
    station?.isOpen === true ? 'Open' : station?.isOpen === false ? 'Closed' : 'Status unknown'

  return (
    <Card
      hover
      className="glass-card"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%',
        borderColor: isActive ? 'rgba(0, 212, 255, 0.52)' : 'var(--border)',
      }}
    >
      <button
        type="button"
        aria-label={`Open station ${stationName}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="focus-ring"
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          textAlign: 'left',
          padding: variant === 'compact' ? '0.8rem' : '0.72rem',
          display: 'grid',
          gap: isFull ? '0.75rem' : '0.65rem',
          cursor: 'pointer',
        }}
      >
        {isFull ? (
          <div
            style={{
              height: 156,
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 212, 255, 0.18)',
              position: 'relative',
            }}
          >
            {stationImage ? (
              <img
                src={stationImage}
                alt={stationName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    'linear-gradient(130deg, rgba(0, 212, 255, 0.18), rgba(123, 47, 255, 0.2))',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '1.45rem',
                  letterSpacing: '0.04em',
                }}
              >
                {imageFallbackInitials}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                borderRadius: '999px',
                padding: '0.16rem 0.5rem',
                border: '1px solid rgba(232, 244, 248, 0.32)',
                background: 'rgba(5, 10, 14, 0.66)',
                color: station?.isOpen ? 'var(--accent-green)' : 'var(--accent-red)',
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
            >
              {openStateLabel}
            </span>
          </div>
        ) : null}

        <div>
          <h3 style={{ fontSize: variant === 'compact' ? '1.02rem' : '1.14rem' }}>{stationName}</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginTop: '0.22rem',
              display: 'inline-flex',
              gap: '0.36rem',
              alignItems: 'center',
            }}
          >
            <MapPin size={14} />
            {locationLabel}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.62rem',
            alignItems: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.86rem',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Star size={14} color="var(--accent-amber)" />
            {rating.toFixed(1)}
          </span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Zap size={14} color="var(--accent-primary)" />
            {availableChargers}/{totalChargers} available
          </span>

          {Number.isFinite(distanceKm) ? (
            <span className="mono-data">{distanceKm.toFixed(1)} km</span>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem' }}>
          {(station?.chargerTypes || []).slice(0, 3).map((chargerType) => (
            <Badge key={`${station?._id}-${chargerType}`} value={chargerType} size="sm">
              {formatChargerTypeLabel(chargerType)}
            </Badge>
          ))}
        </div>
      </button>
    </Card>
  )
}

export default StationCard
