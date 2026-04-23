import { motion } from 'framer-motion'
import { useState } from 'react'

import { cn } from '../../utils/cn'

const clamp = (value) => Math.max(-10, Math.min(10, value))

function TiltedCard({ children, className, style, disabled = false }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const onMove = (event) => {
    if (disabled) {
      return
    }

    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height

    setRotation({
      x: clamp((0.5 - relativeY) * 14),
      y: clamp((relativeX - 0.5) * 14),
    })
  }

  const reset = () => setRotation({ x: 0, y: 0 })

  return (
    <motion.div
      className={cn(className)}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 180ms var(--easing-smooth)',
        ...style,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
    </motion.div>
  )
}

export default TiltedCard
