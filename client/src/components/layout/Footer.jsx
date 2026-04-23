import { Code2, Globe, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(0, 212, 255, 0.26)',
        boxShadow: '0 -8px 30px rgba(0, 212, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(10, 22, 40, 0.5), rgba(5, 10, 14, 0.9))',
      }}
    >
      <div
        className="container-shell"
        style={{
          paddingBlock: '2.6rem',
          display: 'grid',
          gap: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '1.6rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.58rem' }}>ElectroMap</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 260 }}>
              Intelligent EV charging discovery for high-confidence trips.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.58rem', fontSize: '1rem' }}>Links</h4>
            <div style={{ display: 'grid', gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <Link to="/map">Map</Link>
              <Link to="/">About</Link>
              <Link to="/">Contact</Link>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.58rem', fontSize: '1rem' }}>Social</h4>
            <div style={{ display: 'flex', gap: '0.7rem', color: 'var(--text-secondary)' }}>
              <a href="#" aria-label="Community" style={{ color: 'inherit' }}>
                <MessageCircle size={18} />
              </a>
              <a href="#" aria-label="Developer docs" style={{ color: 'inherit' }}>
                <Code2 size={18} />
              </a>
              <a href="#" aria-label="Website" style={{ color: 'inherit' }}>
                <Globe size={18} />
              </a>
            </div>
          </div>
        </div>

        <small style={{ color: 'var(--text-secondary)' }}>
          ElectroMap | Real-time EV charging intelligence
        </small>
      </div>
    </footer>
  )
}

export default Footer
