import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Bookmark,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'
import { Avatar, Button } from '../ui'

const navItems = [
  { label: 'About', to: '/#about', mode: 'hash' },
  { label: 'Map', to: '/map', mode: 'route' },
  { label: 'Stations', to: '/#featured-stations', mode: 'hash' },
  { label: 'Pricing', to: '/#pricing', mode: 'hash' },
]

const navShellStyle = (isScrolled) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  transition: 'all 0.2s ease',
  borderBottom: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  background: isScrolled ? 'rgba(11, 18, 32, 0.78)' : 'rgba(11, 18, 32, 0.36)',
})

const iconButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  background: 'rgba(22, 40, 64, 0.7)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
}

function Logo() {
  return (
    <Link
      to="/"
      className="focus-ring"
      aria-label="Go to ElectroMap homepage"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.04rem',
          letterSpacing: 0,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: 'var(--cyan)' }}>E</span>LECTROMAP
      </span>
    </Link>
  )
}

function DesktopNav() {
  const location = useLocation()

  return (
    <nav aria-label="Primary" style={{ display: 'flex', gap: '1.6rem' }}>
      {navItems.map((item, index) => {
        const isHashItem = item.mode === 'hash'
        const isHashActive = isHashItem && location.pathname === '/' && location.hash === item.to.slice(1)

        if (isHashItem) {
          return (
            <motion.a
              key={item.label}
              href={item.to}
              className="focus-ring"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.06 }}
              style={{
                textDecoration: 'none',
                color: isHashActive ? 'var(--cyan)' : 'var(--text-secondary)',
                paddingBottom: '0.32rem',
                borderBottom: isHashActive
                  ? '2px solid var(--cyan)'
                  : '2px solid transparent',
                transition: 'all 180ms ease',
              }}
            >
              {item.label}
            </motion.a>
          )
        }

        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.06 }}
          >
            <NavLink
              to={item.to}
              className="focus-ring"
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                paddingBottom: '0.32rem',
                borderBottom: isActive
                  ? '2px solid var(--cyan)'
                  : '2px solid transparent',
                transition: 'all 180ms ease',
              })}
            >
              {item.label}
            </NavLink>
          </motion.div>
        )
      })}
    </nav>
  )
}

function AuthActions({ compact = false, onNavigate }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [menuOpen, setMenuOpen] = useState(false)

  const initialsSource = useMemo(
    () => user?.username || user?.email || 'ElectroMap User',
    [user?.email, user?.username],
  )

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    navigate('/')
    onNavigate?.()
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Link to="/login" className="focus-ring" style={{ textDecoration: 'none' }} onClick={onNavigate}>
          <Button variant="ghost" size={compact ? 'sm' : 'md'}>
            Login
          </Button>
        </Link>
        <Link
          to="/register"
          className="focus-ring"
          style={{ textDecoration: 'none' }}
          onClick={onNavigate}
        >
          <Button size={compact ? 'sm' : 'md'}>Get Started</Button>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
      <button type="button" className="focus-ring" aria-label="Saved stations" style={iconButtonStyle}>
        <Bookmark size={17} />
      </button>
      <button type="button" className="focus-ring" aria-label="Notifications" style={iconButtonStyle}>
        <Bell size={17} />
      </button>

      <button
        type="button"
        className="focus-ring"
        aria-label="Open user menu"
        onClick={() => setMenuOpen((current) => !current)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          display: 'inline-flex',
        }}
      >
        <Avatar
          size={compact ? 'sm' : 'md'}
          name={initialsSource}
          src={user?.avatar}
          online
        />
      </button>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card"
            style={{
              position: 'absolute',
              right: 0,
              top: compact ? '2.4rem' : '2.8rem',
              minWidth: 190,
              padding: '0.45rem',
              borderRadius: '12px',
            }}
          >
            <button
              type="button"
              className="focus-ring"
              onClick={() => {
                navigate('/dashboard')
                setMenuOpen(false)
                onNavigate?.()
              }}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem',
                borderRadius: '10px',
              }}
            >
              <UserRound size={16} />
              Dashboard
            </button>
            <button
              type="button"
              className="focus-ring"
              onClick={handleLogout}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: 'var(--red-alert)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem',
                borderRadius: '10px',
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function MobileDrawer({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(3, 8, 14, 0.72)',
              backdropFilter: 'blur(16px)',
              zIndex: 48,
            }}
          />
          <motion.aside
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
            className="glass-card"
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: '100%',
              zIndex: 49,
              padding: '1.1rem',
              borderRadius: 0,
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.4rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Logo />
              <button
                type="button"
                className="focus-ring"
                onClick={onClose}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(10, 22, 40, 0.68)',
                  color: 'var(--text-secondary)',
                }}
                aria-label="Close menu"
              >
                <X size={18} style={{ margin: '0 auto' }} />
              </button>
            </div>

            <nav aria-label="Mobile" style={{ display: 'grid', gap: '0.7rem', marginTop: '8vh' }}>
              {navItems.map((item, index) => {
                if (item.mode === 'hash') {
                  const isActive = location.pathname === '/' && location.hash === item.to.slice(1)
                  return (
                    <motion.a
                      key={item.label}
                      href={item.to}
                      className="focus-ring"
                      onClick={onClose}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        textDecoration: 'none',
                        padding: '0.66rem 0',
                        color: isActive ? 'var(--cyan)' : 'var(--text-primary)',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 'clamp(2rem, 12vw, 4rem)',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </motion.a>
                  )
                }

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={item.to}
                      className="focus-ring"
                      onClick={onClose}
                      style={({ isActive }) => ({
                        textDecoration: 'none',
                        padding: '0.66rem 0',
                        color: isActive ? 'var(--cyan)' : 'var(--text-primary)',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 'clamp(2rem, 12vw, 4rem)',
                        fontWeight: 800,
                        lineHeight: 1,
                        display: 'block',
                      })}
                    >
                      {item.label}
                    </NavLink>
                  </motion.div>
                )
              })}
            </nav>

            <div style={{ marginTop: 'auto' }}>
              <AuthActions compact onNavigate={onClose} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)

    onScroll()
    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        style={navShellStyle(isScrolled)}
        initial={{ y: -68, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
      >
        <div
          className="container-shell"
          style={{
            minHeight: 74,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <Logo />

          <div className={cn('desktop-nav')} style={{ display: 'none' }}>
            <DesktopNav />
          </div>

          <div className={cn('desktop-auth')} style={{ display: 'none' }}>
            <AuthActions />
          </div>

          <button
            type="button"
            aria-label="Open menu"
            className="focus-ring"
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '11px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(10, 22, 40, 0.7)',
              color: 'var(--text-primary)',
            }}
          >
            <Menu size={18} style={{ margin: '0 auto' }} />
          </button>
        </div>
      </motion.header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <style>
        {`
          @media (min-width: 920px) {
            .desktop-nav,
            .desktop-auth {
              display: block !important;
            }

            header button[aria-label='Open menu'] {
              display: none;
            }
          }
        `}
      </style>
    </>
  )
}

export default Navbar
