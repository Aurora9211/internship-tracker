import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import InternshipTracker from './InternshipTracker'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InternshipTracker />
  </StrictMode>,
)
