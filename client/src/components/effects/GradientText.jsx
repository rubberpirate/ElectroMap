import { cn } from '../../utils/cn'

function GradientText({ children, className }) {
  return (
    <span
      className={cn(className)}
      style={{
        background: 'linear-gradient(118deg, #8ee8ff 0%, #f0f0f0 35%, #ff3333 78%, #b983ff 100%)',
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
