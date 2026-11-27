import { z } from 'zod'

export const bookingContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
  email: z.string().trim().email().max(254),
  notes: z.string().trim().max(1000)
})

export type BookingContact = z.infer<typeof bookingContactSchema>
