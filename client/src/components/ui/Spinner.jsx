import { cn } from '../../utils/cn'

const spinnerSizeMap = {
  sm: 16,
  md: 22,
  lg: 30,
}

function Spinner({ size = 'md', className, label = 'Loading' }) {
  const dimension = spinnerSizeMap[size] || spinnerSizeMap.md
  const borderWidth = size === 'sm' ? 2 : 3

  return (
    <span
      aria-label={label}
      aria-live="polite"
      role="status"
      className={cn(className)}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: '999px',
        border: `${borderWidth}px solid rgba(122, 157, 181, 0.25)`,
        borderTopColor: 'var(--accent-primary)',
        borderRightColor: 'rgba(253, 122, 1, 0.7)',
        animation: 'spin 0.85s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

export default Spinner
