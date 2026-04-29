import { Spinner } from '../ui'

function AppLoadingScreen() {
  return (
    <div
      className="hero-gradient"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          borderRadius: '14px',
          padding: '1rem 1.2rem',
          display: 'grid',
          gap: '0.5rem',
          placeItems: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            border: '1px solid rgba(0, 232, 204, 0.42)',
            background: 'linear-gradient(130deg, rgba(0, 232, 204, 0.28), rgba(253, 122, 1, 0.18))',
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'var(--glow-cyan)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M13.5 2L5 13h5l-1 9 9-12h-5l.5-8z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <strong style={{ fontFamily: 'Syne, sans-serif' }}>
          <span style={{ color: 'var(--cyan)' }}>E</span>LECTROMAP
        </strong>
        <Spinner />
      </div>
    </div>
  )
}

export default AppLoadingScreen
