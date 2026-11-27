import { describe, expect, it } from 'vitest'
import {
  hasAllBusinessPermissions,
  hasAnyBusinessPermission,
  hasBusinessPermission,
  isPermission
} from '@/core/permissions/permissions'

describe('business permissions', () => {
  it('combines role defaults with explicit grants', () => {
    const receptionist = {
      role: 'receptionist' as const,
      permissions: ['reports.view'] as const
    }

    expect(hasBusinessPermission(receptionist, 'appointments.create')).toBe(true)
    expect(hasBusinessPermission(receptionist, 'reports.view')).toBe(true)
    expect(hasBusinessPermission(receptionist, 'billing.manage')).toBe(false)
  })

  it('supports any and all checks without granting missing permissions', () => {
    const staff = { role: 'staff' as const, permissions: [] }

    expect(hasAnyBusinessPermission(staff, ['appointments.read', 'staff.manage'])).toBe(true)
    expect(hasAllBusinessPermissions(staff, ['appointments.read', 'staff.manage'])).toBe(false)
  })

  it('rejects unknown permission values from persisted data', () => {
    expect(isPermission('services.manage')).toBe(true)
    expect(isPermission('platform.superuser')).toBe(false)
  })
})
