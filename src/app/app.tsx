import { AppRouter } from '@/app/router/app-router'
import { PwaExperience } from '@/shared/components/pwa-experience'

export function App() {
  return (
    <>
      <AppRouter />
      <PwaExperience />
    </>
  )
}
