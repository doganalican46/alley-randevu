import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuth } from '@/features/auth/auth-context'
import { isPlatformAdmin } from '@/features/platform/data/platform.repository'
import { PageLoader } from '@/shared/components/page-loader'

export function PlatformAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const accessQuery = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: () => isPlatformAdmin(user?.id ?? ''),
    enabled: Boolean(user?.id && env.isSupabaseConfigured),
    retry: false
  })

  if (isLoading) return <PageLoader />
  if (!env.isSupabaseConfigured || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (accessQuery.isLoading) return <PageLoader />
  if (accessQuery.isError || !accessQuery.data) return <Navigate to="/forbidden" replace />

  return children
}
