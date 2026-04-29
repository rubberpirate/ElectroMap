import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { PageWrapper } from '../components/layout'
import { LandscapeScene } from '../components/scene'
import { Button, Input } from '../components/ui'
import useAuth from '../hooks/useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getPasswordStrength = (password) => {
  if (!password) {
    return 0
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

const getStrengthMeta = (score) => {
  if (score <= 1) return { label: 'Weak', color: 'var(--red-alert)' }
  if (score <= 3) return { label: 'Medium', color: 'var(--amber)' }
  return { label: 'Strong', color: 'var(--green-glow)' }
}

const validateForm = (values) => {
  const errors = {}

  if (!values.username.trim()) {
    errors.username = 'Username is required.'
  } else if (values.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  } else if (!/[A-Z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Include one uppercase letter and one number.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = 'You must agree to the Terms of Service.'
  }

  return errors
}

function Register() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { register, isLoading, isAuthenticated, error, clearError } = useAuth()

  const redirectParam = searchParams.get('redirect')
  const safeRedirect = useMemo(() => {
    if (!redirectParam || !redirectParam.startsWith('/')) {
      return '/map'
    }

    return redirectParam
  }, [redirectParam])

  const loginPath = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'
  const passwordStrength = getPasswordStrength(form.password)
  const passwordStrengthMeta = getStrengthMeta(passwordStrength)

  if (isAuthenticated) {
    return <Navigate to={safeRedirect} replace />
  }

  const handleChange = (key, value) => {
    if (error) {
      clearError?.()
    }

    setFieldErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }))

    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm(form)
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      return
    }

    clearError?.()

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      toast.success('Welcome to ElectroMap!')
      navigate(safeRedirect, { replace: true })
    } catch (requestError) {
      setFieldErrors((current) => ({
        ...current,
        form:
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to create account right now.',
      }))
    }
  }

  return (
    <PageWrapper title="Register" className="hero-gradient">
      <section className="auth-page sky-dot-grid">
        <div className="auth-card auth-card-register glass-card">
          <Link to="/" className="auth-logo focus-ring">
            <span>E</span>LECTROMAP
          </Link>

          <div>
            <h1>Create account</h1>
            <p>Save reliable stations, write reviews, and personalize your EV map.</p>
          </div>

          {fieldErrors.form || error ? (
            <div className="auth-alert">{fieldErrors.form || error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Username"
              value={form.username}
              error={fieldErrors.username}
              leftIcon={<UserRound size={16} />}
              placeholder="Your username"
              onChange={(event) => handleChange('username', event.target.value)}
              autoComplete="username"
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              error={fieldErrors.email}
              leftIcon={<Mail size={16} />}
              placeholder="you@example.com"
              onChange={(event) => handleChange('email', event.target.value)}
              autoComplete="email"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              error={fieldErrors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="focus-ring"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              placeholder="Create password"
              onChange={(event) => handleChange('password', event.target.value)}
              autoComplete="new-password"
            />

            <div className="auth-strength">
              <div>
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={`strength-${index}`}
                    style={{
                      background:
                        passwordStrength > index ? passwordStrengthMeta.color : 'rgba(122, 163, 178, 0.25)',
                    }}
                  />
                ))}
              </div>
              <small style={{ color: passwordStrengthMeta.color }}>
                Password strength: {passwordStrengthMeta.label}
              </small>
            </div>

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              error={fieldErrors.confirmPassword}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="focus-ring"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              placeholder="Confirm password"
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              autoComplete="new-password"
            />

            <label className="auth-terms">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(event) => handleChange('acceptTerms', event.target.checked)}
              />
              I agree to the Terms of Service
            </label>
            {fieldErrors.acceptTerms ? <small style={{ color: 'var(--red-alert)' }}>{fieldErrors.acceptTerms}</small> : null}

            <Button type="submit" isLoading={isLoading}>
              Register
            </Button>
          </form>

          <div className="auth-divider">
            <span />
            <small>or continue with</small>
            <span />
          </div>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to={loginPath} className="focus-ring">
              Login
            </Link>
          </p>

          <LandscapeScene compact className="auth-landscape" />
        </div>

        <style>
          {`
            .auth-page {
              position: relative;
              min-height: 100svh;
              display: grid;
              place-items: center;
              padding: 2rem 1rem;
              overflow: hidden;
              background-color: var(--bg-deep);
            }

            .auth-card {
              position: relative;
              width: min(440px, 100%);
              min-height: 620px;
              overflow: hidden;
              padding: 1.35rem;
              display: grid;
              align-content: start;
              gap: 1rem;
              z-index: 2;
            }

            .auth-card-register {
              min-height: 740px;
            }

            .auth-logo {
              justify-self: center;
              color: var(--text-primary);
              text-decoration: none;
              font-family: 'Syne', sans-serif;
              font-weight: 800;
            }

            .auth-logo span,
            .auth-switch a {
              color: var(--cyan);
            }

            .auth-card h1,
            .auth-card p {
              text-align: center;
            }

            .auth-card h1 {
              font-size: 2rem;
            }

            .auth-card p,
            .auth-switch,
            .auth-terms {
              color: var(--text-muted);
            }

            .auth-form {
              display: grid;
              gap: 0.82rem;
            }

            .auth-alert {
              border: 1px solid rgba(255, 77, 109, 0.4);
              background: rgba(255, 77, 109, 0.1);
              border-radius: 12px;
              padding: 0.6rem 0.7rem;
              color: var(--red-alert);
              font-size: 0.88rem;
            }

            .auth-strength {
              display: grid;
              gap: 0.35rem;
            }

            .auth-strength > div {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.35rem;
            }

            .auth-strength span {
              height: 6px;
              border-radius: 999px;
            }

            .auth-terms {
              display: inline-flex;
              align-items: center;
              gap: 0.45rem;
              font-size: 0.88rem;
            }

            .auth-terms input {
              accent-color: var(--cyan);
            }

            .auth-divider {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: center;
              gap: 0.7rem;
              color: var(--text-muted);
              font-size: 0.84rem;
            }

            .auth-divider span {
              height: 1px;
              background: var(--border-subtle);
            }

            .auth-switch {
              position: relative;
              z-index: 3;
              padding-bottom: 9rem;
              text-align: center;
            }

            .auth-landscape {
              opacity: 0.9;
              z-index: 1;
            }
          `}
        </style>
      </section>
    </PageWrapper>
  )
}

export default Register
