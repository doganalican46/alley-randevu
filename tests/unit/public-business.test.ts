import { describe, expect, it } from 'vitest'
import { formatServicePrice, getBusinessInitials } from '@/features/booking/model/public-business'

describe('public business model', () => {
  it('creates locale-aware initials', () => {
    expect(getBusinessInitials('İstanbul Güzellik Merkezi')).toBe('İG')
    expect(getBusinessInitials('  Alley   Barber ')).toBe('AB')
  })

  it('formats service prices with their own currency', () => {
    expect(
      formatServicePrice(
        {
          id: 'service',
          name: 'Bakım',
          description: null,
          durationMinutes: 30,
          price: 750,
          currency: 'TRY'
        },
        'tr-TR'
      )
    ).toContain('750')
  })
})
