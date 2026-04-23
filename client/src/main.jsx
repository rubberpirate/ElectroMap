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
              background: 'rgba(6, 16, 28, 0.94)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(0, 212, 255, 0.36)',
              boxShadow: '0 12px 28px rgba(0, 212, 255, 0.2)',
            },
            success: {
              style: {
                border: '1px solid rgba(0, 255, 136, 0.45)',
                boxShadow: '0 12px 28px rgba(0, 255, 136, 0.24)',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(255, 61, 90, 0.45)',
                boxShadow: '0 12px 28px rgba(255, 61, 90, 0.22)',
              },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
