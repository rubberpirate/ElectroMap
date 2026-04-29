import { motion } from 'framer-motion'
import {
  ArrowRight,
  BatteryCharging,
  Compass,
  LocateFixed,
  MapPinned,
  Navigation,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Footer, Navbar, PageWrapper } from '../components/layout'
import StationCard from '../components/station/StationCard'
import { Button } from '../components/ui'
import { BackgroundBeams } from '../components/ui/background-beams'
import { getMockStations } from '../data/mockStations'
import useGeolocation from '../hooks/useGeolocation'
import api from '../services/api'

const heroStats = [
  { value: '1,200+', label: 'Stations' },
  { value: '48', label: 'Cities' },
  { value: 'Live', label: 'Availability' },
]

const steps = [
  {
    icon: LocateFixed,
    title: 'Share your area',
    description: 'Detect your location or search a city to start with the right map view.',
  },
  {
    icon: MapPinned,
    title: 'Compare stations',
    description: 'Scan availability, speed, ratings, and amenities without opening tabs.',
  },
  {
    icon: Navigation,
    title: 'Navigate cleanly',
    description: 'Open directions, save reliable stops, and arrive with charger context.',
  },
]

const stationMarkers = [
  { x: '18%', y: '57%', tone: 'available', label: '4' },
  { x: '34%', y: '40%', tone: 'occupied', label: '2' },
  { x: '52%', y: '64%', tone: 'available', label: '7' },
  { x: '68%', y: '44%', tone: 'offline', label: '1' },
  { x: '81%', y: '58%', tone: 'available', label: '5' },
]

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.9, 0.2, 1] } },
}

function MiniMapPreview() {
  return (
    <div className="home-static-map glass-card">
      <div className="home-map-lines" aria-hidden="true" />
      {stationMarkers.map((marker) => (
        <span
          key={`${marker.x}-${marker.y}`}
          className={`home-map-pin ${marker.tone}`}
          style={{ left: marker.x, top: marker.y }}
        >
          {marker.label}
        </span>
      ))}
      <Link to="/map" className="home-map-cta focus-ring">
        Explore the full map
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function Home() {
  const [featuredStations, setFeaturedStations] = useState(() => getMockStations().slice(0, 6))
  const [networkStats, setNetworkStats] = useState(heroStats)
  const { location, requestLocation, isLoading: locating, error: locationError } = useGeolocation()
  const routeLocation = useLocation()

  useEffect(() => {
    if (!routeLocation.hash) {
      return
    }

    const target = document.getElementById(routeLocation.hash.replace('#', ''))
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [routeLocation.hash])

  useEffect(() => {
    let mounted = true

    const loadStations = async () => {
      try {
        const { data } = await api.get('/stations', {
          params: { page: 1, limit: 8, sortBy: 'rating' },
        })

        const stations = data?.data?.stations || []
        if (!mounted || !stations.length) {
          return
        }

        const available = stations.reduce(
          (total, station) => total + (Number(station?.availableChargers) || 0),
          0,
        )
        const cities = new Set(stations.map((station) => station?.city).filter(Boolean))

        setFeaturedStations(stations.slice(0, 6))
        setNetworkStats([
          { value: `${Math.max(stations.length, 1200).toLocaleString('en-IN')}+`, label: 'Stations' },
          { value: `${Math.max(cities.size, 48)}`, label: 'Cities' },
          { value: available ? `${available}` : 'Live', label: 'Available now' },
        ])
      } catch {
        if (mounted) {
          setFeaturedStations(getMockStations().slice(0, 6))
        }
      }
    }

    void loadStations()

    return () => {
      mounted = false
    }
  }, [])

  const locationLabel = useMemo(() => {
    if (!location) {
      return 'Searching near you'
    }

    return `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
  }, [location])

  return (
    <PageWrapper title="Home" className="hero-gradient">
      <Navbar />

      <section className="home-hero sky-dot-grid">
        <BackgroundBeams className="home-comet-beams" />
        <div className="home-sky-orbits" aria-hidden="true">
          <span style={{ '--x': '13%', '--y': '21%', '--d': '0s' }} />
          <span style={{ '--x': '25%', '--y': '34%', '--d': '1.1s' }} />
          <span style={{ '--x': '76%', '--y': '22%', '--d': '2.1s' }} />
          <span style={{ '--x': '88%', '--y': '38%', '--d': '0.7s' }} />
        </div>

        <div className="home-hero-content">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
          >
            <motion.p className="home-kicker" variants={rise}>
              <Sparkles size={15} />
              Live EV charging for night drives
            </motion.p>
            <motion.h1 variants={rise}>
              <span>Charge anywhere,</span>
              <span>find it instantly.</span>
            </motion.h1>
            <motion.p className="home-hero-copy" variants={rise}>
              Discover nearby EV charging stations, check live availability, and navigate all in one map.
            </motion.p>
            <motion.div className="home-hero-actions" variants={rise}>
              <Link to="/map" style={{ textDecoration: 'none' }}>
                <Button size="lg" rightIcon={<ArrowRight size={17} />}>
                  Explore Map
                </Button>
              </Link>
              <a href="#how-it-works" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="lg">
                  How it works
                </Button>
              </a>
            </motion.div>
            <motion.div className="home-location-row" variants={rise}>
              <button type="button" className="chip focus-ring" onClick={requestLocation}>
                <LocateFixed size={14} />
                {locating ? 'Detecting location' : 'Use my location'}
              </button>
              <span className="chip mono-data">
                <span className="pulse-dot" />
                {locationLabel}
              </span>
              {locationError ? <span className="chip status-offline">{locationError}</span> : null}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="home-stats-band">
        <div className="container-shell home-stats-grid">
          {networkStats.map((item) => (
            <div key={item.label}>
              <strong className="mono-data">{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section-spacing home-section">
        <div className="container-shell">
          <div className="section-heading-row">
            <div>
              <p className="home-kicker">How it works</p>
              <h2 className="section-title">Three moves from range anxiety to route clarity.</h2>
            </div>
          </div>

          <motion.div
            className="home-steps"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.article key={step.title} variants={rise}>
                  <span className="home-step-number mono-data">{String(index + 1).padStart(2, '0')}</span>
                  <span className="icon-badge">
                    <Icon size={18} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section id="featured-stations" className="section-spacing home-section home-featured">
        <div className="container-shell">
          <div className="section-heading-row">
            <div>
              <p className="home-kicker">Featured stations</p>
              <h2 className="section-title">Reliable stops with live charger signals.</h2>
            </div>
            <Link to="/map" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" rightIcon={<ArrowRight size={15} />}>
                View all
              </Button>
            </Link>
          </div>

          <div className="home-station-strip">
            {featuredStations.map((station, index) => (
              <motion.div
                key={station?._id || index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
              >
                <StationCard station={station} variant="full" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section-spacing home-section">
        <div className="container-shell home-map-section">
          <div>
            <p className="home-kicker">Map preview</p>
            <h2 className="section-title">Dark map, glowing context, less guessing.</h2>
            <p className="section-copy">
              ElectroMap keeps live status, station metadata, ratings, and directions close to the map canvas,
              so drivers can decide in seconds.
            </p>
            <div className="home-proof-list">
              <span>
                <Zap size={16} />
                Cyan pins for available chargers
              </span>
              <span>
                <ShieldCheck size={16} />
                Verified station details
              </span>
              <span>
                <Compass size={16} />
                Route-aware discovery
              </span>
            </div>
          </div>
          <MiniMapPreview />
        </div>
      </section>

      <section id="pricing" className="section-spacing home-section home-pricing">
        <div className="container-shell home-final-cta">
          <div>
            <p className="home-kicker">Pricing</p>
            <h2 className="section-title">Find the right charger before you pay.</h2>
            <p className="section-copy">
              Station pages surface per-kWh rates, session fees, amenities, and recent reviews before you commit.
            </p>
          </div>
          <div className="home-pricing-panel glass-card">
            <span>
              <BatteryCharging size={18} />
              DC fast rates
            </span>
            <strong className="mono-data">from INR 15/kWh</strong>
            <Link to="/map" style={{ textDecoration: 'none' }}>
              <Button rightIcon={<ArrowRight size={15} />} style={{ color: '#03131b' }}>
                Open Map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>
        {`
          .home-hero {
            position: relative;
            min-height: 100svh;
            display: grid;
            align-items: center;
            overflow: hidden;
            background-color: var(--bg-deep);
            padding: 6rem 1rem 18rem;
          }

          .home-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 52% 16%, rgba(24, 204, 252, 0.18), transparent 25rem),
              radial-gradient(circle at 78% 10%, rgba(174, 72, 255, 0.14), transparent 20rem),
              linear-gradient(180deg, rgba(11, 18, 32, 0.18), rgba(11, 18, 32, 0.76));
            pointer-events: none;
            z-index: 1;
          }

          .home-comet-beams {
            z-index: 0;
            opacity: 0.96;
            transform: scale(1.7) translateY(-6%);
            transform-origin: center;
            filter: drop-shadow(0 0 20px rgba(24, 204, 252, 0.14));
          }

          .home-hero-content {
            position: relative;
            z-index: 3;
            width: min(900px, calc(100% - 1rem));
            margin: 0 auto;
            text-align: center;
            display: grid;
            place-items: center;
          }

          .home-kicker {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            color: var(--cyan);
            font-size: 0.82rem;
            font-weight: 600;
            margin-bottom: 0.9rem;
          }

          .home-hero h1 {
            display: grid;
            gap: 0.08em;
            font-size: clamp(3.15rem, 8vw, 5.7rem);
            line-height: 0.94;
            letter-spacing: 0;
          }

          .home-hero h1 span:last-child {
            color: var(--cyan);
            text-shadow: var(--glow-cyan);
          }

          .home-hero-copy {
            max-width: 660px;
            margin: 1.2rem auto 0;
            color: var(--text-muted);
            font-size: clamp(1rem, 1.7vw, 1.16rem);
          }

          .home-hero-actions,
          .home-location-row {
            margin-top: 1.7rem;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem;
          }

          .home-location-row {
            margin-top: 1rem;
          }

          .home-sky-orbits span {
            position: absolute;
            left: var(--x);
            top: var(--y);
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--cyan);
            box-shadow: var(--glow-cyan);
            opacity: 0.75;
            animation: float 4.5s ease-in-out infinite;
            animation-delay: var(--d);
            z-index: 2;
          }

          .home-stats-band {
            border-top: 1px solid var(--border-subtle);
            border-bottom: 1px solid var(--border-subtle);
            box-shadow: var(--glow-cyan);
            background: rgba(15, 30, 48, 0.72);
          }

          .home-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }

          .home-stats-grid div {
            padding: 1.2rem;
            display: grid;
            justify-items: center;
            gap: 0.18rem;
            border-left: 1px solid var(--border-subtle);
          }

          .home-stats-grid div:last-child {
            border-right: 1px solid var(--border-subtle);
          }

          .home-stats-grid strong {
            font-size: clamp(1.35rem, 3vw, 2rem);
            color: var(--text-primary);
          }

          .home-stats-grid span {
            color: var(--text-muted);
          }

          .home-section {
            position: relative;
            background: linear-gradient(180deg, rgba(11, 18, 32, 0.94), rgba(13, 34, 51, 0.72));
          }

          .section-heading-row {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .home-steps {
            position: relative;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
          }

          .home-steps::before {
            content: '';
            position: absolute;
            left: 12%;
            right: 12%;
            top: 3.4rem;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border-subtle), transparent);
          }

          .home-steps article {
            position: relative;
            border: 1px solid var(--border-subtle);
            border-radius: 16px;
            background: rgba(15, 30, 48, 0.8);
            padding: 1rem;
            display: grid;
            gap: 0.62rem;
            transition: all 0.2s ease;
          }

          .home-steps article:hover {
            transform: translateY(-4px);
            box-shadow: var(--glow-cyan);
          }

          .home-step-number {
            color: var(--slate);
            font-size: 0.82rem;
          }

          .home-steps h3 {
            font-size: 1.06rem;
          }

          .home-steps p {
            color: var(--text-muted);
          }

          .home-featured {
            background: var(--bg-mid);
          }

          .home-station-strip {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(290px, 31%);
            gap: 1rem;
            overflow-x: auto;
            padding: 0.2rem 0.2rem 1rem;
            scroll-snap-type: x mandatory;
          }

          .home-station-strip > div {
            scroll-snap-align: start;
          }

          .home-map-section {
            display: grid;
            grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
            gap: clamp(1.3rem, 4vw, 3rem);
            align-items: center;
          }

          .home-proof-list {
            display: grid;
            gap: 0.65rem;
            margin-top: 1.2rem;
            color: var(--text-primary);
          }

          .home-proof-list span {
            display: inline-flex;
            align-items: center;
            gap: 0.55rem;
          }

          .home-proof-list svg {
            color: var(--cyan);
          }

          .home-static-map {
            position: relative;
            min-height: clamp(300px, 37vw, 464px);
            overflow: hidden;
            border-radius: 8px;
            background:
              linear-gradient(135deg, rgba(0, 232, 204, 0.08), transparent 34%),
              radial-gradient(circle at 70% 30%, rgba(253, 122, 1, 0.14), transparent 22rem),
              #07131f;
          }

          .home-map-lines {
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(36deg, transparent 47%, rgba(88, 129, 151, 0.28) 48%, rgba(88, 129, 151, 0.28) 52%, transparent 53%),
              linear-gradient(118deg, transparent 47%, rgba(0, 232, 204, 0.18) 48%, rgba(0, 232, 204, 0.18) 52%, transparent 53%),
              radial-gradient(circle at center, rgba(0, 232, 204, 0.14) 1px, transparent 1px);
            background-size: 220px 130px, 280px 160px, 34px 34px;
            opacity: 0.78;
          }

          .home-map-pin {
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            transform: translate(-50%, -50%);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            color: #04131b;
            border: 1px solid rgba(230, 242, 239, 0.6);
            animation: pulse-glow 2.4s ease-in-out infinite;
          }

          .home-map-pin.available {
            background: var(--cyan);
          }

          .home-map-pin.occupied {
            background: var(--amber);
          }

          .home-map-pin.offline {
            background: var(--slate);
            color: var(--text-primary);
          }

          .home-map-cta {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0 1rem;
            border-radius: 999px;
            background: rgba(15, 30, 48, 0.84);
            border: 1px solid var(--border-subtle);
            color: var(--text-primary);
            text-decoration: none;
            backdrop-filter: blur(14px);
          }

          .home-pricing {
            background: linear-gradient(180deg, rgba(13, 34, 51, 0.72), var(--bg-deep));
          }

          .home-final-cta {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
            gap: 1rem;
            align-items: center;
          }

          .home-pricing-panel {
            padding: 1rem;
            display: grid;
            gap: 0.8rem;
          }

          .home-pricing-panel span {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-muted);
          }

          .home-pricing-panel strong {
            font-size: 1.2rem;
          }

          @media (max-width: 900px) {
            .home-hero {
              padding-bottom: 13rem;
            }

            .home-stats-grid,
            .home-steps,
            .home-map-section,
            .home-final-cta {
              grid-template-columns: 1fr;
            }

            .home-steps::before {
              display: none;
            }

            .home-station-strip {
              grid-auto-columns: minmax(280px, 84%);
            }

            .section-heading-row {
              align-items: start;
              flex-direction: column;
            }
          }

          @media (max-width: 620px) {
            .home-hero {
              padding-top: 5.5rem;
              padding-bottom: 10rem;
              align-items: start;
            }

            .home-hero-content {
              text-align: left;
              justify-items: start;
            }

            .home-hero-actions,
            .home-location-row {
              justify-content: flex-start;
            }

            .home-stats-grid div {
              border: none;
              border-top: 1px solid var(--border-subtle);
            }
          }
        `}
      </style>
    </PageWrapper>
  )
}

export default Home
