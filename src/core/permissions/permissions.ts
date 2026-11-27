export const permissions = [
  'appointments.read',
  'appointments.create',
  'appointments.update',
  'appointments.cancel',
  'appointments.manage_all',
  'customers.read',
  'customers.manage',
  'services.manage',
  'staff.manage',
  'branches.manage',
  'reports.view',
  'reports.financial',
  'billing.manage',
  'settings.manage',
  'platform.businesses.manage',
  'platform.subscriptions.manage'
] as const

export type Permission = (typeof permissions)[number]

export type BusinessRole = 'owner' | 'admin' | 'branch_manager' | 'receptionist' | 'staff'

export const defaultRolePermissions: Record<BusinessRole, readonly Permission[]> = {
  owner: permissions.filter((permission) => !permission.startsWith('platform.')),
  admin: [
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.manage_all',
    'customers.read',
    'customers.manage',
    'services.manage',
    'staff.manage',
    'branches.manage',
    'reports.view',
    'settings.manage'
  ],
  branch_manager: [
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.manage_all',
    'customers.read',
    'customers.manage',
    'reports.view'
  ],
  receptionist: [
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'customers.read',
    'customers.manage'
  ],
  staff: ['appointments.read', 'appointments.update', 'customers.read']
}

const permissionSet = new Set<string>(permissions)

export interface BusinessPermissionSubject {
  role: BusinessRole
  permissions: readonly Permission[]
}

export function isPermission(value: string): value is Permission {
  return permissionSet.has(value)
}

export function hasBusinessPermission(
  subject: BusinessPermissionSubject | null | undefined,
  permission: Permission
): boolean {
  if (!subject) return false

  return (
    defaultRolePermissions[subject.role].includes(permission) ||
    subject.permissions.includes(permission)
  )
}

export function hasAnyBusinessPermission(
  subject: BusinessPermissionSubject | null | undefined,
  requiredPermissions: readonly Permission[]
): boolean {
  return requiredPermissions.some((permission) => hasBusinessPermission(subject, permission))
}

export function hasAllBusinessPermissions(
  subject: BusinessPermissionSubject | null | undefined,
  requiredPermissions: readonly Permission[]
): boolean {
  return requiredPermissions.every((permission) => hasBusinessPermission(subject, permission))
}
