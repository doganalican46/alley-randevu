import { AppError } from '@/core/errors/app-error'
import type { Branch, Service } from '@/features/catalog/data/catalog.repository'
import { getSupabaseClient } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'

export type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']
export type StaffService = Database['public']['Tables']['staff_services']['Row']
export type StaffWorkingHour = Database['public']['Tables']['staff_working_hours']['Row']

export interface TeamSetup {
  branches: Branch[]
  services: Service[]
  staff: StaffProfile[]
  staffServices: StaffService[]
  workingHours: StaffWorkingHour[]
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı yapılandırılmamış.')
  return client
}

export async function getTeamSetup(businessId: string): Promise<TeamSetup> {
  const client = requireClient()
  const [branches, services, staff, staffServices, workingHours] = await Promise.all([
    client.from('branches').select('*').eq('business_id', businessId).order('name'),
    client.from('services').select('*').eq('business_id', businessId).order('sort_order'),
    client.from('staff_profiles').select('*').eq('business_id', businessId).order('display_name'),
    client.from('staff_services').select('*').eq('business_id', businessId),
    client.from('staff_working_hours').select('*').eq('business_id', businessId).order('weekday')
  ])
  const error =
    branches.error ?? services.error ?? staff.error ?? staffServices.error ?? workingHours.error
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Ekip bilgileri yüklenemedi.', error)

  return {
    branches: branches.data ?? [],
    services: services.data ?? [],
    staff: staff.data ?? [],
    staffServices: staffServices.data ?? [],
    workingHours: workingHours.data ?? []
  }
}

export async function createStaff(input: {
  businessId: string
  displayName: string
  title: string
}): Promise<StaffProfile> {
  const client = requireClient()
  const { data, error } = await client
    .from('staff_profiles')
    .insert({
      business_id: input.businessId,
      display_name: input.displayName,
      title: input.title || null
    })
    .select('*')
    .single()
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Personel oluşturulamadı.', error)
  return data
}

export async function setStaffActive(
  businessId: string,
  staffId: string,
  isActive: boolean
): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('staff_profiles')
    .update({ is_active: isActive, is_bookable: isActive })
    .eq('business_id', businessId)
    .eq('id', staffId)
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Personel güncellenemedi.', error)
}

export async function replaceStaffServices(
  businessId: string,
  staffId: string,
  serviceIds: string[]
): Promise<void> {
  const client = requireClient()
  const { error } = await client.rpc('replace_staff_services', {
    target_business_id: businessId,
    target_staff_id: staffId,
    target_service_ids: serviceIds
  })
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Hizmet atamaları güncellenemedi.', error)
}

export async function saveWorkingHour(input: {
  businessId: string
  staffId: string
  branchId: string
  weekday: number
  startsAt: string
  endsAt: string
}): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('staff_working_hours').upsert(
    {
      business_id: input.businessId,
      staff_id: input.staffId,
      branch_id: input.branchId,
      weekday: input.weekday,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_active: true
    },
    { onConflict: 'business_id,branch_id,staff_id,weekday' }
  )
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Çalışma saati kaydedilemedi.', error)
}

export async function deleteWorkingHour(businessId: string, hourId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('staff_working_hours')
    .delete()
    .eq('business_id', businessId)
    .eq('id', hourId)
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Çalışma saati kaldırılamadı.', error)
}
