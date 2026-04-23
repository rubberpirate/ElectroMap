import { forwardRef, useId } from 'react'

import { cn } from '../../utils/cn'

const getInputWrapperStyles = ({ hasError, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.55rem',
  borderRadius: '12px',
  border: `1px solid ${hasError ? 'rgba(255, 61, 90, 0.58)' : 'rgba(0, 212, 255, 0.24)'}`,
  background: 'rgba(10, 22, 40, 0.66)',
  paddingInline: '0.78rem',
  minHeight: '46px',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
  opacity: disabled ? 0.65 : 1,
})

const Input = forwardRef(function Input(
  {
    label,
    error,
    leftIcon,
    rightIcon,
    floatingLabel = false,
    className,
    wrapperClassName,
    id,
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  const hasError = Boolean(error)

  if (floatingLabel) {
    return (
      <div className={cn(wrapperClassName)} style={{ width: '100%' }}>
        <label
          htmlFor={inputId}
          style={{
            position: 'relative',
            display: 'block',
          }}
        >
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            placeholder=" "
            className={cn('focus-ring', className)}
            style={{
              ...getInputWrapperStyles({ hasError, disabled }),
              width: '100%',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.95rem',
            }}
            {...props}
          />
          <span
            style={{
              position: 'absolute',
              left: '0.8rem',
              top: '0.75rem',
              fontSize: '0.78rem',
              color: hasError ? 'var(--accent-red)' : 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              paddingInline: '0.3rem',
              transition: 'all 160ms ease',
              pointerEvents: 'none',
            }}
          >
            {label}
          </span>
        </label>
        {error ? (
          <span
            style={{
              display: 'block',
              marginTop: '0.35rem',
              color: 'var(--accent-red)',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn(wrapperClassName)} style={{ width: '100%' }}>
      {label ? (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: '0.45rem',
            color: hasError ? 'var(--accent-red)' : 'var(--text-secondary)',
            fontSize: '0.86rem',
          }}
        >
          {label}
        </label>
      ) : null}

      <div style={getInputWrapperStyles({ hasError, disabled })}>
        {leftIcon ? <span style={{ color: 'var(--text-secondary)' }}>{leftIcon}</span> : null}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn('focus-ring', className)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
          }}
          {...props}
        />
        {rightIcon ? <span style={{ color: 'var(--text-secondary)' }}>{rightIcon}</span> : null}
      </div>

      {error ? (
        <span
          style={{
            display: 'block',
            marginTop: '0.35rem',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </span>
      ) : null}
    </div>
  )
})

export default Input
