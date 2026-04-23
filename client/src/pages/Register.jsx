import { Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { Particles } from '../components/effects'
import { PageWrapper } from '../components/layout'
import { Button, Input } from '../components/ui'
import useAuth from '../hooks/useAuth'

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
	} else {
		if (values.password.length < 8) {
			errors.password = 'Use at least 8 characters.'
		} else if (!/[A-Z]/.test(values.password) || !/\d/.test(values.password)) {
			errors.password = 'Include one uppercase letter and one number.'
		}
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

	const loginPath = redirectParam
		? `/login?redirect=${encodeURIComponent(redirectParam)}`
		: '/login'

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
					<Particles count={78} />
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
							minHeight: 560,
						}}
					>
						<span
							className="chip"
							style={{
								width: 'fit-content',
								borderColor: 'rgba(255, 51, 51, 0.4)',
								background: 'rgba(255, 51, 51, 0.14)',
								color: '#b79dff',
							}}
						>
							<ShieldCheck size={14} />
							Secure by design
						</span>

						<h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.06 }}>
							Create Your
							<br />
							Driver Account
						</h1>

						<p style={{ color: 'var(--text-secondary)', maxWidth: 500, fontSize: '1.02rem' }}>
							Save your preferred stations, leave trusted charging reviews, and get faster access
							to real-time availability.
						</p>

						<div
							className="glass-card"
							style={{
								marginTop: '0.75rem',
								borderRadius: '14px',
								padding: '0.85rem',
								borderColor: 'rgba(255, 255, 255, 0.28)',
							}}
						>
							<small style={{ color: 'var(--text-secondary)' }}>Community Momentum</small>
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
							minHeight: 560,
							display: 'grid',
							alignContent: 'center',
						}}
					>
						<h2 style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>Create account</h2>
						<p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
							Build your profile to unlock saved stations and reviews.
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
								placeholder="Create password"
								onChange={(event) => handleChange('password', event.target.value)}
								autoComplete="new-password"
							/>

							<div style={{ display: 'grid', gap: '0.35rem' }}>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
									{[0, 1, 2, 3].map((index) => (
										<span
											key={`strength-${index}`}
											style={{
												height: 6,
												borderRadius: 999,
												background:
													passwordStrength > index
														? passwordStrengthMeta.color
														: 'rgba(122, 157, 181, 0.25)',
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
								placeholder="Confirm password"
								onChange={(event) => handleChange('confirmPassword', event.target.value)}
								autoComplete="new-password"
							/>

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
									checked={form.acceptTerms}
									onChange={(event) => handleChange('acceptTerms', event.target.checked)}
								/>
								I agree to the Terms of Service
							</label>
							{fieldErrors.acceptTerms ? (
								<small style={{ color: 'var(--accent-red)' }}>{fieldErrors.acceptTerms}</small>
							) : null}

							<Button type="submit" isLoading={isLoading}>
								Register
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
							Already have an account?{' '}
							<Link to={loginPath} className="focus-ring" style={{ color: 'var(--accent-primary)' }}>
								Login
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

export default Register
