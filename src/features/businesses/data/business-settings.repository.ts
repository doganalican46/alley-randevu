import { AppError } from '@/core/errors/app-error'
import type { ParsedBusinessSettings } from '@/features/businesses/model/business-settings.schema'
import { getSupabaseClient } from '@/integrations/supabase/client'

export interface BusinessSettings {
  id: string
  name: string
  slug: string
  description: string
  timezone: string
  currency: string
  bookingIntervalMinutes: number
  minimumBookingNoticeMinutes: number
  maximumBookingDays: number
  cancellationNoticeHours: number
  autoConfirmAppointments: boolean
  isPublished: boolean
}

const settingsColumns =
  'id,name,slug,description,timezone,currency,booking_interval_minutes,minimum_booking_notice_minutes,maximum_booking_days,cancellation_notice_hours,auto_confirm_appointments,is_published'

export async function getBusinessSettings(businessId: string): Promise<BusinessSettings> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')

  const { data, error } = await client
    .from('businesses')
    .select(settingsColumns)
    .eq('id', businessId)
    .single()

  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'İşletme ayarları alınamadı.', error)

  return mapBusinessSettings(data)
}

export async function updateBusinessSettings(
  businessId: string,
  values: ParsedBusinessSettings
): Promise<BusinessSettings> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')

  const { data, error } = await client
    .from('businesses')
    .update({
      name: values.name,
      description: values.description || null,
      timezone: values.timezone,
      currency: values.currency,
      booking_interval_minutes: Number(values.bookingIntervalMinutes),
      minimum_booking_notice_minutes: values.minimumBookingNoticeMinutes,
      maximum_booking_days: values.maximumBookingDays,
      cancellation_notice_hours: values.cancellationNoticeHours,
      auto_confirm_appointments: values.autoConfirmAppointments,
      is_published: values.isPublished,
      status: values.isPublished ? 'active' : 'draft'
    })
    .eq('id', businessId)
    .select(settingsColumns)
    .single()

  if (error) throw new AppError('AUTHORIZATION_ERROR', 'İşletme ayarları kaydedilemedi.', error)

  return mapBusinessSettings(data)
}

function mapBusinessSettings(data: {
  id: string
  name: string
  slug: string
  description: string | null
  timezone: string
  currency: string
  booking_interval_minutes: number
  minimum_booking_notice_minutes: number
  maximum_booking_days: number
  cancellation_notice_hours: number
  auto_confirm_appointments: boolean
  is_published: boolean
}): BusinessSettings {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? '',
    timezone: data.timezone,
    currency: data.currency,
    bookingIntervalMinutes: data.booking_interval_minutes,
    minimumBookingNoticeMinutes: data.minimum_booking_notice_minutes,
    maximumBookingDays: data.maximum_booking_days,
    cancellationNoticeHours: data.cancellation_notice_hours,
    autoConfirmAppointments: data.auto_confirm_appointments,
    isPublished: data.is_published
  }
}
