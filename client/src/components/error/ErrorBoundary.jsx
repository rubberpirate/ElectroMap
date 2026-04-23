import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      message: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error.',
    }
  }

  componentDidCatch(error, info) {
    // Logging keeps diagnostics available in production consoles.
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        className="hero-gradient"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '1rem',
        }}
      >
        <section
          className="glass-card"
          style={{
            width: 'min(560px, 100%)',
            borderRadius: '14px',
            padding: '1rem',
            display: 'grid',
            gap: '0.65rem',
          }}
        >
          <h1 style={{ fontSize: '1.4rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {this.state.message || 'Unexpected application error.'}
          </p>
          <button
            type="button"
            className="focus-ring"
            onClick={this.handleReload}
            style={{
              minHeight: 42,
              borderRadius: '10px',
              border: '1px solid rgba(0, 212, 255, 0.34)',
              background: 'rgba(10, 22, 40, 0.72)',
              color: 'var(--text-primary)',
              width: 'fit-content',
              paddingInline: '0.9rem',
            }}
          >
            Reload App
          </button>
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
