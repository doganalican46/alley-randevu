import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, CreditCard, MessageSquareText, TrendingUp } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { hasBusinessPermission } from '@/core/permissions/permissions'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import {
  createPayment,
  getBusinessOperations,
  setReviewPublished
} from '@/features/operations/data/operations.repository'
import type { Database } from '@/integrations/supabase/database.types'
import { PageLoader } from '@/shared/components/page-loader'

type PaymentMethod = Database['public']['Enums']['payment_method']

export default function BusinessOperationsPage() {
  const { businessId = '' } = useParams()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const operationsQuery = useQuery({
    queryKey: ['business-operations', businessId],
    queryFn: () => getBusinessOperations(businessId),
    retry: false
  })
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId, user?.id ?? ''),
    enabled: Boolean(user?.id),
    retry: false
  })
  const canManageBilling = hasBusinessPermission(membershipQuery.data, 'billing.manage')
  const canManageSettings = hasBusinessPermission(membershipQuery.data, 'settings.manage')
  const paymentMutation = useMutation({
    mutationFn: (input: { amount: number; currency: string; method: PaymentMethod }) =>
      createPayment({ businessId, createdBy: user?.id ?? '', ...input }),
    onSuccess: () => {
      setFeedback(t('operations.paymentSaved'))
      void queryClient.invalidateQueries({ queryKey: ['business-operations', businessId] })
    }
  })
  const reviewMutation = useMutation({
    mutationFn: ({ reviewId, isPublished }: { reviewId: string; isPublished: boolean }) =>
      setReviewPublished(reviewId, isPublished),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['business-operations', businessId] })
  })

  function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const amount = Number(data.get('amount'))
    const currency = String(data.get('currency') ?? 'TRY')
    const method = String(data.get('method') ?? 'cash') as PaymentMethod
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback(t('operations.invalidAmount'))
      return
    }
    paymentMutation.mutate({ amount, currency, method })
    event.currentTarget.reset()
  }

  if (operationsQuery.isLoading || membershipQuery.isLoading) return <PageLoader />
  if (operationsQuery.isError || !operationsQuery.data) {
    return <main className="grid min-h-dvh place-items-center"><p>{t('operations.loadError')}</p></main>
  }
  const data = operationsQuery.data
  const money = (value: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'TRY' }).format(value)

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{t('operations.kicker')}</p>
            <h1 className="mt-2 text-3xl font-black">{t('operations.title')}</h1>
            <p className="mt-2 text-slate-500">{t('operations.description')}</p>
          </div>
          <Link to={`/business/${businessId}`} className="button button-ghost">{t('operations.back')}</Link>
        </header>

        {feedback && <p role="status" className="mt-6 rounded-2xl bg-indigo-50 p-4 font-bold text-indigo-700">{feedback}</p>}
        {(paymentMutation.isError || reviewMutation.isError) && <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">{t('operations.saveError')}</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={TrendingUp} label={t('operations.appointments')} value={String(data.report.appointmentCount)} />
          <Metric icon={TrendingUp} label={t('operations.completed')} value={String(data.report.completedCount)} />
          <Metric icon={CreditCard} label={t('operations.revenue')} value={money(data.report.appointmentRevenue)} />
          <Metric icon={MessageSquareText} label={t('operations.rating')} value={data.report.averageRating?.toFixed(1) ?? '—'} />
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="panel h-fit">
            <div className="panel-header"><div><h2 className="text-lg font-black">{t('operations.addPayment')}</h2><p className="mt-1 text-sm text-slate-500">{t('operations.collected', { amount: money(data.report.collectedAmount) })}</p></div><CreditCard className="size-5 text-indigo-600" /></div>
            <form className="mt-5 space-y-4" onSubmit={handlePayment}>
              <label className="block"><span className="mb-2 block text-sm font-black">{t('operations.amount')}</span><span className="form-input-wrap"><input className="form-input" name="amount" type="number" min="0.01" step="0.01" required /></span></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="mb-2 block text-sm font-black">{t('operations.currency')}</span><span className="form-input-wrap"><select className="form-input" name="currency" defaultValue="TRY"><option>TRY</option><option>EUR</option><option>USD</option></select></span></label>
                <label><span className="mb-2 block text-sm font-black">{t('operations.method')}</span><span className="form-input-wrap"><select className="form-input" name="method" defaultValue="cash"><option value="cash">{t('operations.methods.cash')}</option><option value="card">{t('operations.methods.card')}</option><option value="bank_transfer">{t('operations.methods.bank_transfer')}</option><option value="other">{t('operations.methods.other')}</option></select></span></label>
              </div>
              <button className="button button-primary w-full" disabled={!canManageBilling || paymentMutation.isPending} title={!canManageBilling ? t('operations.billingPermission') : undefined}>{t('operations.savePayment')}</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header"><div><h2 className="text-lg font-black">{t('operations.notificationQueue')}</h2><p className="mt-1 text-sm text-slate-500">{t('operations.providerMissing')}</p></div><BellRing className="size-5 text-indigo-600" /></div>
            <div className="mt-4 space-y-3">
              {data.outbox.map((entry) => <article key={entry.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-center justify-between gap-4"><p className="font-black">{t(`operations.events.${entry.eventKey}`, { defaultValue: entry.eventKey })}</p><span className="status-badge status-waiting">{t(`operations.queueStatus.${entry.status}`)}</span></div><p className="mt-2 text-sm text-slate-500">{entry.channel} · {entry.recipient}</p></article>)}
              {data.outbox.length === 0 && <p className="py-8 text-center text-slate-500">{t('operations.noNotifications')}</p>}
            </div>
            <button className="button button-ghost mt-4 border border-slate-200" disabled title={t('operations.providerMissing')}>{t('operations.sendNow')}</button>
          </section>
        </div>

        <section className="panel mt-8">
          <div className="panel-header"><div><h2 className="text-lg font-black">{t('operations.reviews')}</h2><p className="mt-1 text-sm text-slate-500">{t('operations.reviewsHint')}</p></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {data.reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><div className="flex justify-between gap-4"><p className="font-black">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p><button type="button" className="text-sm font-bold text-indigo-600" disabled={!canManageSettings || reviewMutation.isPending} onClick={() => reviewMutation.mutate({ reviewId: review.id, isPublished: !review.isPublished })}>{review.isPublished ? t('operations.unpublish') : t('operations.publish')}</button></div><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{review.comment ?? t('operations.noComment')}</p></article>)}
            {data.reviews.length === 0 && <p className="py-8 text-slate-500">{t('operations.noReviews')}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return <article className="panel !p-5"><Icon className="size-5 text-indigo-600" /><p className="mt-5 text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>
}
