import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Flag, ScrollText, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import {
  assignBusinessPlan,
  getPlatformSnapshot,
  setBusinessFeatureFlag,
  updatePlatformBusinessStatus
} from '@/features/platform/data/platform.repository'
import type { Database } from '@/integrations/supabase/database.types'
import { BrandMark } from '@/shared/components/brand-mark'
import { PageLoader } from '@/shared/components/page-loader'

type BusinessStatus = Database['public']['Enums']['business_status']

export default function PlatformDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const snapshotQuery = useQuery({
    queryKey: ['platform-snapshot'],
    queryFn: getPlatformSnapshot,
    retry: false
  })
  const statusMutation = useMutation({
    mutationFn: ({ businessId, status }: { businessId: string; status: BusinessStatus }) =>
      updatePlatformBusinessStatus(businessId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-snapshot'] })
  })
  const planMutation = useMutation({
    mutationFn: ({ businessId, planId }: { businessId: string; planId: string }) =>
      assignBusinessPlan(businessId, planId, user?.id ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-snapshot'] })
  })
  const flagMutation = useMutation({
    mutationFn: ({
      businessId,
      featureFlagId,
      enabled
    }: {
      businessId: string
      featureFlagId: string
      enabled: boolean
    }) => setBusinessFeatureFlag(businessId, featureFlagId, enabled, user?.id ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-snapshot'] })
  })

  if (snapshotQuery.isLoading) return <PageLoader />
  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <PlatformMessage title={t('platform.loadError')} description={t('platform.loadErrorHint')} />
    )
  }

  const snapshot = snapshotQuery.data
  const activeBusinesses = snapshot.businesses.filter(
    (business) => business.status === 'active'
  ).length

  return (
    <main className="min-h-dvh bg-slate-950 px-5 py-8 text-slate-100 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark />
            <p className="section-kicker mt-6">{t('platform.kicker')}</p>
            <h1 className="mt-2 text-3xl font-black">{t('platform.title')}</h1>
            <p className="mt-2 max-w-2xl text-slate-400">{t('platform.description')}</p>
          </div>
          <Link to="/" className="button border border-slate-700 text-slate-200">
            {t('platform.back')}
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformMetric
            icon={Building2}
            label={t('platform.businesses')}
            value={snapshot.businesses.length}
          />
          <PlatformMetric
            icon={ShieldCheck}
            label={t('platform.activeBusinesses')}
            value={activeBusinesses}
          />
          <PlatformMetric
            icon={Flag}
            label={t('platform.flags')}
            value={snapshot.featureFlags.length}
          />
          <PlatformMetric
            icon={ScrollText}
            label={t('platform.auditEvents')}
            value={snapshot.auditLogs.length}
          />
        </section>

        {(statusMutation.isError || planMutation.isError || flagMutation.isError) && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-rose-800 bg-rose-950/60 p-4 text-rose-200"
          >
            {t('platform.saveError')}
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-black">{t('platform.businessManagement')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('platform.businessManagementHint')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="px-6 py-4">{t('platform.business')}</th>
                  <th className="px-6 py-4">{t('platform.status')}</th>
                  <th className="px-6 py-4">{t('platform.plan')}</th>
                  <th className="px-6 py-4">{t('platform.createdAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {snapshot.businesses.map((business) => (
                  <tr key={business.id}>
                    <td className="px-6 py-5">
                      <p className="font-black">{business.name}</p>
                      <p className="mt-1 text-slate-500">/{business.slug}</p>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                        value={business.status}
                        disabled={statusMutation.isPending}
                        aria-label={t('platform.status')}
                        onChange={(event) =>
                          statusMutation.mutate({
                            businessId: business.id,
                            status: event.target.value as BusinessStatus
                          })
                        }
                      >
                        {(['draft', 'active', 'suspended', 'archived'] as const).map((status) => (
                          <option key={status} value={status}>
                            {t(`platform.statuses.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                        value={business.subscription?.planId ?? ''}
                        disabled={planMutation.isPending}
                        aria-label={t('platform.plan')}
                        onChange={(event) => {
                          if (event.target.value) {
                            planMutation.mutate({
                              businessId: business.id,
                              planId: event.target.value
                            })
                          }
                        }}
                      >
                        <option value="">{t('platform.noPlan')}</option>
                        {snapshot.plans
                          .filter((plan) => plan.isActive)
                          .map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} · {plan.monthlyPrice} {plan.currency}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-6 py-5 text-slate-400">
                      {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(
                        new Date(business.createdAt)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {snapshot.businesses.length === 0 && (
            <p className="p-8 text-center text-slate-400">{t('platform.empty')}</p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-black">{t('platform.featureAssignments')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('platform.featureAssignmentsHint')}</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {snapshot.businesses.map((business) => (
              <article key={business.id} className="rounded-2xl bg-slate-950/70 p-5">
                <p className="font-black">{business.name}</p>
                <div className="mt-4 space-y-3">
                  {snapshot.featureFlags
                    .filter((flag) => flag.isActive)
                    .map((flag) => {
                      const assignment = snapshot.featureAssignments.find(
                        (item) => item.businessId === business.id && item.featureFlagId === flag.id
                      )
                      return (
                        <label
                          key={flag.id}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <span className="font-bold text-slate-300">{flag.label}</span>
                          <input
                            type="checkbox"
                            className="size-5 accent-indigo-500"
                            checked={assignment?.enabled ?? false}
                            disabled={flagMutation.isPending}
                            onChange={(event) =>
                              flagMutation.mutate({
                                businessId: business.id,
                                featureFlagId: flag.id,
                                enabled: event.target.checked
                              })
                            }
                          />
                        </label>
                      )
                    })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-black">{t('platform.featureFlags')}</h2>
            <div className="mt-5 space-y-3">
              {snapshot.featureFlags.map((flag) => (
                <article key={flag.id} className="rounded-2xl bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-black">{flag.label}</p>
                    <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                      {flag.isActive ? t('platform.enabled') : t('platform.disabled')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{flag.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-black">{t('platform.auditLog')}</h2>
            <div className="mt-5 space-y-3">
              {snapshot.auditLogs.map((entry) => (
                <article key={entry.id} className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="font-bold">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat('tr-TR', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(entry.createdAt))}
                  </p>
                </article>
              ))}
              {snapshot.auditLogs.length === 0 && (
                <p className="text-sm text-slate-400">{t('platform.noAudit')}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function PlatformMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Building2
  label: string
  value: number
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <Icon className="size-5 text-indigo-400" />
      <p className="mt-5 text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  )
}

function PlatformMessage({ title, description }: { title: string; description: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-5 text-slate-100">
      <div className="max-w-md text-center">
        <ShieldCheck className="mx-auto size-10 text-indigo-400" />
        <h1 className="mt-4 text-2xl font-black">{title}</h1>
        <p className="mt-3 text-slate-400">{description}</p>
      </div>
    </main>
  )
}
