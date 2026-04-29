import { motion } from 'framer-motion'

import { cn } from '../../utils/cn'

function Card({
  as: Component = 'div',
  children,
  className,
  neon = false,
  hover = true,
  initial = { opacity: 0, y: 18 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.45, ease: [0.2, 0.9, 0.2, 1] },
  ...props
}) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: neon
                ? 'var(--glow-cyan), 0 18px 34px rgba(0, 0, 0, 0.34)'
                : '0 16px 34px rgba(0, 0, 0, 0.28)',
            }
          : undefined
      }
    >
      <Component
        className={cn('glass-card', neon && 'neon-border', className)}
        style={{
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s ease',
        }}
        {...props}
      >
        {children}
      </Component>
    </motion.div>
  )
}

export default Card
