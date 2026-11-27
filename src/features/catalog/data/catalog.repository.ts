import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'

export type Branch = Database['public']['Tables']['branches']['Row']
export type Service = Database['public']['Tables']['services']['Row']

export interface CatalogSnapshot {
  branches: Branch[]
  services: Service[]
}

export interface CreateBranchInput {
  businessId: string
  name: string
  slug: string
  addressLine: string
  phone: string
}

export interface CreateServiceInput {
  businessId: string
  name: string
  description: string
  durationMinutes: number
  price: number
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı yapılandırılmamış.')
  }
  return client
}

export async function getCatalog(businessId: string): Promise<CatalogSnapshot> {
  const client = requireClient()
  const [branchesResult, servicesResult] = await Promise.all([
    client.from('branches').select('*').eq('business_id', businessId).order('created_at'),
    client
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order')
      .order('created_at')
  ])

  const error = branchesResult.error ?? servicesResult.error
  if (error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'Katalog yüklenemedi.', error)
  }

  return {
    branches: branchesResult.data ?? [],
    services: servicesResult.data ?? []
  }
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const client = requireClient()
  const { data, error } = await client
    .from('branches')
    .insert({
      business_id: input.businessId,
      name: input.name,
      slug: input.slug,
      address_line: input.addressLine || null,
      phone: input.phone || null
    })
    .select('*')
    .single()

  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Şube oluşturulamadı.', error)
  return data
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const client = requireClient()
  const { data, error } = await client
    .from('services')
    .insert({
      business_id: input.businessId,
      name: input.name,
      description: input.description || null,
      duration_minutes: input.durationMinutes,
      price: input.price
    })
    .select('*')
    .single()

  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Hizmet oluşturulamadı.', error)
  return data
}

export async function setBranchActive(
  businessId: string,
  branchId: string,
  isActive: boolean
): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('branches')
    .update({ is_active: isActive })
    .eq('business_id', businessId)
    .eq('id', branchId)

  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Şube güncellenemedi.', error)
}

export async function setServiceActive(
  businessId: string,
  serviceId: string,
  isActive: boolean
): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('services')
    .update({ is_active: isActive })
    .eq('business_id', businessId)
    .eq('id', serviceId)

  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Hizmet güncellenemedi.', error)
}
