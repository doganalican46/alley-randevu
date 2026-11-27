import type { AppointmentStatus } from '@/core/domain/appointment-status'
import { AppError } from '@/core/errors/app-error'
import type { BookingContact } from '@/features/booking/model/booking.schema'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface AvailabilitySlot {
  staffId: string
  staffName: string
  startsAt: string
  endsAt: string
}

export interface CreateBookingInput {
  businessSlug: string
  branchId: string
  serviceId: string
  slot: AvailabilitySlot
  contact: BookingContact
}

export interface AppointmentRecord {
  id: string
  businessId: string
  branchId: string
  staffId: string | null
  customerId: string | null
  status: AppointmentStatus
  startsAt: string
  endsAt: string
  customerName: string
  totalAmount: number
  currency: string
  serviceName: string
  serviceId: string | null
}

export async function getAvailability(
  businessSlug: string,
  branchId: string,
  serviceId: string,
  date: string
): Promise<AvailabilitySlot[]> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  const { data, error } = await client.rpc('get_public_availability', {
    target_business_slug: businessSlug,
    target_branch_id: branchId,
    target_service_id: serviceId,
    target_date: date
  })
  if (error) throw new AppError('NETWORK_ERROR', 'Müsait saatler alınamadı.', error)
  return data.map((slot) => ({
    staffId: slot.staff_id,
    staffName: slot.staff_name,
    startsAt: slot.starts_at,
    endsAt: slot.ends_at
  }))
}

export async function createCustomerAppointment(input: CreateBookingInput): Promise<string> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  const { data, error } = await client.rpc('create_customer_appointment', {
    target_business_slug: input.businessSlug,
    target_branch_id: input.branchId,
    target_service_id: input.serviceId,
    target_staff_id: input.slot.staffId,
    target_starts_at: input.slot.startsAt,
    customer_name: input.contact.name,
    customer_email: input.contact.email,
    ...(input.contact.phone ? { customer_phone: input.contact.phone } : {}),
    ...(input.contact.notes ? { customer_notes: input.contact.notes } : {})
  })
  if (error)
    throw new AppError(
      error.message.includes('CONFLICT') ? 'APPOINTMENT_CONFLICT' : 'INTERNAL_ERROR',
      'Randevu oluşturulamadı.',
      error
    )
  return data
}

export async function getCustomerAppointments(customerId: string): Promise<AppointmentRecord[]> {
  return getAppointments({ customerId })
}

export async function getBusinessAppointments(businessId: string): Promise<AppointmentRecord[]> {
  return getAppointments({ businessId })
}

async function getAppointments(filter: {
  customerId?: string
  businessId?: string
}): Promise<AppointmentRecord[]> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  let query = client
    .from('appointments')
    .select(
      'id,business_id,branch_id,customer_id,staff_id,status,starts_at,ends_at,customer_name_snapshot,total_amount,currency'
    )
    .order('starts_at')
  if (filter.customerId) query = query.eq('customer_id', filter.customerId)
  if (filter.businessId) query = query.eq('business_id', filter.businessId)
  const { data: appointments, error } = await query
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Randevular alınamadı.', error)
  const ids = appointments.map((appointment) => appointment.id)
  const servicesResult = ids.length
    ? await client
        .from('appointment_services')
        .select('appointment_id,service_id,service_name_snapshot,sort_order')
        .in('appointment_id', ids)
        .order('sort_order')
    : { data: [], error: null }
  if (servicesResult.error)
    throw new AppError('AUTHORIZATION_ERROR', 'Randevu hizmetleri alınamadı.', servicesResult.error)
  return appointments.map((appointment) => {
    const service = servicesResult.data.find((item) => item.appointment_id === appointment.id)
    return {
      id: appointment.id,
      businessId: appointment.business_id,
      branchId: appointment.branch_id,
      staffId: appointment.staff_id,
      customerId: appointment.customer_id,
      status: appointment.status,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      customerName: appointment.customer_name_snapshot,
      totalAmount: Number(appointment.total_amount),
      currency: appointment.currency,
      serviceName: service?.service_name_snapshot ?? '—',
      serviceId: service?.service_id ?? null
    }
  })
}

export async function changeAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  reason?: string
): Promise<void> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  const { error } = await client.rpc('change_appointment_status', {
    target_appointment_id: appointmentId,
    target_status: status,
    ...(reason ? { target_reason: reason } : {})
  })
  if (error) throw new AppError('AUTHORIZATION_ERROR', 'Randevu durumu değiştirilemedi.', error)
}

export async function rescheduleAppointment(
  appointmentId: string,
  startsAt: string,
  reason?: string
): Promise<void> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  const { error } = await client.rpc('reschedule_appointment', {
    target_appointment_id: appointmentId,
    target_starts_at: startsAt,
    ...(reason ? { target_reason: reason } : {})
  })
  if (error) throw new AppError('APPOINTMENT_NOT_AVAILABLE', 'Randevu yeniden planlanamadı.', error)
}
