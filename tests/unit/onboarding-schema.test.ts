import { describe, expect, it } from 'vitest'
import { createBusinessSlug, onboardingSchema } from '@/features/onboarding/model/onboarding.schema'

describe('business onboarding schema', () => {
  it('creates URL-safe slugs from Turkish business names', () => {
    expect(createBusinessSlug('  Şişli Güzellik & Bakım  ')).toBe('sisli-guzellik-bakim')
    expect(createBusinessSlug('Özel Öğretmen Çözüm')).toBe('ozel-ogretmen-cozum')
  })

  it('accepts a complete onboarding payload', () => {
    expect(
      onboardingSchema.safeParse({
        businessName: 'Alley Barber',
        businessSlug: 'alley-barber',
        branchName: 'Merkez Şube'
      }).success
    ).toBe(true)
  })

  it('rejects unsafe or malformed slugs', () => {
    expect(
      onboardingSchema.safeParse({
        businessName: 'Alley Barber',
        businessSlug: '../another-tenant',
        branchName: 'Merkez Şube'
      }).success
    ).toBe(false)
  })
})
