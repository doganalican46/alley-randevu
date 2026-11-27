import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { env } from '@/core/config/env'
import {
  hasAllBusinessPermissions,
  hasAnyBusinessPermission,
  type Permission
} from '@/core/permissions/permissions'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { PageLoader } from '@/shared/components/page-loader'

interface BusinessPermissionGuardProps {
  children: React.ReactNode
  permissions: readonly Permission[]
  requireAll?: boolean
}

export function BusinessPermissionGuard({
  children,
  permissions,
  requireAll = false
}: BusinessPermissionGuardProps) {
  const { businessId } = useParams()
  const { user } = useAuth()
  const isDemo = businessId === 'demo'
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId ?? '', user?.id ?? ''),
    enabled: !isDemo && Boolean(businessId && user?.id && env.isSupabaseConfigured),
    retry: false
  })

  if (isDemo) return children
  if (membershipQuery.isLoading) return <PageLoader />

  const isAllowed = requireAll
    ? hasAllBusinessPermissions(membershipQuery.data, permissions)
    : hasAnyBusinessPermission(membershipQuery.data, permissions)

  if (!isAllowed) return <Navigate to="/forbidden" replace />

  return children
}
