import { AppError } from '@/core/errors/app-error'
import type { OnboardingValues } from '@/features/onboarding/model/onboarding.schema'
import { getSupabaseClient } from '@/integrations/supabase/client'

export async function createBusinessWorkspace(values: OnboardingValues): Promise<string> {
  const client = getSupabaseClient()
  if (!client) {
    throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı yapılandırılmadı.')
  }

  const { data, error } = await client.rpc('create_business', {
    business_name: values.businessName,
    business_slug: values.businessSlug,
    branch_name: values.branchName
  })

  if (error) {
    const errorCode =
      error.code === '23505'
        ? 'VALIDATION_ERROR'
        : error.code === '28000'
          ? 'AUTHENTICATION_ERROR'
          : error.code === '42501'
            ? 'AUTHORIZATION_ERROR'
            : 'INTERNAL_ERROR'
    throw new AppError(
      errorCode,
      `Business workspace creation failed (${error.code ?? 'unknown'})`,
      error
    )
  }

  return data
}
