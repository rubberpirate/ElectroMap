import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { Particles } from '../components/effects'
import { PageWrapper } from '../components/layout'
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
			<section
				style={{
					position: 'relative',
					minHeight: '100vh',
					display: 'grid',
					alignItems: 'center',
					padding: '5rem 1rem 2rem',
					overflow: 'hidden',
				}}
			>
				<div style={{ position: 'absolute', inset: 0, opacity: 0.22 }}>
					<Particles count={72} />
				</div>

				<div
					className="container-shell"
					style={{
						position: 'relative',
						zIndex: 2,
						display: 'grid',
						gridTemplateColumns: '1.05fr 1fr',
						gap: '1rem',
					}}
				>
					<div
						className="glass-card"
						style={{
							padding: '1.4rem',
							borderRadius: 'var(--radius-lg)',
							display: 'grid',
							alignContent: 'center',
							gap: '0.85rem',
							minHeight: 520,
						}}
					>
						<span
							className="chip"
							style={{
								width: 'fit-content',
								borderColor: 'rgba(0, 212, 255, 0.4)',
								background: 'rgba(0, 212, 255, 0.14)',
								color: 'var(--accent-primary)',
							}}
						>
							<Sparkles size={14} />
							Welcome back
						</span>

						<h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.06 }}>
							Recharge Your
							<br />
							Electric Journey
						</h1>

						<p style={{ color: 'var(--text-secondary)', maxWidth: 480, fontSize: '1.02rem' }}>
							Discover live charging availability, trusted reviews, and route-ready station
							insights designed for EV drivers across India.
						</p>

						<div
							className="glass-card"
							style={{
								marginTop: '0.75rem',
								borderRadius: '14px',
								padding: '0.85rem',
								borderColor: 'rgba(0, 212, 255, 0.28)',
							}}
						>
							<small style={{ color: 'var(--text-secondary)' }}>Community Trust</small>
							<p className="mono-data" style={{ marginTop: '0.3rem', fontSize: '1.18rem' }}>
								Join 10,000+ EV drivers
							</p>
						</div>
					</div>

					<div
						className="glass-card"
						style={{
							padding: '1.3rem',
							borderRadius: 'var(--radius-lg)',
							minHeight: 520,
							display: 'grid',
							alignContent: 'center',
						}}
					>
						<h2 style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>Login</h2>
						<p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
							Access your saved stations, reviews, and profile.
						</p>

						{(fieldErrors.form || error) ? (
							<div
								style={{
									border: '1px solid rgba(255, 61, 90, 0.4)',
									background: 'rgba(255, 61, 90, 0.1)',
									borderRadius: '10px',
									padding: '0.55rem 0.65rem',
									color: 'var(--accent-red)',
									marginBottom: '0.8rem',
									fontSize: '0.86rem',
								}}
							>
								{fieldErrors.form || error}
							</div>
						) : null}

						<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
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

							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									gap: '0.5rem',
									flexWrap: 'wrap',
								}}
							>
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
										checked={form.remember}
										onChange={(event) => handleChange('remember', event.target.checked)}
									/>
									Remember me
								</label>

								<button
									type="button"
									className="focus-ring"
									onClick={() => toast('Coming soon')}
									style={{
										border: 'none',
										background: 'transparent',
										color: 'var(--accent-primary)',
										fontSize: '0.88rem',
										padding: 0,
									}}
								>
									Forgot password?
								</button>
							</div>

							<Button type="submit" isLoading={isLoading}>
								Login
							</Button>
						</form>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr auto 1fr',
								alignItems: 'center',
								gap: '0.7rem',
								margin: '1rem 0',
								color: 'var(--text-secondary)',
								fontSize: '0.85rem',
							}}
						>
							<span style={{ height: 1, background: 'rgba(122, 157, 181, 0.26)' }} />
							<span>or</span>
							<span style={{ height: 1, background: 'rgba(122, 157, 181, 0.26)' }} />
						</div>

						<p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
							New to ElectroMap?{' '}
							<Link to={registerPath} className="focus-ring" style={{ color: 'var(--accent-primary)' }}>
								Create account
							</Link>
						</p>
					</div>
				</div>

				<style>
					{`
						@media (max-width: 920px) {
							.container-shell {
								width: min(100%, calc(100% - 1.4rem));
							}
						}

						@media (max-width: 900px) {
							.container-shell {
								display: grid;
								grid-template-columns: minmax(0, 1fr) !important;
							}
						}
					`}
				</style>
			</section>
		</PageWrapper>
	)
}

export default Login
