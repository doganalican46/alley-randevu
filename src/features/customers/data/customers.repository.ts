import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface BusinessCustomer {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  tags: string[]
  appointmentCount: number
  lastAppointmentAt: string | null
  marketingConsent: boolean
  isActive: boolean
}

export interface CreateCustomerInput {
  fullName: string
  email?: string
  phone?: string
  tags: string[]
  marketingConsent: boolean
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  return client
}

export async function getBusinessCustomers(businessId: string): Promise<BusinessCustomer[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('business_customers')
    .select(
      'id,full_name,email,phone,tags,appointment_count,last_appointment_at,marketing_consent,is_active'
    )
    .eq('business_id', businessId)
    .order('last_appointment_at', { ascending: false, nullsFirst: false })
    .order('full_name')

  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Müşteriler alınamadı.', error)
  return (data ?? []).map((customer) => ({
    id: customer.id,
    fullName: customer.full_name,
    email: customer.email,
    phone: customer.phone,
    tags: customer.tags,
    appointmentCount: customer.appointment_count,
    lastAppointmentAt: customer.last_appointment_at,
    marketingConsent: customer.marketing_consent,
    isActive: customer.is_active
  }))
}

export async function createBusinessCustomer(
  businessId: string,
  input: CreateCustomerInput
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('business_customers').insert({
    business_id: businessId,
    full_name: input.fullName.trim(),
    tags: input.tags,
    marketing_consent: input.marketingConsent,
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(input.phone?.trim() ? { phone: input.phone.trim() } : {})
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Müşteri oluşturulamadı.', error)
}

export async function setCustomerActive(customerId: string, isActive: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('business_customers')
    .update({ is_active: isActive })
    .eq('id', customerId)
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Müşteri durumu güncellenemedi.', error)
}

export async function addCustomerNote(
  businessId: string,
  customerId: string,
  authorUserId: string,
  body: string
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('customer_notes').insert({
    business_id: businessId,
    customer_id: customerId,
    author_user_id: authorUserId,
    body: body.trim()
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Müşteri notu eklenemedi.', error)
}
