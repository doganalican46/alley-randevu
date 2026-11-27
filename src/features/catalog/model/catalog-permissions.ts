import type { BusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { hasBusinessPermission } from '@/core/permissions/permissions'

export interface CatalogPermissions {
  canManageBranches: boolean
  canManageServices: boolean
}

export function getCatalogPermissions(
  membership: BusinessMembership | null | undefined
): CatalogPermissions {
  return {
    canManageBranches: hasBusinessPermission(membership, 'branches.manage'),
    canManageServices: hasBusinessPermission(membership, 'services.manage')
  }
}
