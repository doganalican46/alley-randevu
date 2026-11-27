import { describe, expect, it } from 'vitest'
import { bookingContactSchema } from '@/features/booking/model/booking.schema'

describe('booking contact validation', () => {
  it('accepts minimal verified contact details', () => {
    expect(
      bookingContactSchema.safeParse({
        name: 'Ayşe Yılmaz',
        phone: '',
        email: 'ayse@example.com',
        notes: ''
      }).success
    ).toBe(true)
  })

  it('rejects malformed email and oversized names', () => {
    expect(
      bookingContactSchema.safeParse({ name: 'A', phone: '', email: 'invalid', notes: '' }).success
    ).toBe(false)
  })
})
