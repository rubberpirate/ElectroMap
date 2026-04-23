import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import App from './App.jsx'
import ErrorBoundary from './components/error/ErrorBoundary'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(18, 18, 18, 0.95)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
            },
            success: {
              style: {
                border: '1px solid rgba(141, 211, 158, 0.55)',
                boxShadow: '0 12px 24px rgba(141, 211, 158, 0.2)',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(255, 51, 51, 0.6)',
                boxShadow: '0 12px 24px rgba(255, 51, 51, 0.2)',
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
