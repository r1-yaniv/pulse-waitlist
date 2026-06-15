import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initOpenReplay } from './lib/openreplay'

// Record real deployed traffic only — skip local dev / HMR sessions.
if (import.meta.env.PROD) initOpenReplay()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
