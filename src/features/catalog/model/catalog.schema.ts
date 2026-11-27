import { z } from 'zod'

const optionalText = (maximum: number) => z.string().trim().max(maximum)

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  addressLine: optionalText(240),
  phone: optionalText(32)
})

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText(500),
  durationMinutes: z.string().regex(/^([5-9]|[1-9]\d{1,2}|1[0-3]\d{2}|14[0-3]\d|1440)$/),
  price: z.string().regex(/^\d+(?:[.,]\d{1,2})?$/)
})

export type BranchFormValues = z.infer<typeof branchSchema>
export type ServiceFormValues = z.infer<typeof serviceSchema>

export function parsePrice(value: string): number {
  return Number(value.replace(',', '.'))
}
