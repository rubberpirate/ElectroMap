import { cn } from '../../utils/cn'

function GradientText({ children, className }) {
  return (
    <span
      className={cn(className)}
      style={{
        background: 'linear-gradient(118deg, #8ee8ff 0%, #00d4ff 35%, #7b2fff 78%, #b983ff 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  )
}

export default GradientText
