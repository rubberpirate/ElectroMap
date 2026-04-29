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
              background: '#0f1e30',
              color: 'var(--text-primary)',
              border: '1px solid rgba(0,232,204,0.15)',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.34)',
            },
            success: {
              style: {
                border: '1px solid rgba(141, 211, 158, 0.55)',
                boxShadow: '0 12px 24px rgba(141, 211, 158, 0.2)',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(255, 77, 109, 0.6)',
                boxShadow: '0 12px 24px rgba(255, 77, 109, 0.18)',
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
