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
                ? '0 0 0 1px rgba(255, 51, 51, 0.35), 0 12px 28px rgba(0, 0, 0, 0.38)'
                : '0 12px 26px rgba(0, 0, 0, 0.34)',
            }
          : undefined
      }
    >
      <Component
        className={cn('glass-card', neon && 'neon-border', className)}
        style={{
          borderRadius: 'var(--radius-md)',
          transition: 'all 220ms var(--easing-smooth)',
        }}
        {...props}
      >
        {children}
      </Component>
    </motion.div>
  )
}

export default Card
