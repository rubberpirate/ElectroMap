import { forwardRef, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { cn } from '../../utils/cn'
import Spinner from './Spinner'

const variantStyles = {
  primary: {
    background: 'var(--cyan)',
    color: '#03131b',
    border: '1px solid rgba(0, 232, 204, 0.76)',
    boxShadow: 'var(--glow-cyan)',
  },
  secondary: {
    background: 'rgba(22, 40, 64, 0.82)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-strong)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  },
  danger: {
    background: 'rgba(255, 77, 109, 0.12)',
    color: '#ffc0ca',
    border: '1px solid rgba(255, 77, 109, 0.64)',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.28)',
  },
  icon: {
    background: 'rgba(22, 40, 64, 0.82)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'none',
  },
}

const sizeStyles = {
  sm: {
    height: 36,
    paddingInline: 14,
    fontSize: '0.86rem',
    borderRadius: '999px',
    gap: '0.35rem',
  },
  md: {
    height: 44,
    paddingInline: 18,
    fontSize: '0.95rem',
    borderRadius: '999px',
    gap: '0.45rem',
  },
  lg: {
    height: 52,
    paddingInline: 24,
    fontSize: '1rem',
    borderRadius: '999px',
    gap: '0.5rem',
  },
}

const clampOffset = (value) => Math.max(-10, Math.min(10, value))

const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    magnet = true,
    style,
    type = 'button',
    disabled,
    onMouseMove,
    onMouseLeave,
    ...props
  },
  ref,
) {
  const buttonRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const computedDisabled = disabled || isLoading
  const computedVariantStyle = variantStyles[variant] || variantStyles.primary
  const computedSizeStyle = sizeStyles[size] || sizeStyles.md

  const handleMouseMove = (event) => {
    if (!magnet || computedDisabled) {
      onMouseMove?.(event)
      return
    }

    const element = buttonRef.current
    if (!element) {
      onMouseMove?.(event)
      return
    }

    const rect = element.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16

    setOffset({ x: clampOffset(x), y: clampOffset(y) })
    onMouseMove?.(event)
  }

  const handleMouseLeave = (event) => {
    setOffset({ x: 0, y: 0 })
    onMouseLeave?.(event)
  }

  return (
    <motion.button
      ref={(node) => {
        buttonRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      type={type}
      className={cn('focus-ring', className)}
      disabled={computedDisabled}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...computedVariantStyle,
        ...computedSizeStyle,
        ...style,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        letterSpacing: 0,
        transition: 'all 0.15s ease',
        opacity: computedDisabled ? 0.7 : 1,
      }}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {!isLoading && leftIcon}
      <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
      {!isLoading && rightIcon}
    </motion.button>
  )
})

export default Button
