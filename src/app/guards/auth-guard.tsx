import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuth } from '@/features/auth/auth-context'
import { PageLoader } from '@/shared/components/page-loader'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!env.isSupabaseConfigured || !session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
