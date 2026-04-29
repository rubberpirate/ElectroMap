import { Code2, Globe, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -8px 30px rgba(0, 232, 204, 0.08)',
        background: 'linear-gradient(180deg, rgba(13, 34, 51, 0.74), rgba(5, 10, 14, 0.94))',
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
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.58rem', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--cyan)' }}>E</span>LECTROMAP
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 260 }}>
              Intelligent EV charging discovery for high-confidence trips.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.58rem', fontSize: '1rem' }}>Links</h4>
            <div style={{ display: 'grid', gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <Link to="/#about">About</Link>
              <Link to="/map">Map</Link>
              <Link to="/#featured-stations">Stations</Link>
              <Link to="/#pricing">Pricing</Link>
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

        <small className="mono-data" style={{ color: 'var(--text-secondary)' }}>
          © {new Date().getFullYear()} ElectroMap | Real-time EV charging intelligence
        </small>
      </div>
    </footer>
  )
}

export default Footer
