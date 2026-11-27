import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { AppProviders } from '@/app/providers/app-providers'
import { initializeSystemTheme } from '@/core/platform/system-theme'
import '@/styles/index.css'

initializeSystemTheme()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Uygulama kök elementi bulunamadı.')
}

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
