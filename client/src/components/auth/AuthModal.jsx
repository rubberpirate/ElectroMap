import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'
import { Button, Input, Modal } from '../ui'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getPasswordStrength = (password) => {
  if (!password) {
    return 0
  }

  let score = 0

  if (password.length >= 8) {
    score += 1
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  }

  if (/\d/.test(password)) {
    score += 1
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  }

  return score
}

const getStrengthMeta = (score) => {
  if (score <= 1) {
    return { label: 'Weak', color: 'var(--accent-red)' }
  }

  if (score <= 3) {
    return { label: 'Medium', color: 'var(--accent-amber)' }
  }

  return { label: 'Strong', color: 'var(--accent-green)' }
}

const validateLogin = (values) => {
  const nextErrors = {}

  if (!values.email.trim()) {
    nextErrors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email.trim())) {
    nextErrors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    nextErrors.password = 'Password is required.'
  }

  return nextErrors
}

const validateRegister = (values) => {
  const nextErrors = {}

  if (!values.username.trim()) {
    nextErrors.username = 'Username is required.'
  } else if (values.username.trim().length < 3) {
    nextErrors.username = 'Username must be at least 3 characters.'
  }

  if (!values.email.trim()) {
    nextErrors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email.trim())) {
    nextErrors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    nextErrors.password = 'Password is required.'
  } else {
    if (values.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.'
    } else if (!/[A-Z]/.test(values.password) || !/\d/.test(values.password)) {
      nextErrors.password = 'Include one uppercase letter and one number.'
    }
  }

  if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = 'Passwords do not match.'
  }

  if (!values.acceptTerms) {
    nextErrors.acceptTerms = 'Please accept the terms to continue.'
  }

  return nextErrors
}

function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  redirectTo = '/map',
  onSuccess,
}) {
  const [tab, setTab] = useState(initialTab === 'register' ? 'register' : 'login')
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { login, register, clearError, error: authError, isLoading } = useAuth()

  const strengthScore = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password],
  )
  const strengthMeta = getStrengthMeta(strengthScore)

  const handleClose = () => {
    setErrors({})
    clearError?.()
    onClose?.()
  }

  const handleSwitchTab = (nextTab) => {
    setTab(nextTab)
    setErrors({})
    clearError?.()
  }

  const handleSuccess = () => {
    if (typeof onSuccess === 'function') {
      onSuccess()
      handleClose()
      return
    }

    handleClose()
    navigate(redirectTo || '/map', { replace: true })
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateLogin(loginForm)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      return
    }

    clearError?.()

    try {
      await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      })
      toast.success('Welcome back!')
      handleSuccess()
    } catch (requestError) {
      setErrors((current) => ({
        ...current,
        form:
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to sign in.',
      }))
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateRegister(registerForm)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      return
    }

    clearError?.()

    try {
      await register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      })
      toast.success('Welcome to ElectroMap!')
      handleSuccess()
    } catch (requestError) {
      setErrors((current) => ({
        ...current,
        form:
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to create account.',
      }))
    }
  }

  const sharedError = errors.form || authError

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Continue with ElectroMap"
      className="glass-card"
    >
      <div
        style={{
          display: 'grid',
          gap: '0.9rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.4rem',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '0.3rem',
            background: 'rgba(10, 22, 40, 0.6)',
          }}
        >
          <button
            type="button"
            className="focus-ring"
            onClick={() => handleSwitchTab('login')}
            style={{
              minHeight: 38,
              borderRadius: '9px',
              border: 'none',
              background:
                tab === 'login' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
              color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Login
          </button>
          <button
            type="button"
            className="focus-ring"
            onClick={() => handleSwitchTab('register')}
            style={{
              minHeight: 38,
              borderRadius: '9px',
              border: 'none',
              background:
                tab === 'register' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
              color:
                tab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Register
          </button>
        </div>

        {sharedError ? (
          <div
            style={{
              border: '1px solid rgba(255, 61, 90, 0.42)',
              borderRadius: '10px',
              padding: '0.52rem 0.62rem',
              color: 'var(--accent-red)',
              fontSize: '0.88rem',
              background: 'rgba(255, 61, 90, 0.08)',
            }}
          >
            {sharedError}
          </div>
        ) : null}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'grid', gap: '0.72rem' }}>
            <Input
              label="Email"
              type="email"
              value={loginForm.email}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              autoComplete="email"
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginForm.password}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="focus-ring"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              autoComplete="current-password"
              placeholder="Enter password"
            />

            <Button type="submit" isLoading={isLoading}>
              Login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gap: '0.72rem' }}>
            <Input
              label="Username"
              value={registerForm.username}
              error={errors.username}
              leftIcon={<UserRound size={16} />}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              autoComplete="username"
              placeholder="Your name"
            />

            <Input
              label="Email"
              type="email"
              value={registerForm.email}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              autoComplete="email"
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={registerForm.password}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="focus-ring"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              autoComplete="new-password"
              placeholder="Create password"
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={registerForm.confirmPassword}
              error={errors.confirmPassword}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="focus-ring"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              autoComplete="new-password"
              placeholder="Confirm password"
            />

            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={`strength-segment-${segment}`}
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background:
                        strengthScore > segment
                          ? strengthMeta.color
                          : 'rgba(122, 157, 181, 0.25)',
                    }}
                  />
                ))}
              </div>
              <small style={{ color: strengthMeta.color }}>Password strength: {strengthMeta.label}</small>
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
              }}
            >
              <input
                type="checkbox"
                checked={registerForm.acceptTerms}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    acceptTerms: event.target.checked,
                  }))
                }
              />
              I agree to the Terms of Service
            </label>
            {errors.acceptTerms ? (
              <small style={{ color: 'var(--accent-red)' }}>{errors.acceptTerms}</small>
            ) : null}

            <Button type="submit" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default AuthModal
