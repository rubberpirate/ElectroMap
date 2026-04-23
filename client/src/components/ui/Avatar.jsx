import { useMemo, useState } from 'react'

import { cn } from '../../utils/cn'

const sizeMap = {
  sm: 34,
  md: 44,
  lg: 58,
}

const resolveInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)

  if (!parts.length) {
    return 'EM'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function Avatar({
  src,
  alt = 'User avatar',
  name,
  size = 'md',
  online = false,
  className,
  onClick,
}) {
  const [hasError, setHasError] = useState(false)
  const dimension = sizeMap[size] || sizeMap.md
  const initials = useMemo(() => resolveInitials(name || alt), [alt, name])

  return (
    <span
      className={cn(className)}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        background: 'linear-gradient(140deg, rgba(255, 255, 255, 0.14), rgba(255, 51, 51, 0.2))',
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={name ? `${name} avatar` : 'User avatar'}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: dimension > 50 ? '1rem' : '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
          }}
        >
          {initials}
        </span>
      )}

      {online ? (
        <span
          aria-label="Online"
          style={{
            position: 'absolute',
            right: 1,
            bottom: 1,
            width: dimension > 50 ? 12 : 10,
            height: dimension > 50 ? 12 : 10,
            borderRadius: '999px',
            border: '2px solid var(--bg-primary)',
            background: 'var(--accent-green)',
            boxShadow: '0 0 14px rgba(0, 255, 136, 0.45)',
          }}
        />
      ) : null}
    </span>
  )
}

export default Avatar
