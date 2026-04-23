import { useEffect, useRef } from 'react'

import { cn } from '../../utils/cn'

const defaultPalette = [
  'rgba(255, 255, 255, 0.62)',
  'rgba(255, 51, 51, 0.58)',
  'rgba(120, 220, 255, 0.38)',
]

function buildParticles(width, height, count) {
  return Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    radius: 0.7 + Math.random() * 2.4,
    alpha: 0.2 + Math.random() * 0.7,
  }))
}

function Particles({ className, count = 110, palette = defaultPalette }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    let animationFrame = null
    let particles = []

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = buildParticles(rect.width, rect.height, count)
    }

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect()

      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -20 || particle.x > width + 20) {
          particle.vx *= -1
        }

        if (particle.y < -20 || particle.y > height + 20) {
          particle.vy *= -1
        }

        context.beginPath()
        context.fillStyle = palette[Math.floor(Math.random() * palette.length)]
        context.globalAlpha = particle.alpha
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1

      animationFrame = window.requestAnimationFrame(render)
    }

    updateSize()
    render()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(canvas)

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      resizeObserver.disconnect()
    }
  }, [count, palette])

  return (
    <canvas
      aria-hidden="true"
      className={cn(className)}
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

export default Particles
