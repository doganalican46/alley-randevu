import { createBusinessWorkspace } from '@/features/onboarding/data/onboarding.repository'
import {
  onboardingSchema,
  type OnboardingValues
} from '@/features/onboarding/model/onboarding.schema'

export async function onboardBusiness(values: OnboardingValues): Promise<string> {
  const validatedValues = onboardingSchema.parse(values)
  return createBusinessWorkspace(validatedValues)
}
