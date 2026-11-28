import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Gift, Mail, Megaphone, MessageSquareText, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { hasBusinessPermission } from '@/core/permissions/permissions'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import { demoGrowthData } from '@/features/businesses/data/business-demo-data'
import {
  adjustCustomerLoyalty,
  createCampaign,
  getGrowthData,
  queueCampaign,
  type GrowthCustomer
} from '@/features/growth/data/growth.repository'
import { PageLoader } from '@/shared/components/page-loader'

export default function BusinessGrowthPage() {
  const { businessId = '' } = useParams()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isDemo = businessId === 'demo'
  const [message, setMessage] = useState<string | null>(null)
  const growthQuery = useQuery({
    queryKey: ['business-growth', businessId],
    queryFn: () => getGrowthData(businessId),
    enabled: !isDemo,
    retry: false
  })
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId, user?.id ?? ''),
    enabled: !isDemo && Boolean(user?.id),
    retry: false
  })
  const canManage = !isDemo && hasBusinessPermission(membershipQuery.data, 'customers.manage')
  const invalidateGrowth = () =>
    queryClient.invalidateQueries({ queryKey: ['business-growth', businessId] })
  const loyaltyMutation = useMutation({
    mutationFn: adjustCustomerLoyalty,
    onSuccess: (balance) => {
      setMessage(t('growth.loyaltySaved', { balance }))
      void invalidateGrowth()
    }
  })
  const campaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      setMessage(t('growth.campaignCreated'))
      void invalidateGrowth()
    }
  })
  const queueMutation = useMutation({
    mutationFn: queueCampaign,
    onSuccess: (count) => {
      setMessage(t('growth.campaignQueued', { count }))
      void invalidateGrowth()
    }
  })

  if (!isDemo && (growthQuery.isLoading || membershipQuery.isLoading)) return <PageLoader />
  const data = isDemo ? demoGrowthData : (growthQuery.data ?? { customers: [], campaigns: [] })
  const hasError =
    growthQuery.isError ||
    loyaltyMutation.isError ||
    campaignMutation.isError ||
    queueMutation.isError

  function handleLoyalty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const points = Number(form.get('points'))
    const direction = String(form.get('direction')) === 'redeem' ? -1 : 1
    const reason = String(form.get('reason') ?? '').trim()
    const customerId = String(form.get('customerId') ?? '')
    if (!customerId || !Number.isInteger(points) || points <= 0 || reason.length < 2) {
      setMessage(t('growth.invalidLoyalty'))
      return
    }
    loyaltyMutation.mutate({ businessId, customerId, pointsDelta: points * direction, reason })
  }

  function handleCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const channel = String(form.get('channel')) === 'sms' ? 'sms' : 'email'
    const subject = String(form.get('subject') ?? '').trim()
    const body = String(form.get('body') ?? '').trim()
    const audienceTag = String(form.get('audienceTag') ?? '').trim()
    if (name.length < 2 || body.length < 2 || (channel === 'email' && subject.length < 2)) {
      setMessage(t('growth.invalidCampaign'))
      return
    }
    campaignMutation.mutate({
      businessId,
      createdBy: user?.id ?? '',
      name,
      channel,
      body,
      ...(subject ? { subject } : {}),
      ...(audienceTag ? { audienceTag } : {})
    })
    event.currentTarget.reset()
  }

  function exportCustomers() {
    const csv = createCustomerCsv(data.customers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `alley-randevu-musteriler-${businessId}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{t('growth.kicker')}</p>
            <h1 className="mt-2 text-3xl font-black">{t('growth.title')}</h1>
            <p className="mt-2 text-slate-500">{t('growth.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="button button-ghost"
              onClick={exportCustomers}
              disabled={data.customers.length === 0}
            >
              <Download className="size-4" /> {t('growth.exportCsv')}
            </button>
            <Link to={`/business/${businessId}`} className="button button-ghost">
              {t('growth.back')}
            </Link>
          </div>
        </header>

        {message && (
          <p role="status" className="mt-6 rounded-2xl bg-indigo-50 p-4 font-bold text-indigo-700">
            {message}
          </p>
        )}
        {isDemo && (
          <p role="note" className="demo-notice mt-6">
            {t('growth.demoDisabled')}
          </p>
        )}
        {hasError && (
          <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">
            {t('growth.saveError')}
          </p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label={t('growth.customers')} value={data.customers.length} icon={Sparkles} />
          <Metric
            label={t('growth.consenting')}
            value={
              data.customers.filter((customer) => customer.marketingConsent && customer.isActive)
                .length
            }
            icon={Mail}
          />
          <Metric
            label={t('growth.points')}
            value={data.customers.reduce((total, customer) => total + customer.pointsBalance, 0)}
            icon={Gift}
          />
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="text-lg font-black">{t('growth.loyalty')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('growth.loyaltyHint')}</p>
              </div>
              <Gift className="size-5 text-indigo-600" />
            </div>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleLoyalty}>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-black">{t('growth.customer')}</span>
                <select className="form-input-wrap w-full p-3" name="customerId" required>
                  <option value="">{t('growth.chooseCustomer')}</option>
                  {data.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} · {customer.pointsBalance} {t('growth.pointUnit')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">{t('growth.action')}</span>
                <select className="form-input-wrap w-full p-3" name="direction">
                  <option value="earn">{t('growth.earn')}</option>
                  <option value="redeem">{t('growth.redeem')}</option>
                </select>
              </label>
              <Field label={t('growth.amount')} name="points" type="number" min="1" />
              <div className="sm:col-span-2">
                <Field label={t('growth.reason')} name="reason" />
              </div>
              <button
                className="button button-primary sm:col-span-2"
                disabled={!canManage || loyaltyMutation.isPending}
                title={
                  !canManage
                    ? t(isDemo ? 'growth.demoDisabled' : 'growth.permissionDisabled')
                    : undefined
                }
              >
                {loyaltyMutation.isPending ? t('growth.saving') : t('growth.saveLoyalty')}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="text-lg font-black">{t('growth.newCampaign')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('growth.campaignHint')}</p>
              </div>
              <Megaphone className="size-5 text-indigo-600" />
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleCampaign}>
              <Field label={t('growth.campaignName')} name="name" />
              <label>
                <span className="mb-2 block text-sm font-black">{t('growth.channel')}</span>
                <select className="form-input-wrap w-full p-3" name="channel">
                  <option value="email">E-posta</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <Field label={t('growth.subject')} name="subject" />
              <Field
                label={t('growth.audienceTag')}
                name="audienceTag"
                placeholder={t('growth.audienceTagHint')}
              />
              <label>
                <span className="mb-2 block text-sm font-black">{t('growth.message')}</span>
                <textarea className="form-input-wrap min-h-28 w-full p-3" name="body" required />
              </label>
              <button
                className="button button-primary w-full"
                disabled={!canManage || campaignMutation.isPending}
                title={
                  !canManage
                    ? t(isDemo ? 'growth.demoDisabled' : 'growth.permissionDisabled')
                    : undefined
                }
              >
                {campaignMutation.isPending ? t('growth.saving') : t('growth.createDraft')}
              </button>
            </form>
          </section>
        </div>

        <section className="panel mt-6">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-black">{t('growth.campaigns')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('growth.providerMissing')}</p>
            </div>
            <MessageSquareText className="size-5 text-amber-500" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{campaign.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {campaign.channel.toUpperCase()} ·{' '}
                      {campaign.audienceTag ?? t('growth.allConsenting')}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${campaign.status === 'queued' ? 'status-confirmed' : 'status-waiting'}`}
                  >
                    {campaign.status === 'queued' ? t('growth.queued') : t('growth.draft')}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  {campaign.status === 'queued'
                    ? t('growth.recipientCount', { count: campaign.recipientCount })
                    : new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
                        new Date(campaign.createdAt)
                      )}
                </p>
                <button
                  type="button"
                  className="button button-ghost mt-4 w-full"
                  disabled={!canManage || campaign.status !== 'draft' || queueMutation.isPending}
                  title={
                    !canManage
                      ? t(isDemo ? 'growth.demoDisabled' : 'growth.permissionDisabled')
                      : undefined
                  }
                  onClick={() => queueMutation.mutate(campaign.id)}
                >
                  {t('growth.queueCampaign')}
                </button>
              </article>
            ))}
          </div>
          {data.campaigns.length === 0 && (
            <p className="py-10 text-center text-slate-500">{t('growth.emptyCampaigns')}</p>
          )}
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Gift }) {
  return (
    <div className="panel flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black">{value}</p>
      </div>
      <span className="grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
        <Icon className="size-5" />
      </span>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  min,
  placeholder
}: {
  label: string
  name: string
  type?: string
  min?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <span className="form-input-wrap">
        <input
          className="form-input"
          name={name}
          type={type}
          min={min}
          placeholder={placeholder}
          required={name !== 'subject' && name !== 'audienceTag'}
        />
      </span>
    </label>
  )
}

function createCustomerCsv(customers: GrowthCustomer[]): string {
  const escape = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`
  const rows = customers.map((customer) => [
    customer.fullName,
    customer.email ?? '',
    customer.phone ?? '',
    customer.tags.join('|'),
    customer.marketingConsent,
    customer.isActive,
    customer.pointsBalance,
    customer.lifetimeEarned
  ])
  return [
    '\uFEFF' +
      [
        'Ad Soyad',
        'E-posta',
        'Telefon',
        'Etiketler',
        'Pazarlama İzni',
        'Aktif',
        'Puan',
        'Toplam Kazanılan'
      ]
        .map(escape)
        .join(','),
    ...rows.map((row) => row.map(escape).join(','))
  ].join('\r\n')
}
