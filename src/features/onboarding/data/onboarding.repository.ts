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
    const isDuplicate = error.code === '23505'
    throw new AppError(
      isDuplicate ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      isDuplicate
        ? 'Bu işletme bağlantısı daha önce alınmış. Başka bir bağlantı seçin.'
        : 'İşletme çalışma alanı oluşturulamadı.',
      error
    )
  }

  return data
}
