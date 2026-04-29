import { Star } from 'lucide-react'

function RatingWidget({
  value = 0,
  onChange,
  readOnly = false,
  size = 18,
  className,
  label = 'Rating',
}) {
  const currentValue = Number(value) || 0

  return (
    <span
      className={className}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = currentValue >= star - 0.25
        const isHalf = !isActive && currentValue >= star - 0.75

        if (readOnly) {
          return (
            <span key={star} style={{ position: 'relative', display: 'inline-grid' }}>
              <Star size={size} color="rgba(253, 122, 1, 0.45)" />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  width: isActive ? '100%' : isHalf ? '50%' : '0%',
                }}
              >
                <Star size={size} color="var(--amber)" fill="var(--amber)" />
              </span>
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={Math.round(currentValue) === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className="focus-ring"
            onClick={() => onChange?.(star)}
            style={{
              width: size + 8,
              height: size + 8,
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--amber)' : 'rgba(122, 163, 178, 0.68)',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <Star size={size} fill={isActive ? 'var(--amber)' : 'transparent'} />
          </button>
        )
      })}
    </span>
  )
}

export default RatingWidget
