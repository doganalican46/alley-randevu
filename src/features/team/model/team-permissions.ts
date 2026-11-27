import type { BusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { hasBusinessPermission } from '@/core/permissions/permissions'

export function canManageTeam(membership: BusinessMembership | null | undefined): boolean {
  return hasBusinessPermission(membership, 'staff.manage')
}
