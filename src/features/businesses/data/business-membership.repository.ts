import { AppError } from '@/core/errors/app-error'
import { isPermission, type BusinessRole, type Permission } from '@/core/permissions/permissions'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface BusinessMembership {
  businessId: string
  role: BusinessRole
  permissions: Permission[]
}

export async function getBusinessMembership(
  businessId: string,
  userId: string
): Promise<BusinessMembership | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client
    .from('business_members')
    .select('business_id, role, permissions, is_active')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'İşletme erişimi doğrulanamadı.', error)
  }

  if (!data) return null
  return {
    businessId: data.business_id,
    role: data.role,
    permissions: data.permissions.filter(isPermission)
  }
}
