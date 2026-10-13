import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Handy for poking at the doll from the browser console while developing.
if (import.meta.env.DEV) {
  import('./store').then(({ useDoll }) => Object.assign(window, { doll: useDoll }))
}
