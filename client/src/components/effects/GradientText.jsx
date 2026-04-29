import { cn } from '../../utils/cn'

function GradientText({ children, className }) {
  return (
    <span
      className={cn(className)}
      style={{
        background: 'linear-gradient(118deg, #00e8cc 0%, #e6f2ef 45%, #fd7a01 100%)',
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
