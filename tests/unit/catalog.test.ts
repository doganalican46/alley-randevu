import { describe, expect, it } from 'vitest'
import { getCatalogPermissions } from '@/features/catalog/model/catalog-permissions'
import { branchSchema, parsePrice, serviceSchema } from '@/features/catalog/model/catalog.schema'

describe('catalog validation', () => {
  it('accepts valid branch and service values', () => {
    expect(
      branchSchema.safeParse({
        name: 'Merkez',
        slug: 'merkez',
        addressLine: '',
        phone: ''
      }).success
    ).toBe(true)
    expect(
      serviceSchema.safeParse({
        name: 'Saç kesimi',
        description: '',
        durationMinutes: '45',
        price: '750,50'
      }).success
    ).toBe(true)
    expect(parsePrice('750,50')).toBe(750.5)
  })

  it('rejects invalid duration, price and slug values', () => {
    expect(
      branchSchema.safeParse({ name: 'Şube', slug: '../sube', addressLine: '', phone: '' }).success
    ).toBe(false)
    expect(
      serviceSchema.safeParse({
        name: 'Bakım',
        description: '',
        durationMinutes: '2',
        price: '-10'
      }).success
    ).toBe(false)
  })
})

describe('catalog permissions', () => {
  it('allows owners and explicit permission holders to manage the catalog', () => {
    expect(getCatalogPermissions({ businessId: 'a', role: 'owner', permissions: [] })).toEqual({
      canManageBranches: true,
      canManageServices: true
    })
    expect(
      getCatalogPermissions({
        businessId: 'a',
        role: 'staff',
        permissions: ['services.manage']
      })
    ).toEqual({ canManageBranches: false, canManageServices: true })
  })
})
