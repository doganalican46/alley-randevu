import { describe, expect, it } from 'vitest'
import { businessSettingsSchema } from '@/features/businesses/model/business-settings.schema'

const validSettings = {
  name: 'Alley Barber',
  description: '',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  bookingIntervalMinutes: '15',
  minimumBookingNoticeMinutes: 60,
  maximumBookingDays: 90,
  cancellationNoticeHours: 24,
  autoConfirmAppointments: false,
  isPublished: true
}

describe('business booking settings', () => {
  it('accepts supported scheduling limits', () => {
    expect(businessSettingsSchema.safeParse(validSettings).success).toBe(true)
  })

  it('rejects unsupported intervals and excessive booking windows', () => {
    expect(
      businessSettingsSchema.safeParse({
        ...validSettings,
        bookingIntervalMinutes: '17',
        maximumBookingDays: 999
      }).success
    ).toBe(false)
  })
})
