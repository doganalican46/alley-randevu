import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CheckCircle2, Clock3, MapPin, Plus, Power, Scissors } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  createBranch,
  createService,
  getCatalog,
  setBranchActive,
  setServiceActive,
  type Branch,
  type Service
} from '@/features/catalog/data/catalog.repository'
import { getCatalogPermissions } from '@/features/catalog/model/catalog-permissions'
import {
  branchSchema,
  serviceSchema,
  type BranchFormValues,
  type ServiceFormValues
} from '@/features/catalog/model/catalog.schema'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { createBusinessSlug } from '@/features/onboarding/model/onboarding.schema'
import { BrandMark } from '@/shared/components/brand-mark'
import { PageLoader } from '@/shared/components/page-loader'

const demoBranches: Branch[] = [
  {
    id: 'demo-branch',
    business_id: 'demo',
    name: 'Merkez Şube',
    slug: 'merkez',
    address_line: 'Kadıköy, İstanbul',
    phone: '+90 212 000 00 00',
    timezone: 'Europe/Istanbul',
    is_primary: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
]

const demoServices: Service[] = [
  {
    id: 'demo-service',
    business_id: 'demo',
    name: 'Saç & sakal',
    description: 'Kişiye özel kesim ve şekillendirme',
    duration_minutes: 60,
    buffer_before_minutes: 0,
    buffer_after_minutes: 10,
    price: 850,
    currency: 'TRY',
    is_active: true,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
]

export default function CatalogPage() {
  const { businessId = '' } = useParams()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const isDemo = businessId === 'demo'
  const catalogKey = ['business-catalog', businessId]

  const catalogQuery = useQuery({
    queryKey: catalogKey,
    queryFn: () => getCatalog(businessId),
    enabled: !isDemo,
    retry: false
  })
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId, user?.id ?? ''),
    enabled: !isDemo && Boolean(user?.id),
    retry: false
  })
  const permissions = getCatalogPermissions(membershipQuery.data)
  const branches = isDemo ? demoBranches : (catalogQuery.data?.branches ?? [])
  const services = isDemo ? demoServices : (catalogQuery.data?.services ?? [])

  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', slug: '', addressLine: '', phone: '' }
  })
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', durationMinutes: '30', price: '0' }
  })

  const refreshCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: catalogKey })
  }
  const branchMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: async () => {
      branchForm.reset()
      setFeedback(t('catalog.branchCreated'))
      await refreshCatalog()
    },
    onError: () => setFeedback(t('catalog.saveError'))
  })
  const serviceMutation = useMutation({
    mutationFn: createService,
    onSuccess: async () => {
      serviceForm.reset({ name: '', description: '', durationMinutes: '30', price: '0' })
      setFeedback(t('catalog.serviceCreated'))
      await refreshCatalog()
    },
    onError: () => setFeedback(t('catalog.saveError'))
  })
  const statusMutation = useMutation({
    mutationFn: async (change: { kind: 'branch' | 'service'; id: string; isActive: boolean }) => {
      if (change.kind === 'branch') {
        await setBranchActive(businessId, change.id, change.isActive)
      } else {
        await setServiceActive(businessId, change.id, change.isActive)
      }
    },
    onSuccess: async () => {
      setFeedback(t('catalog.statusUpdated'))
      await refreshCatalog()
    },
    onError: () => setFeedback(t('catalog.saveError'))
  })

  if (!isDemo && (catalogQuery.isLoading || membershipQuery.isLoading)) return <PageLoader />

  const hasLoadError = !isDemo && (catalogQuery.isError || membershipQuery.isError)
  const controlsDisabledReason = isDemo
    ? t('catalog.demoDisabled')
    : t('catalog.permissionDisabled')

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <BrandMark />
          <Link
            to={`/business/${businessId}`}
            className="button button-ghost border border-slate-200 dark:border-slate-700"
          >
            {t('catalog.backToDashboard')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="max-w-3xl">
          <p className="section-kicker">{t('catalog.kicker')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {t('catalog.title')}
          </h1>
          <p className="mt-3 text-slate-500">{t('catalog.description')}</p>
        </div>

        {isDemo && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {t('catalog.demoDisabled')}
          </div>
        )}
        {feedback && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
          >
            <CheckCircle2 className="size-5" /> {feedback}
          </div>
        )}
        {hasLoadError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
          >
            {t('catalog.loadError')}
          </div>
        )}

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <CatalogSection
            icon={Building2}
            title={t('catalog.branchesTitle')}
            description={t('catalog.branchesDescription')}
          >
            <div className="space-y-3">
              {branches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{branch.name}</h3>
                        {branch.is_primary && <StatusBadge label={t('catalog.primary')} />}
                        <StatusBadge
                          label={branch.is_active ? t('catalog.active') : t('catalog.inactive')}
                          muted={!branch.is_active}
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">/{branch.slug}</p>
                      {branch.address_line && (
                        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <MapPin className="size-4" /> {branch.address_line}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="button button-ghost border border-slate-200 dark:border-slate-700"
                      disabled={
                        isDemo || !permissions.canManageBranches || statusMutation.isPending
                      }
                      title={
                        isDemo || !permissions.canManageBranches
                          ? controlsDisabledReason
                          : undefined
                      }
                      onClick={() =>
                        statusMutation.mutate({
                          kind: 'branch',
                          id: branch.id,
                          isActive: !branch.is_active
                        })
                      }
                    >
                      <Power className="size-4" />
                      {branch.is_active ? t('catalog.deactivate') : t('catalog.activate')}
                    </button>
                  </div>
                </article>
              ))}
              {branches.length === 0 && <EmptyState text={t('catalog.noBranches')} />}
            </div>

            <form
              className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800"
              onSubmit={branchForm.handleSubmit((values) =>
                branchMutation.mutate({ businessId, ...values })
              )}
            >
              <h3 className="font-black">{t('catalog.addBranch')}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('catalog.name')}
                  error={branchForm.formState.errors.name ? t('catalog.invalidField') : undefined}
                >
                  <input
                    className="form-input-wrap w-full"
                    {...branchForm.register('name', {
                      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                        if (!branchForm.formState.dirtyFields.slug) {
                          branchForm.setValue('slug', createBusinessSlug(event.target.value))
                        }
                      }
                    })}
                  />
                </FormField>
                <FormField
                  label={t('catalog.slug')}
                  error={branchForm.formState.errors.slug ? t('catalog.invalidField') : undefined}
                >
                  <input className="form-input-wrap w-full" {...branchForm.register('slug')} />
                </FormField>
                <FormField label={t('catalog.address')}>
                  <input
                    className="form-input-wrap w-full"
                    {...branchForm.register('addressLine')}
                  />
                </FormField>
                <FormField label={t('catalog.phone')}>
                  <input className="form-input-wrap w-full" {...branchForm.register('phone')} />
                </FormField>
              </div>
              <button
                type="submit"
                className="button button-primary mt-4"
                disabled={isDemo || !permissions.canManageBranches || branchMutation.isPending}
                title={
                  isDemo || !permissions.canManageBranches ? controlsDisabledReason : undefined
                }
              >
                <Plus className="size-4" />
                {branchMutation.isPending ? t('catalog.saving') : t('catalog.createBranch')}
              </button>
            </form>
          </CatalogSection>

          <CatalogSection
            icon={Scissors}
            title={t('catalog.servicesTitle')}
            description={t('catalog.servicesDescription')}
          >
            <div className="space-y-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{service.name}</h3>
                        <StatusBadge
                          label={service.is_active ? t('catalog.active') : t('catalog.inactive')}
                          muted={!service.is_active}
                        />
                      </div>
                      <p className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock3 className="size-4" /> {service.duration_minutes}{' '}
                          {t('catalog.minute')}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {new Intl.NumberFormat(i18n.language, {
                            style: 'currency',
                            currency: service.currency
                          }).format(Number(service.price))}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="button button-ghost border border-slate-200 dark:border-slate-700"
                      disabled={
                        isDemo || !permissions.canManageServices || statusMutation.isPending
                      }
                      title={
                        isDemo || !permissions.canManageServices
                          ? controlsDisabledReason
                          : undefined
                      }
                      onClick={() =>
                        statusMutation.mutate({
                          kind: 'service',
                          id: service.id,
                          isActive: !service.is_active
                        })
                      }
                    >
                      <Power className="size-4" />
                      {service.is_active ? t('catalog.deactivate') : t('catalog.activate')}
                    </button>
                  </div>
                </article>
              ))}
              {services.length === 0 && <EmptyState text={t('catalog.noServices')} />}
            </div>

            <form
              className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800"
              onSubmit={serviceForm.handleSubmit((values) =>
                serviceMutation.mutate({
                  businessId,
                  name: values.name,
                  description: values.description,
                  durationMinutes: Number(values.durationMinutes),
                  price: Number(values.price.replace(',', '.'))
                })
              )}
            >
              <h3 className="font-black">{t('catalog.addService')}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('catalog.name')}
                  error={serviceForm.formState.errors.name ? t('catalog.invalidField') : undefined}
                >
                  <input className="form-input-wrap w-full" {...serviceForm.register('name')} />
                </FormField>
                <FormField
                  label={t('catalog.duration')}
                  error={
                    serviceForm.formState.errors.durationMinutes
                      ? t('catalog.invalidField')
                      : undefined
                  }
                >
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    className="form-input-wrap w-full"
                    {...serviceForm.register('durationMinutes')}
                  />
                </FormField>
                <FormField
                  label={t('catalog.price')}
                  error={serviceForm.formState.errors.price ? t('catalog.invalidField') : undefined}
                >
                  <input
                    inputMode="decimal"
                    className="form-input-wrap w-full"
                    {...serviceForm.register('price')}
                  />
                </FormField>
                <FormField label={t('catalog.descriptionField')}>
                  <input
                    className="form-input-wrap w-full"
                    {...serviceForm.register('description')}
                  />
                </FormField>
              </div>
              <button
                type="submit"
                className="button button-primary mt-4"
                disabled={isDemo || !permissions.canManageServices || serviceMutation.isPending}
                title={
                  isDemo || !permissions.canManageServices ? controlsDisabledReason : undefined
                }
              >
                <Plus className="size-4" />
                {serviceMutation.isPending ? t('catalog.saving') : t('catalog.createService')}
              </button>
            </form>
          </CatalogSection>
        </div>
      </main>
    </div>
  )
}

function CatalogSection({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: typeof Building2
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="panel h-fit">
      <div className="panel-header">
        <div className="flex items-start gap-3">
          <span className="feature-icon shrink-0">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}

function FormField({
  label,
  error,
  children
}: {
  label: string
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-bold">
      <span>{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

function StatusBadge({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${muted ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}
    >
      {label}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-800">
      {text}
    </p>
  )
}
