import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Check, Link2, MapPin, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppError } from '@/core/errors/app-error'
import {
  createBusinessSlug,
  onboardingSchema,
  type OnboardingValues
} from '@/features/onboarding/model/onboarding.schema'
import { onboardBusiness } from '@/features/onboarding/services/onboarding.service'
import { BrandMark } from '@/shared/components/brand-mark'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<string | null>(null)
  const slugEditedRef = useRef(false)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { businessName: '', businessSlug: '', branchName: t('onboarding.defaultBranch') }
  })
  const businessName = watch('businessName')

  useEffect(() => {
    if (!slugEditedRef.current) {
      setValue('businessSlug', createBusinessSlug(businessName), { shouldValidate: false })
    }
  }, [businessName, setValue])

  const onSubmit = async (values: OnboardingValues) => {
    setFeedback(null)
    try {
      const businessId = await onboardBusiness(values)
      navigate(`/business/${businessId}`, { replace: true })
    } catch (error) {
      setFeedback(t(getOnboardingErrorKey(error)))
    }
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-5 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <BrandMark />
        <div className="mt-7 grid min-w-0 gap-6 sm:mt-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-8">
          <aside className="min-w-0 rounded-[1.5rem] bg-slate-950 p-6 text-white sm:rounded-[2rem] sm:p-10">
            <span className="demo-pill !bg-indigo-500/20 !text-indigo-200">
              {t('onboarding.stepLabel')}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] sm:mt-6 sm:text-4xl">
              {t('onboarding.title')}
            </h1>
            <p className="mt-4 leading-7 text-slate-300">{t('onboarding.description')}</p>
            <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-5">
              {(['tenant', 'owner', 'branch'] as const).map((key) => (
                <div key={key} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <p className="text-sm font-semibold text-slate-200">
                    {t(`onboarding.benefits.${key}`)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-start gap-3 border-t border-white/10 pt-6 text-sm leading-6 text-slate-400 sm:mt-12 sm:pt-7">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-indigo-300" />
              <span>{t('onboarding.securityNote')}</span>
            </div>
          </aside>

          <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:rounded-[2rem] sm:p-10">
            <p className="section-kicker">{t('onboarding.formKicker')}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {t('onboarding.formTitle')}
            </h2>
            <form
              className="mt-6 space-y-5 sm:mt-8 sm:space-y-6"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <OnboardingField
                icon={Building2}
                label={t('onboarding.businessName')}
                error={errors.businessName?.message}
              >
                <input
                  className="form-input"
                  autoComplete="organization"
                  placeholder={t('onboarding.businessNamePlaceholder')}
                  {...register('businessName')}
                />
              </OnboardingField>

              <OnboardingField
                icon={Link2}
                label={t('onboarding.businessSlug')}
                hint={t('onboarding.slugHint')}
                error={errors.businessSlug?.message}
              >
                <div className="flex min-w-0 flex-1 items-center">
                  <span className="hidden text-sm text-slate-400 sm:inline">/b/</span>
                  <input
                    className="form-input"
                    autoCapitalize="none"
                    spellCheck={false}
                    {...register('businessSlug', {
                      onChange: () => {
                        slugEditedRef.current = true
                      }
                    })}
                  />
                </div>
              </OnboardingField>

              <OnboardingField
                icon={MapPin}
                label={t('onboarding.branchName')}
                error={errors.branchName?.message}
              >
                <input className="form-input" {...register('branchName')} />
              </OnboardingField>

              {feedback && (
                <p
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                  role="alert"
                >
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                className="button button-primary button-large w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('onboarding.creating') : t('onboarding.submit')}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

function getOnboardingErrorKey(error: unknown): string {
  if (!(error instanceof AppError)) return 'onboarding.genericError'

  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'onboarding.errors.duplicateSlug'
    case 'AUTHENTICATION_ERROR':
      return 'onboarding.errors.sessionExpired'
    case 'AUTHORIZATION_ERROR':
      return 'onboarding.errors.permissionDenied'
    default:
      return 'onboarding.genericError'
  }
}

function OnboardingField({
  icon: Icon,
  label,
  hint,
  error,
  children
}: {
  icon: typeof Building2
  label: string
  hint?: string | undefined
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <span className="form-input-wrap">
        <Icon className="size-5 shrink-0 text-slate-400" />
        {children}
      </span>
      {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-2 block text-sm font-semibold text-red-600">{error}</span>}
    </label>
  )
}
