import { motion } from 'framer-motion'
import {
	ArrowRight,
	Battery,
	BatteryCharging,
	Building2,
	ChevronDown,
	Clock3,
	LocateFixed,
	MapPinned,
	Route,
	ShieldCheck,
	Sparkles,
	Wifi,
	Zap,
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { GradientText, Particles, SplitText, StarBorder, TiltedCard } from '../components/effects'
import { Footer, Navbar, PageWrapper } from '../components/layout'
import { Button, Card } from '../components/ui'
import useGeolocation from '../hooks/useGeolocation'
import api from '../services/api'
import { getMapboxToken } from '../utils/mapbox'

const heroStats = [
	{ label: 'Stations', value: 1000, suffix: '+' },
	{ label: 'Cities', value: 50, suffix: '+' },
	{ label: 'Live updates', value: 24, suffix: '/7' },
]

const sampleStationMarkers = [
	{ id: 'delhi', coordinates: [77.209, 28.6139] },
	{ id: 'mumbai', coordinates: [72.8777, 19.076] },
	{ id: 'bengaluru', coordinates: [77.5946, 12.9716] },
	{ id: 'hyderabad', coordinates: [78.4867, 17.385] },
	{ id: 'chennai', coordinates: [80.2707, 13.0827] },
	{ id: 'pune', coordinates: [73.8567, 18.5204] },
	{ id: 'ahmedabad', coordinates: [72.5714, 23.0225] },
	{ id: 'jaipur', coordinates: [75.7873, 26.9124] },
]

const stepCards = [
	{
		icon: LocateFixed,
		title: 'Allow Location',
		description: 'We detect your position instantly with high confidence.',
	},
	{
		icon: MapPinned,
		title: 'Find Stations',
		description: 'Browse nearby chargers in a live availability grid.',
	},
	{
		icon: Zap,
		title: 'Navigate and Charge',
		description: 'Get directions, arrive, and start charging with clarity.',
	},
]

const chargerSupport = [
	{
		icon: Battery,
		title: 'Level 1',
		power: '3.3 kW',
		description: 'Home charging suitable for overnight top-ups.',
	},
	{
		icon: Building2,
		title: 'Level 2',
		power: '7-22 kW',
		description: 'Commercial and public parking destinations.',
	},
	{
		icon: Route,
		title: 'DC Fast Charging',
		power: '50-150 kW',
		description: 'Highway corridor charging for intercity travel.',
	},
	{
		icon: BatteryCharging,
		title: 'Tesla Supercharger',
		power: '250 kW+',
		description: 'Ultra-fast sessions for Tesla-compatible vehicles.',
	},
]

const features = [
	{
		icon: Zap,
		title: 'Live charger telemetry',
		text: 'Status updates stream instantly across every station node.',
	},
	{
		icon: Route,
		title: 'Route-aware discovery',
		text: 'Find practical stop points along your driving path.',
	},
	{
		icon: ShieldCheck,
		title: 'Verified data quality',
		text: 'Station details are moderated and quality scored.',
	},
	{
		icon: Wifi,
		title: 'Connected infrastructure',
		text: 'Backed by a resilient realtime socket architecture.',
	},
	{
		icon: Clock3,
		title: 'Operational intelligence',
		text: 'Open hours and wait-time signals reduce uncertainty.',
	},
	{
		icon: Sparkles,
		title: 'Driver-first design',
		text: 'Fast search, clear visuals, and focused interactions.',
	},
]

const riseInView = {
	hidden: { opacity: 0, y: 24 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.55, ease: [0.2, 0.9, 0.2, 1] },
	},
}

function CountUp({ value, suffix = '', duration = 1100 }) {
	const [display, setDisplay] = useState(0)

	useEffect(() => {
		let animationFrame = null
		const startTime = performance.now()

		const tick = (now) => {
			const elapsed = now - startTime
			const progress = Math.min(elapsed / duration, 1)
			const eased = 1 - (1 - progress) ** 3

			setDisplay(Math.round(value * eased))

			if (progress < 1) {
				animationFrame = window.requestAnimationFrame(tick)
			}
		}

		animationFrame = window.requestAnimationFrame(tick)

		return () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame)
			}
		}
	}, [duration, value])

	return (
		<span className="mono-data" style={{ fontWeight: 600 }}>
			{display}
			{suffix}
		</span>
	)
}

function MiniMapPreview() {
	const mapContainerRef = useRef(null)
	const mapRef = useRef(null)
	const markerRefs = useRef([])
	const mapboxToken = getMapboxToken()

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current || !mapboxToken) {
			return undefined
		}

		mapboxgl.accessToken = mapboxToken

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/dark-v11',
			center: [78.9629, 20.5937],
			zoom: 3.95,
			dragPan: false,
			boxZoom: false,
			scrollZoom: false,
			doubleClickZoom: false,
			touchZoomRotate: false,
			interactive: false,
			attributionControl: false,
		})

		mapRef.current = map

		map.on('load', () => {
			markerRefs.current = sampleStationMarkers.map((station, index) => {
				const markerNode = document.createElement('div')
				markerNode.className = 'pulse-marker'

				if (index % 3 === 0) {
					markerNode.style.background = 'var(--accent-green)'
				} else if (index % 3 === 1) {
					markerNode.style.background = 'var(--accent-primary)'
				} else {
					markerNode.style.background = 'var(--accent-secondary)'
				}

				const marker = new mapboxgl.Marker({ element: markerNode, anchor: 'center' })
					.setLngLat(station.coordinates)
					.addTo(map)

				return marker
			})
		})

		return () => {
			markerRefs.current.forEach((marker) => marker.remove())
			markerRefs.current = []
			map.remove()
			mapRef.current = null
		}
	}, [mapboxToken])

	if (!mapboxToken) {
		return (
			<div
				className="glass-card"
				style={{
					minHeight: 320,
					display: 'grid',
					placeItems: 'center',
					color: 'var(--text-secondary)',
					padding: '1rem',
					textAlign: 'center',
				}}
			>
				Add a valid VITE_MAPBOX_TOKEN to enable map preview.
			</div>
		)
	}

	return (
		<div
			ref={mapContainerRef}
			className="map-vignette glass-card"
			style={{ width: '100%', minHeight: 360, borderRadius: 'var(--radius-md)' }}
		/>
	)
}

function EVVisual() {
	return (
		<div
			className="glass-card floating"
			style={{
				borderRadius: 'var(--radius-lg)',
				padding: '1.4rem',
				minHeight: 280,
				display: 'grid',
				placeItems: 'center',
			}}
		>
			<svg width="100%" viewBox="0 0 560 320" fill="none" aria-label="Electric vehicle illustration">
				<defs>
					<linearGradient id="ev-gradient" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#00d4ff" stopOpacity="0.95" />
						<stop offset="100%" stopColor="#7b2fff" stopOpacity="0.95" />
					</linearGradient>
				</defs>
				<rect x="28" y="220" width="500" height="10" rx="5" fill="rgba(0, 212, 255, 0.24)" />
				<path
					d="M120 204h310c15 0 28-11 30-26l10-71c2-16-10-31-27-31H213c-12 0-23 6-29 15l-76 113h12z"
					fill="url(#ev-gradient)"
					opacity="0.9"
				/>
				<path d="M192 94h195c8 0 14 7 13 15l-5 38H163l21-38c2-4 5-6 8-6z" fill="#06182d" />
				<circle cx="193" cy="214" r="38" fill="#041423" stroke="#00d4ff" strokeWidth="8" />
				<circle cx="412" cy="214" r="38" fill="#041423" stroke="#7b2fff" strokeWidth="8" />
				<circle cx="193" cy="214" r="11" fill="#00d4ff" opacity="0.55" />
				<circle cx="412" cy="214" r="11" fill="#7b2fff" opacity="0.55" />
				<path d="M440 55h48v48h-18V73h-30z" stroke="#00d4ff" strokeWidth="6" strokeLinecap="round" />
				<path d="M452 101v25" stroke="#00d4ff" strokeWidth="6" strokeLinecap="round" />
				<path d="M473 101v25" stroke="#00d4ff" strokeWidth="6" strokeLinecap="round" />
			</svg>
		</div>
	)
}

function Home() {
	const [networkStats, setNetworkStats] = useState({
		activeStations: 0,
		availableChargers: 0,
		avgWaitTime: 0,
	})
	const [statsLoading, setStatsLoading] = useState(true)
	const [statsError, setStatsError] = useState('')

	const { location, requestLocation, isLoading: locating, error: locationError } = useGeolocation()
	const routeLocation = useLocation()

	useEffect(() => {
		if (!routeLocation.hash) {
			return
		}

		const targetId = routeLocation.hash.replace('#', '')
		const targetElement = document.getElementById(targetId)

		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}, [routeLocation.hash])

	useEffect(() => {
		let mounted = true

		const fetchStats = async () => {
			setStatsLoading(true)
			setStatsError('')

			try {
				const response = await api.get('/stations', {
					params: {
						page: 1,
						limit: 60,
						sortBy: 'rating',
					},
				})

				const stations = response?.data?.data?.stations || []
				const activeStations = stations.filter((station) => (station.availableChargers || 0) > 0).length
				const availableChargers = stations.reduce(
					(total, station) => total + (station.availableChargers || 0),
					0,
				)

				const waitEstimates = stations.map((station) => {
					const total = Math.max(1, Number(station.totalChargers) || 1)
					const occupied = Math.max(0, total - (Number(station.availableChargers) || 0))
					return Math.round(4 + (occupied / total) * 20)
				})

				const avgWaitTime = waitEstimates.length
					? Math.round(waitEstimates.reduce((sum, item) => sum + item, 0) / waitEstimates.length)
					: 0

				if (mounted) {
					setNetworkStats({
						activeStations,
						availableChargers,
						avgWaitTime,
					})
				}
			} catch {
				if (mounted) {
					setNetworkStats({ activeStations: 640, availableChargers: 2780, avgWaitTime: 11 })
					setStatsError('Live station metrics are temporarily unavailable. Showing baseline values.')
				}
			} finally {
				if (mounted) {
					setStatsLoading(false)
				}
			}
		}

		fetchStats()

		return () => {
			mounted = false
		}
	}, [])

	const locationLabel = useMemo(() => {
		if (!location) {
			return 'Location unavailable'
		}

		return `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
	}, [location])

	return (
		<PageWrapper title="Home" className="hero-gradient">
			<Navbar />

			<section
				style={{
					position: 'relative',
					minHeight: '100vh',
					display: 'grid',
					alignItems: 'center',
					overflow: 'hidden',
					paddingTop: '4.5rem',
				}}
			>
				<Particles />
				<div className="scanline-overlay" aria-hidden="true" />

				<div className="container-shell" style={{ position: 'relative', zIndex: 2 }}>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55 }}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.45rem',
							border: '1px solid var(--border)',
							borderRadius: '999px',
							padding: '0.4rem 0.82rem',
							marginBottom: '1.35rem',
							background: 'rgba(10, 22, 40, 0.65)',
							color: 'var(--text-secondary)',
						}}
					>
						<Zap size={15} color="var(--accent-primary)" />
						India&apos;s Smartest EV Network
					</motion.div>

					<SplitText
						text="Find Your Charge"
						delay={0.2}
						className="glow-text"
						as="h1"
					/>

					<p
						style={{
							marginTop: '1.1rem',
							maxWidth: 650,
							color: 'var(--text-secondary)',
							fontSize: 'clamp(1rem, 2.2vw, 1.22rem)',
						}}
					>
						Discover 1000+ charging stations near you. Real-time availability. Zero range anxiety.
					</p>

					<div
						style={{
							marginTop: '1.9rem',
							display: 'flex',
							flexWrap: 'wrap',
							gap: '0.72rem',
						}}
					>
						<Link to="/map" style={{ textDecoration: 'none' }}>
							<Button size="lg" rightIcon={<ArrowRight size={17} />}>
								Explore Map
							</Button>
						</Link>
						<a href="#how-it-works" style={{ textDecoration: 'none' }}>
							<Button variant="ghost" size="lg" rightIcon={<ArrowRight size={17} />}>
								How It Works
							</Button>
						</a>
					</div>

					<div
						style={{
							marginTop: '1.5rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
							flexWrap: 'wrap',
						}}
					>
						<button
							type="button"
							onClick={requestLocation}
							className="chip focus-ring"
							style={{
								border: '1px solid var(--border)',
								background: 'rgba(10, 22, 40, 0.65)',
								color: 'var(--text-secondary)',
							}}
						>
							<LocateFixed size={14} />
							{locating ? 'Detecting location...' : 'Use my location'}
						</button>
						<span className="chip mono-data">{locationLabel}</span>
						{locationError ? <span className="chip status-offline">{locationError}</span> : null}
					</div>

					<div
						style={{
							marginTop: '2.4rem',
							display: 'flex',
							flexWrap: 'wrap',
							gap: '1.25rem',
							color: 'var(--text-secondary)',
						}}
					>
						{heroStats.map((item) => (
							<div
								key={item.label}
								style={{
									borderLeft: '2px solid rgba(0, 212, 255, 0.34)',
									paddingLeft: '0.72rem',
								}}
							>
								<div style={{ fontSize: '1.26rem', color: 'var(--text-primary)' }}>
									<CountUp value={item.value} suffix={item.suffix} />
								</div>
								<span style={{ fontSize: '0.9rem' }}>{item.label}</span>
							</div>
						))}
					</div>
				</div>

				<motion.a
					href="#live-map"
					aria-label="Scroll to map preview"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.2 }}
					style={{
						position: 'absolute',
						left: '50%',
						bottom: '1.4rem',
						transform: 'translateX(-50%)',
						color: 'var(--text-secondary)',
					}}
				>
					<ChevronDown style={{ animation: 'soft-bounce 1.5s ease infinite' }} />
				</motion.a>
			</section>

			<section id="live-map" className="section-spacing">
				<div className="container-shell" style={{ display: 'grid', gap: '1.6rem' }}>
					<motion.h2 className="section-title" initial="hidden" whileInView="show" viewport={{ once: true }} variants={riseInView}>
						<GradientText>Stations Near You</GradientText>
					</motion.h2>

					<div
						className="home-map-grid"
						style={{
							display: 'grid',
							gap: '1rem',
							gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 0.9fr)',
						}}
					>
						<MiniMapPreview />

						<div style={{ display: 'grid', gap: '0.8rem', alignContent: 'start' }}>
							{statsLoading ? (
								Array.from({ length: 3 }).map((_, index) => (
									<div key={`loading-${index}`} className="glass-card skeleton" style={{ height: 96 }} />
								))
							) : (
								<>
									<Card className="glass-card" hover={false}>
										<div style={{ padding: '1rem' }}>
											<p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Active Stations</p>
											<p style={{ fontSize: '1.6rem' }} className="mono-data glow-text">
												<CountUp value={networkStats.activeStations} suffix="+" />
											</p>
										</div>
									</Card>
									<Card className="glass-card" hover={false}>
										<div style={{ padding: '1rem' }}>
											<p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
												Available Chargers
											</p>
											<p style={{ fontSize: '1.6rem' }} className="mono-data glow-text">
												<CountUp value={networkStats.availableChargers} />
											</p>
										</div>
									</Card>
									<Card className="glass-card" hover={false}>
										<div style={{ padding: '1rem' }}>
											<p style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Avg Wait Time</p>
											<p style={{ fontSize: '1.6rem' }} className="mono-data glow-text">
												<CountUp value={networkStats.avgWaitTime} suffix=" min" />
											</p>
										</div>
									</Card>
									{statsError ? (
										<p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{statsError}</p>
									) : null}
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			<section id="how-it-works" className="section-spacing">
				<div className="container-shell">
					<motion.h2 className="section-title" initial="hidden" whileInView="show" viewport={{ once: true }} variants={riseInView}>
						Three Steps to Full Battery
					</motion.h2>

					<motion.div
						initial="hidden"
						whileInView="show"
						viewport={{ once: true }}
						variants={{
							hidden: {},
							show: {
								transition: {
									staggerChildren: 0.12,
								},
							},
						}}
						style={{
							marginTop: '1.2rem',
							display: 'grid',
							gap: '1rem',
							gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
						}}
					>
						{stepCards.map((step) => {
							const StepIcon = step.icon

							return (
								<motion.div key={step.title} variants={riseInView}>
									<TiltedCard>
										<Card className="glass-card neon-border" style={{ width: '100%' }}>
											<div style={{ padding: '1.1rem' }}>
												<span className="icon-badge" aria-hidden="true">
													<StepIcon size={17} />
												</span>
												<h3 style={{ marginTop: '0.8rem', fontSize: '1.15rem' }}>{step.title}</h3>
												<p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
													{step.description}
												</p>
											</div>
										</Card>
									</TiltedCard>
								</motion.div>
							)
						})}
					</motion.div>
				</div>
			</section>

			<section className="section-spacing grid-bg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
				<div className="container-shell">
					<motion.h2 className="section-title" initial="hidden" whileInView="show" viewport={{ once: true }} variants={riseInView}>
						All Charger Types Supported
					</motion.h2>

					<div
						style={{
							marginTop: '1.2rem',
							display: 'grid',
							gap: '1rem',
							gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
						}}
					>
						{chargerSupport.map((item) => {
							const ChargerIcon = item.icon

							return (
								<StarBorder key={item.title}>
									<div style={{ padding: '1.1rem', height: '100%' }}>
										<span className="icon-badge" aria-hidden="true">
											<ChargerIcon size={17} />
										</span>
										<h3 style={{ marginTop: '0.75rem', fontSize: '1.1rem' }}>{item.title}</h3>
										<p className="mono-data" style={{ marginTop: '0.4rem', color: 'var(--accent-primary)' }}>
											{item.power}
										</p>
										<p style={{ marginTop: '0.52rem', color: 'var(--text-secondary)' }}>{item.description}</p>
									</div>
								</StarBorder>
							)
						})}
					</div>
				</div>
			</section>

			<section className="section-spacing">
				<div
					className="container-shell home-why-grid"
					style={{
						display: 'grid',
						gap: '1.2rem',
						gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
						alignItems: 'center',
					}}
				>
					<div>
						<h2 className="section-title">Why ElectroMap</h2>
						<p className="section-copy" style={{ marginBottom: '1.05rem' }}>
							Built for fast-moving EV drivers who need clear, trustworthy station intelligence.
						</p>

						<div style={{ display: 'grid', gap: '0.68rem' }}>
							{features.map((feature) => {
								const FeatureIcon = feature.icon

								return (
									<div
										key={feature.title}
										className="glass-card"
										style={{
											borderRadius: '12px',
											padding: '0.8rem',
											display: 'flex',
											gap: '0.66rem',
											alignItems: 'flex-start',
										}}
									>
										<span className="icon-badge" aria-hidden="true">
											<FeatureIcon size={15} />
										</span>
										<div>
											<h3 style={{ fontSize: '1rem' }}>{feature.title}</h3>
											<p style={{ color: 'var(--text-secondary)', marginTop: '0.26rem' }}>{feature.text}</p>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					<EVVisual />
				</div>
			</section>

			<section className="section-spacing" style={{ paddingTop: 0 }}>
				<div className="container-shell">
					<div
						className="glass-card"
						style={{
							position: 'relative',
							overflow: 'hidden',
							borderRadius: 'var(--radius-lg)',
							padding: 'clamp(1.4rem, 4vw, 2.5rem)',
							background:
								'linear-gradient(120deg, rgba(0, 212, 255, 0.25), rgba(14, 63, 107, 0.56), rgba(123, 47, 255, 0.32))',
						}}
					>
						<div className="noise-overlay" aria-hidden="true" />

						<div
							style={{
								position: 'relative',
								zIndex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: '1rem',
								flexWrap: 'wrap',
							}}
						>
							<div>
								<h2 className="section-title" style={{ margin: 0 }}>
									Ready to go electric?
								</h2>
								<p style={{ marginTop: '0.45rem', color: 'var(--text-secondary)' }}>
									Open the map and locate a charger in seconds.
								</p>
							</div>

							<Link to="/map" style={{ textDecoration: 'none' }}>
								<Button size="lg" rightIcon={<ArrowRight size={18} />}>
									Open Map
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			<Footer />

			<style>
				{`
					main h1 {
						font-size: clamp(2.5rem, 9vw, 6rem);
						line-height: 0.95;
						letter-spacing: -0.03em;
						max-width: 11ch;
					}

					@media (max-width: 960px) {
						.home-map-grid,
						.home-why-grid {
							grid-template-columns: 1fr !important;
						}
					}
				`}
			</style>
		</PageWrapper>
	)
}

export default Home
