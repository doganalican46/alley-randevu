import { describe, expect, it } from 'vitest'
import { canManageTeam } from '@/features/team/model/team-permissions'
import { staffSchema, workingHourSchema } from '@/features/team/model/team.schema'

describe('team validation', () => {
  it('accepts valid staff and working-hour values', () => {
    expect(staffSchema.safeParse({ displayName: 'Aslı Demir', title: 'Uzman' }).success).toBe(true)
    expect(
      workingHourSchema.safeParse({
        branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        weekday: '1',
        startsAt: '09:00',
        endsAt: '18:00'
      }).success
    ).toBe(true)
  })

  it('rejects invalid or reversed working hours', () => {
    expect(
      workingHourSchema.safeParse({
        branchId: 'not-a-uuid',
        weekday: '7',
        startsAt: '18:00',
        endsAt: '09:00'
      }).success
    ).toBe(false)
  })
})

describe('team permissions', () => {
  it('allows administrators and explicit permission holders', () => {
    expect(canManageTeam({ businessId: 'a', role: 'admin', permissions: [] })).toBe(true)
    expect(canManageTeam({ businessId: 'a', role: 'staff', permissions: ['staff.manage'] })).toBe(
      true
    )
    expect(canManageTeam({ businessId: 'a', role: 'staff', permissions: [] })).toBe(false)
  })
})
