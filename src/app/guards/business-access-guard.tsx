import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { PageLoader } from '@/shared/components/page-loader'

export function BusinessAccessGuard({ children }: { children: React.ReactNode }) {
  const { businessId } = useParams()
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const isDemo = businessId === 'demo'
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId ?? '', user?.id ?? ''),
    enabled: !isDemo && Boolean(businessId && user?.id && env.isSupabaseConfigured),
    retry: false
  })

  if (isDemo) return children
  if (isLoading) return <PageLoader />
  if (!env.isSupabaseConfigured || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (
    !businessId ||
    membershipQuery.isError ||
    (!membershipQuery.isLoading && !membershipQuery.data)
  ) {
    return <Navigate to="/forbidden" replace />
  }
  if (membershipQuery.isLoading) return <PageLoader />

  return children
}
