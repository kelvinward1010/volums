import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AudioVolumeBoost from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioVolumeBoost />
  </StrictMode>,
)
