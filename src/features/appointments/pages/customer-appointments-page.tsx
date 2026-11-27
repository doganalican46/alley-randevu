import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, LogIn, RefreshCw, Star, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import {
  changeAppointmentStatus,
  getCustomerAppointments,
  rescheduleAppointment
} from '@/features/booking/data/booking.repository'
import { submitAppointmentReview } from '@/features/operations/data/operations.repository'
import { PageLoader } from '@/shared/components/page-loader'

export default function CustomerAppointmentsPage() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [nextStart, setNextStart] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewedId, setReviewedId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const appointmentsQuery = useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: () => getCustomerAppointments(user?.id ?? ''),
    enabled: Boolean(user?.id),
    retry: false
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => changeAppointmentStatus(id, 'CANCELLED', 'customer_cancelled'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
      setFeedback(t('appointments.cancelled'))
    },
    onError: () => setFeedback(t('appointments.actionError'))
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, startsAt }: { id: string; startsAt: string }) =>
      rescheduleAppointment(id, startsAt, 'customer_rescheduled'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
      setRescheduleId(null)
      setFeedback(t('appointments.rescheduled'))
    },
    onError: () => setFeedback(t('appointments.rescheduleError'))
  })
  const reviewMutation = useMutation({
    mutationFn: (input: { businessId: string; appointmentId: string }) =>
      submitAppointmentReview({
        ...input,
        customerUserId: user?.id ?? '',
        rating,
        ...(reviewComment.trim() ? { comment: reviewComment } : {})
      }),
    onSuccess: (_, variables) => {
      setReviewedId(variables.appointmentId)
      setReviewId(null)
      setReviewComment('')
      setFeedback(t('reviews.saved'))
    },
    onError: () => setFeedback(t('reviews.error'))
  })

  if (appointmentsQuery.isLoading) return <PageLoader />
  const appointments = appointmentsQuery.data ?? []

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{t('appointments.customerKicker')}</p>
            <h1 className="mt-2 text-3xl font-black">{t('appointments.customerTitle')}</h1>
          </div>
          <Link className="button button-ghost" to="/">
            <LogIn className="size-4" /> {t('appointments.home')}
          </Link>
        </div>
        {searchParams.get('created') && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
            <CheckCircle2 className="size-5" /> {t('appointments.created')}
          </p>
        )}
        {feedback && (
          <p className="mt-4 rounded-2xl bg-indigo-50 p-4 text-sm font-bold text-indigo-800">
            {feedback}
          </p>
        )}
        {appointmentsQuery.isError && (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">
            {t('appointments.loadError')}
          </p>
        )}
        <div className="mt-7 space-y-4">
          {appointments.map((appointment) => {
            const mutable = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
            return (
              <article key={appointment.id} className="panel">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="status-badge status-waiting">
                      {t(`appointments.status.${appointment.status}`)}
                    </span>
                    <h2 className="mt-3 text-lg font-black">{appointment.serviceName}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      }).format(new Date(appointment.startsAt))}
                    </p>
                  </div>
                  <p className="text-lg font-black">
                    {new Intl.NumberFormat(i18n.language, {
                      style: 'currency',
                      currency: appointment.currency
                    }).format(appointment.totalAmount)}
                  </p>
                </div>
                {mutable && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button button-ghost border border-slate-200"
                      onClick={() => cancelMutation.mutate(appointment.id)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="size-4" /> {t('appointments.cancel')}
                    </button>
                    <button
                      type="button"
                      className="button button-ghost border border-slate-200"
                      onClick={() =>
                        setRescheduleId(rescheduleId === appointment.id ? null : appointment.id)
                      }
                    >
                      <RefreshCw className="size-4" /> {t('appointments.reschedule')}
                    </button>
                  </div>
                )}
                {rescheduleId === appointment.id && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="form-input-wrap">
                      <input
                        className="form-input"
                        type="datetime-local"
                        value={nextStart}
                        onChange={(event) => setNextStart(event.target.value)}
                      />
                    </span>
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={!nextStart || rescheduleMutation.isPending}
                      onClick={() =>
                        rescheduleMutation.mutate({
                          id: appointment.id,
                          startsAt: new Date(nextStart).toISOString()
                        })
                      }
                    >
                      {t('appointments.saveReschedule')}
                    </button>
                  </div>
                )}
                {appointment.status === 'COMPLETED' && reviewedId !== appointment.id && (
                  <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                    {reviewId !== appointment.id ? (
                      <button
                        type="button"
                        className="button button-ghost border border-slate-200"
                        onClick={() => setReviewId(appointment.id)}
                      >
                        <Star className="size-4" /> {t('reviews.add')}
                      </button>
                    ) : (
                      <div>
                        <h3 className="font-black">{t('reviews.title')}</h3>
                        <div className="mt-3 flex gap-2" aria-label={t('reviews.rating')}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              className="grid size-11 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800"
                              onClick={() => setRating(value)}
                              aria-label={`${value}`}
                            >
                              <Star className={`size-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                            </button>
                          ))}
                        </div>
                        <label className="mt-4 block">
                          <span className="mb-2 block text-sm font-black">{t('reviews.comment')}</span>
                          <textarea
                            className="form-input-wrap min-h-24 w-full p-3"
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ businessId: appointment.businessId, appointmentId: appointment.id })}
                          >
                            {t('reviews.submit')}
                          </button>
                          <button type="button" className="button button-ghost" onClick={() => setReviewId(null)}>
                            {t('reviews.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
          {appointments.length === 0 && (
            <div className="panel py-12 text-center">
              <CalendarDays className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 font-black">{t('appointments.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
