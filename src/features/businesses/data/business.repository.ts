import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface BusinessSummary {
  id: string
  name: string
  status: 'draft' | 'active' | 'suspended' | 'archived'
  isPublished: boolean
  createdAt: string
}

export async function getBusinessSummary(businessId: string): Promise<BusinessSummary> {
  const client = getSupabaseClient()
  if (!client) {
    throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  }

  const { data, error } = await client
    .from('businesses')
    .select('id,name,status,is_published,created_at')
    .eq('id', businessId)
    .single()

  if (error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'İşletme bilgileri alınamadı.', error)
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    isPublished: data.is_published,
    createdAt: data.created_at
  }
}
