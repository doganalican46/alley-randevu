import { z } from 'zod'

export const staffSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  title: z.string().trim().max(120)
})

export const workingHourSchema = z
  .object({
    branchId: z.string().uuid(),
    weekday: z.string().regex(/^[0-6]$/),
    startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  })
  .refine((value) => value.endsAt > value.startsAt, { path: ['endsAt'] })

export type StaffFormValues = z.infer<typeof staffSchema>
export type WorkingHourFormValues = z.infer<typeof workingHourSchema>
