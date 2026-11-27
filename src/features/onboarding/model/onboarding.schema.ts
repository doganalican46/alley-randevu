import { z } from 'zod'

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessSlug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  branchName: z.string().trim().min(2).max(120)
})

export type OnboardingValues = z.infer<typeof onboardingSchema>

const turkishCharacterMap: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u'
}

export function createBusinessSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (character) => turkishCharacterMap[character] ?? character)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
}
