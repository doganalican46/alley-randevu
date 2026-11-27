import { AppError } from '@/core/errors/app-error'
import {
  getBusinessInitials,
  type PublicBusinessProfile
} from '@/features/booking/model/public-business'
import { getSupabaseClient } from '@/integrations/supabase/client'

export async function getPublicBusiness(slug: string): Promise<PublicBusinessProfile | null> {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı yapılandırılmamış.')

  const { data: business, error: businessError } = await client
    .from('businesses')
    .select('id, name, slug, description, timezone, currency, maximum_booking_days')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('is_published', true)
    .maybeSingle()

  if (businessError) {
    throw new AppError('NETWORK_ERROR', 'İşletme bilgileri yüklenemedi.', businessError)
  }
  if (!business) return null

  const [branchesResult, servicesResult] = await Promise.all([
    client
      .from('branches')
      .select('id, name, address_line, phone, timezone, is_primary')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name'),
    client
      .from('services')
      .select('id, name, description, duration_minutes, price, currency')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order')
      .order('name')
  ])

  const catalogError = branchesResult.error ?? servicesResult.error
  if (catalogError) {
    throw new AppError('NETWORK_ERROR', 'İşletme kataloğu yüklenemedi.', catalogError)
  }

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    initials: getBusinessInitials(business.name),
    description: business.description,
    timezone: business.timezone,
    currency: business.currency,
    maximumBookingDays: business.maximum_booking_days,
    branches: (branchesResult.data ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      addressLine: branch.address_line,
      phone: branch.phone,
      timezone: branch.timezone,
      isPrimary: branch.is_primary
    })),
    services: (servicesResult.data ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      price: Number(service.price),
      currency: service.currency
    })),
    isDemo: false
  }
}
