import { cn } from '../../utils/cn'

const sizeMap = {
  sm: {
    fontSize: '0.72rem',
    padding: '0.2rem 0.52rem',
  },
  md: {
    fontSize: '0.78rem',
    padding: '0.26rem 0.66rem',
  },
  lg: {
    fontSize: '0.86rem',
    padding: '0.34rem 0.76rem',
  },
}

const chargerTypeMap = {
  level1: {
    color: 'var(--slate)',
    background: 'rgba(148, 163, 184, 0.18)',
    border: '1px solid rgba(148, 163, 184, 0.36)',
  },
  level2: {
    color: 'var(--cyan)',
    background: 'rgba(0, 232, 204, 0.12)',
    border: '1px solid rgba(0, 232, 204, 0.32)',
  },
  dc_fast: {
    color: '#ffb15b',
    background: 'rgba(253, 122, 1, 0.14)',
    border: '1px solid rgba(253, 122, 1, 0.4)',
  },
  tesla: {
    color: 'var(--text-primary)',
    background: 'rgba(230, 242, 239, 0.12)',
    border: '1px solid rgba(230, 242, 239, 0.3)',
  },
  tesla_supercharger: {
    color: 'var(--text-primary)',
    background: 'rgba(230, 242, 239, 0.12)',
    border: '1px solid rgba(230, 242, 239, 0.3)',
  },
}

const statusMap = {
  available: {
    color: 'var(--accent-green)',
    background: 'rgba(0, 255, 136, 0.14)',
    border: '1px solid rgba(0, 255, 136, 0.34)',
    boxShadow: '0 0 16px rgba(0, 255, 136, 0.24)',
  },
  occupied: {
    color: 'var(--amber)',
    background: 'rgba(253, 122, 1, 0.14)',
    border: '1px solid rgba(253, 122, 1, 0.34)',
  },
  offline: {
    color: '#9ca9b6',
    background: 'rgba(148, 163, 184, 0.14)',
    border: '1px solid rgba(148, 163, 184, 0.28)',
  },
  maintenance: {
    color: 'var(--accent-amber)',
    background: 'rgba(255, 184, 0, 0.15)',
    border: '1px solid rgba(255, 184, 0, 0.32)',
  },
}

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_')

function Badge({ value, kind = 'charger', size = 'md', className, children }) {
  const key = normalize(value || children)
  const palette = kind === 'status' ? statusMap[key] : chargerTypeMap[key]
  const scale = sizeMap[size] || sizeMap.md

  return (
    <span
      className={cn(className)}
      style={{
        ...scale,
        ...palette,
        borderRadius: '999px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: kind === 'status' ? 'capitalize' : 'none',
        letterSpacing: 0,
        transition: 'all 0.2s ease',
      }}
    >
      {children || value}
    </span>
  )
}

export default Badge
