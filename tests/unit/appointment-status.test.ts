import { describe, expect, it } from 'vitest'
import { appointmentTransitions, canTransitionAppointment } from '@/core/domain/appointment-status'

describe('appointment status state machine', () => {
  it('allows the documented happy-path lifecycle', () => {
    expect(canTransitionAppointment('PENDING', 'CONFIRMED')).toBe(true)
    expect(canTransitionAppointment('CONFIRMED', 'CHECKED_IN')).toBe(true)
    expect(canTransitionAppointment('CHECKED_IN', 'IN_PROGRESS')).toBe(true)
    expect(canTransitionAppointment('IN_PROGRESS', 'COMPLETED')).toBe(true)
  })

  it('rejects invalid and terminal-state transitions', () => {
    expect(canTransitionAppointment('PENDING', 'COMPLETED')).toBe(false)
    expect(canTransitionAppointment('COMPLETED', 'CONFIRMED')).toBe(false)
    expect(canTransitionAppointment('CANCELLED', 'PENDING')).toBe(false)
  })

  it('keeps all terminal states closed', () => {
    for (const status of ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'EXPIRED'] as const) {
      expect(appointmentTransitions[status]).toHaveLength(0)
    }
  })
})
