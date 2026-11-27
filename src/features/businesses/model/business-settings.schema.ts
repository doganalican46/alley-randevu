import { z } from 'zod'

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
  timezone: z.string().trim().min(3).max(80),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/),
  bookingIntervalMinutes: z.enum(['5', '10', '15', '20', '30', '60']),
  minimumBookingNoticeMinutes: z.coerce.number().int().min(0).max(10080),
  maximumBookingDays: z.coerce.number().int().min(1).max(365),
  cancellationNoticeHours: z.coerce.number().int().min(0).max(720),
  autoConfirmAppointments: z.boolean(),
  isPublished: z.boolean()
})

export type BusinessSettingsFormValues = z.input<typeof businessSettingsSchema>
export type ParsedBusinessSettings = z.output<typeof businessSettingsSchema>
