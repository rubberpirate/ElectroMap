import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Navbar, PageWrapper } from '../components/layout'
import { LandscapeScene } from '../components/scene'
import { Button } from '../components/ui'

function NotFound() {
  return (
    <PageWrapper title="Page Not Found" className="hero-gradient">
      <Navbar />

      <section
        className="not-found-page sky-dot-grid"
        style={{
          position: 'relative',
          minHeight: '100svh',
          paddingTop: '5rem',
          paddingBottom: '2rem',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 'min(640px, 100%)',
            padding: '1.2rem',
            display: 'grid',
            gap: '0.8rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <motion.p
            className="mono-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: 'var(--cyan)' }}
          >
            404
          </motion.p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>
            Station not found
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            The route went quiet. Head back to the map and pick up a live charging signal.
          </p>

          <Link to="/map" className="focus-ring" style={{ textDecoration: 'none', justifySelf: 'center' }}>
            <Button leftIcon={<Home size={14} />}>Back to Map</Button>
          </Link>
        </div>
        <LandscapeScene />
      </section>
    </PageWrapper>
  )
}

export default NotFound
