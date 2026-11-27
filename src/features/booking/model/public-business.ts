import { demoBusiness } from '@/features/booking/data/demo-business'

export interface PublicBranch {
  id: string
  name: string
  addressLine: string | null
  phone: string | null
  timezone: string
  isPrimary: boolean
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  currency: string
}

export interface PublicBusinessProfile {
  id: string
  name: string
  slug: string
  initials: string
  description: string | null
  timezone: string
  currency: string
  maximumBookingDays: number
  branches: PublicBranch[]
  services: PublicService[]
  isDemo: boolean
}

export function getBusinessInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR')
}

export const demoPublicBusiness: PublicBusinessProfile = {
  id: 'demo',
  name: demoBusiness.name,
  slug: demoBusiness.slug,
  initials: demoBusiness.initials,
  description: demoBusiness.description,
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  maximumBookingDays: 90,
  branches: [
    {
      id: 'demo-branch',
      name: 'Moda Şubesi',
      addressLine: demoBusiness.address,
      phone: demoBusiness.phone,
      timezone: 'Europe/Istanbul',
      isPrimary: true
    }
  ],
  services: demoBusiness.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: null,
    durationMinutes: service.duration,
    price: service.price,
    currency: 'TRY'
  })),
  isDemo: true
}

export function formatServicePrice(service: PublicService, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: service.currency,
    maximumFractionDigits: 2
  }).format(service.price)
}
