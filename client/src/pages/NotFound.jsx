import { motion } from 'framer-motion'
import { Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Navbar, PageWrapper } from '../components/layout'
import { Button } from '../components/ui'

function NotFound() {
  return (
    <PageWrapper title="Page Not Found" className="hero-gradient">
      <Navbar />

      <section
        className="container-shell"
        style={{
          minHeight: '100vh',
          paddingTop: '5rem',
          paddingBottom: '2rem',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          className="glass-card"
          style={{
            width: 'min(640px, 100%)',
            borderRadius: '16px',
            padding: '1.2rem',
            display: 'grid',
            gap: '0.8rem',
            textAlign: 'center',
          }}
        >
          <motion.div
            initial={{ rotate: -8, scale: 0.94, opacity: 0.7 }}
            animate={{ rotate: 8, scale: 1.04, opacity: 1 }}
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 1.6,
              ease: 'easeInOut',
            }}
            style={{ justifySelf: 'center' }}
          >
            <Compass size={64} color="var(--accent-primary)" />
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>
            404
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            The page you requested could not be found. Let’s get you back to charging
            routes.
          </p>

          <Link to="/" className="focus-ring" style={{ textDecoration: 'none', justifySelf: 'center' }}>
            <Button leftIcon={<Home size={14} />}>Go Home</Button>
          </Link>
        </div>
      </section>
    </PageWrapper>
  )
}

export default NotFound
