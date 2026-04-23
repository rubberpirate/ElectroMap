import { motion } from 'framer-motion'

import { cn } from '../../utils/cn'

function StarBorder({ children, className, contentClassName, animated = true }) {
  return (
    <div
      className={cn(className)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        padding: '1px',
        overflow: 'hidden',
      }}
    >
      {animated ? (
        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-50%',
            background:
              'conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, rgba(255, 255, 255, 0.9) 95deg, rgba(255, 51, 51, 0.85) 180deg, rgba(255, 255, 255, 0) 260deg)',
            filter: 'blur(2px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      ) : null}

      <div
        className={cn('glass-card', contentClassName)}
        style={{
          position: 'relative',
          borderRadius: 'calc(var(--radius-md) - 1px)',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default StarBorder
