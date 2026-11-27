import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { appointmentTransitions, type AppointmentStatus } from '@/core/domain/appointment-status'
import {
  changeAppointmentStatus,
  getBusinessAppointments
} from '@/features/booking/data/booking.repository'
import { PageLoader } from '@/shared/components/page-loader'

export default function BusinessAppointmentsPage() {
  const { businessId = '' } = useParams()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const appointmentsQuery = useQuery({
    queryKey: ['business-appointments', businessId],
    queryFn: () => getBusinessAppointments(businessId),
    enabled: businessId !== 'demo',
    retry: false
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      changeAppointmentStatus(id, status, 'business_status_change'),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['business-appointments', businessId] })
  })
  if (businessId !== 'demo' && appointmentsQuery.isLoading) return <PageLoader />
  const appointments = businessId === 'demo' ? [] : (appointmentsQuery.data ?? [])
  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"
          to={`/business/${businessId}`}
        >
          <ArrowLeft className="size-4" /> {t('appointments.back')}
        </Link>
        <header className="mt-6">
          <p className="section-kicker">{t('appointments.businessKicker')}</p>
          <h1 className="mt-2 text-3xl font-black">{t('appointments.businessTitle')}</h1>
          <p className="mt-2 text-slate-500">{t('appointments.businessDescription')}</p>
        </header>
        {businessId === 'demo' && (
          <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
            {t('appointments.demoDisabled')}
          </p>
        )}
        {appointmentsQuery.isError && (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">
            {t('appointments.loadError')}
          </p>
        )}
        <div className="mt-7 space-y-4">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="panel">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="status-badge status-waiting">
                    {t(`appointments.status.${appointment.status}`)}
                  </span>
                  <h2 className="mt-2 text-lg font-black">{appointment.customerName}</h2>
                  <p className="text-sm text-slate-500">
                    {appointment.serviceName} ·{' '}
                    {new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(appointment.startsAt))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appointmentTransitions[appointment.status].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="button button-ghost border border-slate-200"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: appointment.id, status })}
                    >
                      {t(`appointments.actions.${status}`)}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
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
