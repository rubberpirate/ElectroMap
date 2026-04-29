import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { PageWrapper } from '../components/layout'
import { LandscapeScene } from '../components/scene'
import { Button, Input } from '../components/ui'
import useAuth from '../hooks/useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateForm = (values) => {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

function Login() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { login, isLoading, isAuthenticated, error, clearError } = useAuth()

  const redirectParam = searchParams.get('redirect')
  const safeRedirect = useMemo(() => {
    if (!redirectParam || !redirectParam.startsWith('/')) {
      return '/map'
    }

    return redirectParam
  }, [redirectParam])

  const registerPath = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : '/register'

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
      await login({
        email: form.email.trim(),
        password: form.password,
      })

      if (!form.remember) {
        toast.success('Logged in. Session will end after you close the browser.')
      }

      navigate(safeRedirect, { replace: true })
    } catch (requestError) {
      setFieldErrors((current) => ({
        ...current,
        form:
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to login right now.',
      }))
    }
  }

  return (
    <PageWrapper title="Login" className="hero-gradient">
      <section className="auth-page sky-dot-grid">
        <div className="auth-card glass-card">
          <Link to="/" className="auth-logo focus-ring">
            <span>E</span>LECTROMAP
          </Link>

          <div>
            <h1>Login</h1>
            <p>Access saved stations, reviews, and live charging preferences.</p>
          </div>

          {fieldErrors.form || error ? (
            <div className="auth-alert">{fieldErrors.form || error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Your password"
              onChange={(event) => handleChange('password', event.target.value)}
              autoComplete="current-password"
            />

            <div className="auth-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => handleChange('remember', event.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="focus-ring" onClick={() => toast('Coming soon')}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" isLoading={isLoading}>
              Login
            </Button>
          </form>

          <div className="auth-divider">
            <span />
            <small>or continue with</small>
            <span />
          </div>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link to={registerPath} className="focus-ring">
              Sign up
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

            .auth-logo {
              justify-self: center;
              color: var(--text-primary);
              text-decoration: none;
              font-family: 'Syne', sans-serif;
              font-weight: 800;
              letter-spacing: 0;
            }

            .auth-logo span {
              color: var(--cyan);
            }

            .auth-card h1 {
              text-align: center;
              font-size: 2rem;
            }

            .auth-card p {
              margin-top: 0.3rem;
              text-align: center;
              color: var(--text-muted);
            }

            .auth-form {
              display: grid;
              gap: 0.82rem;
            }

            .auth-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.7rem;
              flex-wrap: wrap;
              color: var(--text-muted);
              font-size: 0.88rem;
            }

            .auth-row label {
              display: inline-flex;
              align-items: center;
              gap: 0.45rem;
            }

            .auth-row input {
              accent-color: var(--cyan);
            }

            .auth-row button {
              border: none;
              background: transparent;
              color: var(--cyan);
              padding: 0;
            }

            .auth-alert {
              border: 1px solid rgba(255, 77, 109, 0.4);
              background: rgba(255, 77, 109, 0.1);
              border-radius: 12px;
              padding: 0.6rem 0.7rem;
              color: var(--red-alert);
              font-size: 0.88rem;
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
            }

            .auth-switch a {
              color: var(--cyan);
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

export default Login
