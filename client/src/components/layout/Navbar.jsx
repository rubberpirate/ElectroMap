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
  { label: 'Home', to: '/', mode: 'route' },
  { label: 'Map', to: '/map', mode: 'route' },
  { label: 'How It Works', to: '/#how-it-works', mode: 'hash' },
]

const navShellStyle = (isScrolled) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  transition: 'all 240ms var(--easing-smooth)',
  borderBottom: isScrolled ? '1px solid var(--border)' : '1px solid transparent',
  backdropFilter: isScrolled ? 'blur(14px)' : 'blur(0px)',
  WebkitBackdropFilter: isScrolled ? 'blur(14px)' : 'blur(0px)',
  background: isScrolled ? 'rgba(5, 10, 14, 0.65)' : 'rgba(5, 10, 14, 0)',
})

const iconButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'rgba(10, 22, 40, 0.65)',
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
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          border: '1px solid rgba(0, 212, 255, 0.45)',
          background: 'linear-gradient(130deg, rgba(0, 212, 255, 0.35), rgba(123, 47, 255, 0.25))',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M13.5 2L5 13h5l-1 9 9-12h-5l.5-8z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1.08rem',
          letterSpacing: '0.02em',
        }}
      >
        ElectroMap
      </span>
    </Link>
  )
}

function DesktopNav() {
  const location = useLocation()

  return (
    <nav aria-label="Primary" style={{ display: 'flex', gap: '1.2rem' }}>
      {navItems.map((item, index) => {
        const isHashItem = item.mode === 'hash'
        const isHashActive =
          isHashItem && location.pathname === '/' && location.hash === '#how-it-works'

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
                color: isHashActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                paddingBottom: '0.32rem',
                borderBottom: isHashActive
                  ? '2px solid var(--accent-primary)'
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
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                paddingBottom: '0.32rem',
                borderBottom: isActive
                  ? '2px solid var(--accent-primary)'
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
  const { isAuthenticated, user, logout } = useAuthStore()
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
          <Button size={compact ? 'sm' : 'md'}>Register</Button>
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
                color: 'var(--accent-red)',
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
              background: 'rgba(3, 8, 14, 0.58)',
              zIndex: 48,
            }}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
            className="glass-card"
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 'min(88vw, 330px)',
              zIndex: 49,
              padding: '1rem',
              borderRadius: 0,
              borderLeft: '1px solid var(--border)',
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
                  border: '1px solid var(--border)',
                  background: 'rgba(10, 22, 40, 0.68)',
                  color: 'var(--text-secondary)',
                }}
                aria-label="Close menu"
              >
                <X size={18} style={{ margin: '0 auto' }} />
              </button>
            </div>

            <nav aria-label="Mobile" style={{ display: 'grid', gap: '0.7rem' }}>
              {navItems.map((item) => {
                if (item.mode === 'hash') {
                  const isActive = location.pathname === '/' && location.hash === '#how-it-works'
                  return (
                    <a
                      key={item.label}
                      href={item.to}
                      className="focus-ring"
                      onClick={onClose}
                      style={{
                        textDecoration: 'none',
                        padding: '0.62rem 0.72rem',
                        borderRadius: '10px',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(0, 212, 255, 0.13)' : 'transparent',
                      }}
                    >
                      {item.label}
                    </a>
                  )
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className="focus-ring"
                    onClick={onClose}
                    style={({ isActive }) => ({
                      textDecoration: 'none',
                      padding: '0.62rem 0.72rem',
                      borderRadius: '10px',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(0, 212, 255, 0.13)' : 'transparent',
                    })}
                  >
                    {item.label}
                  </NavLink>
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
              border: '1px solid var(--border)',
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
