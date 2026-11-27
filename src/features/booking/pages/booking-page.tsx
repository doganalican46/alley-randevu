import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { ArrowLeft, Building2, CalendarDays, Check, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { env } from '@/core/config/env'
import { useAuth } from '@/features/auth/auth-context'
import {
  createCustomerAppointment,
  getAvailability,
  type AvailabilitySlot
} from '@/features/booking/data/booking.repository'
import { demoBusiness } from '@/features/booking/data/demo-business'
import { getPublicBusiness } from '@/features/booking/data/public-business.repository'
import { bookingContactSchema, type BookingContact } from '@/features/booking/model/booking.schema'
import {
  demoPublicBusiness,
  formatServicePrice,
  type PublicBusinessProfile
} from '@/features/booking/model/public-business'
import { PageLoader } from '@/shared/components/page-loader'

const demoTimeSlots = ['09:30', '10:00', '11:30', '13:00', '14:30', '16:00'] as const

export default function BookingPage() {
  const { slug = '' } = useParams()
  const isDemo = slug === demoBusiness.slug
  const businessQuery = useQuery({
    queryKey: ['public-business', slug],
    queryFn: () => getPublicBusiness(slug),
    enabled: env.isSupabaseConfigured && !isDemo && Boolean(slug),
    retry: false
  })
  const business = isDemo ? demoPublicBusiness : businessQuery.data

  if (!isDemo && businessQuery.isLoading) return <PageLoader />
  if (!isDemo && (!env.isSupabaseConfigured || businessQuery.isError || !business)) {
    return <BookingUnavailable slug={slug} />
  }
  if (!business) return <BookingUnavailable slug={slug} />
  return <BookingExperience business={business} />
}

function BookingExperience({ business }: { business: PublicBusinessProfile }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [serviceId, setServiceId] = useState(business.services[0]?.id ?? '')
  const [branchId, setBranchId] = useState(business.branches[0]?.id ?? '')
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [staffId, setStaffId] = useState('any')
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [demoTime, setDemoTime] = useState('10:00')
  const [contact, setContact] = useState<BookingContact>({
    name: '',
    phone: '',
    email: user?.email ?? '',
    notes: ''
  })
  const [formError, setFormError] = useState('')

  useEffect(() => setSelectedSlot(null), [branchId, date, serviceId, staffId])

  const availabilityQuery = useQuery({
    queryKey: ['availability', business.slug, branchId, serviceId, date],
    queryFn: () => getAvailability(business.slug, branchId, serviceId, date),
    enabled: !business.isDemo && Boolean(branchId && serviceId && date),
    retry: false
  })
  const slots = availabilityQuery.data ?? []
  const staffOptions = useMemo(
    () => Array.from(new Map(slots.map((slot) => [slot.staffId, slot.staffName])).entries()),
    [slots]
  )
  const visibleSlots = staffId === 'any' ? slots : slots.filter((slot) => slot.staffId === staffId)
  const selectedService = business.services.find((item) => item.id === serviceId)
  const selectedBranch = business.branches.find((item) => item.id === branchId)

  const bookingMutation = useMutation({
    mutationFn: () => {
      const parsed = bookingContactSchema.safeParse(contact)
      if (!parsed.success || !selectedSlot) throw new Error('validation')
      return createCustomerAppointment({
        businessSlug: business.slug,
        branchId,
        serviceId,
        slot: selectedSlot,
        contact: parsed.data
      })
    },
    onSuccess: (appointmentId) => {
      void queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
      window.location.assign(`/app/appointments?created=${appointmentId}`)
    },
    onError: () => setFormError(t('booking.createError'))
  })

  function submitBooking() {
    if (!user) return setFormError(t('booking.signInRequired'))
    if (!selectedSlot || !bookingContactSchema.safeParse(contact).success) {
      return setFormError(t('booking.contactInvalid'))
    }
    setFormError('')
    bookingMutation.mutate()
  }

  const slotTime = (slot: AvailabilitySlot) =>
    new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: business.timezone
    }).format(new Date(slot.startsAt))

  return (
    <section className="px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          to={`/b/${business.slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300"
        >
          <ArrowLeft className="size-4" /> {t('booking.back')}
        </Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <header>
              <span className="demo-pill">
                {business.isDemo ? t('booking.demoBadge') : t('booking.liveCatalogBadge')}
              </span>
              <h1 className="mt-3 text-3xl font-black">{t('booking.title')}</h1>
              <p className="mt-2 text-slate-500">{business.name}</p>
            </header>

            <BookingSection icon={Check} title={t('booking.chooseService')}>
              <div className="grid gap-3 sm:grid-cols-3">
                {business.services.map((service) => (
                  <ChoiceButton
                    key={service.id}
                    active={serviceId === service.id}
                    onClick={() => setServiceId(service.id)}
                    title={service.name}
                    detail={`${t('booking.duration', { count: service.durationMinutes })} · ${formatServicePrice(service, i18n.language)}`}
                  />
                ))}
                {business.services.length === 0 && (
                  <EmptySelection text={t('booking.noServices')} />
                )}
              </div>
            </BookingSection>

            <BookingSection icon={Building2} title={t('booking.chooseBranch')}>
              <div className="grid gap-3 sm:grid-cols-3">
                {business.branches.map((branch) => (
                  <ChoiceButton
                    key={branch.id}
                    active={branchId === branch.id}
                    onClick={() => setBranchId(branch.id)}
                    title={branch.name}
                    detail={branch.addressLine || t('booking.onlineOrUnspecified')}
                  />
                ))}
                {business.branches.length === 0 && (
                  <EmptySelection text={t('booking.noBranches')} />
                )}
              </div>
            </BookingSection>

            <BookingSection icon={CalendarDays} title={t('booking.dateAndTime')}>
              {business.isDemo ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {demoTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot ${demoTime === slot ? 'time-slot-active' : ''}`}
                      onClick={() => setDemoTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <label className="mb-5 block max-w-xs">
                    <span className="mb-2 block text-sm font-bold">{t('booking.chooseDate')}</span>
                    <span className="form-input-wrap">
                      <input
                        className="form-input"
                        type="date"
                        min={format(new Date(), 'yyyy-MM-dd')}
                        max={format(addDays(new Date(), business.maximumBookingDays), 'yyyy-MM-dd')}
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </span>
                  </label>
                  {availabilityQuery.isLoading && (
                    <p className="text-sm text-slate-500">{t('booking.loadingAvailability')}</p>
                  )}
                  {availabilityQuery.isError && (
                    <p className="text-sm font-bold text-red-600">
                      {t('booking.availabilityError')}
                    </p>
                  )}
                  {!availabilityQuery.isLoading &&
                    !availabilityQuery.isError &&
                    slots.length === 0 && <EmptySelection text={t('booking.noAvailability')} />}
                  {slots.length > 0 && (
                    <>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`button ${staffId === 'any' ? 'button-primary' : 'button-ghost'}`}
                          onClick={() => setStaffId('any')}
                        >
                          {t('booking.firstAvailable')}
                        </button>
                        {staffOptions.map(([id, name]) => (
                          <button
                            key={id}
                            type="button"
                            className={`button ${staffId === id ? 'button-primary' : 'button-ghost'}`}
                            onClick={() => setStaffId(id)}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {visibleSlots.map((slot) => (
                          <button
                            key={`${slot.staffId}-${slot.startsAt}`}
                            type="button"
                            className={`time-slot ${selectedSlot?.staffId === slot.staffId && selectedSlot.startsAt === slot.startsAt ? 'time-slot-active' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slotTime(slot)}
                            <span className="block text-[10px]">{slot.staffName}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </BookingSection>

            {!business.isDemo && (
              <BookingSection icon={UserRound} title={t('booking.contactTitle')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ContactInput
                    label={t('booking.name')}
                    value={contact.name}
                    onChange={(name) => setContact({ ...contact, name })}
                  />
                  <ContactInput
                    label={t('booking.email')}
                    type="email"
                    value={contact.email}
                    onChange={(email) => setContact({ ...contact, email })}
                  />
                  <ContactInput
                    label={t('booking.phone')}
                    value={contact.phone}
                    onChange={(phone) => setContact({ ...contact, phone })}
                  />
                  <ContactInput
                    label={t('booking.notes')}
                    value={contact.notes}
                    onChange={(notes) => setContact({ ...contact, notes })}
                  />
                </div>
                {!user && (
                  <p className="mt-4 text-sm font-bold text-amber-700">
                    {t('booking.signInRequired')}{' '}
                    <Link className="text-indigo-600 underline" to="/login">
                      {t('booking.signIn')}
                    </Link>
                  </p>
                )}
              </BookingSection>
            )}
          </div>

          <aside className="panel h-fit lg:sticky lg:top-28">
            <h2 className="text-lg font-black">{t('booking.summary')}</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <SummaryRow label={t('booking.service')} value={selectedService?.name ?? '—'} />
              <SummaryRow label={t('booking.branch')} value={selectedBranch?.name ?? '—'} />
              <SummaryRow
                label={t('booking.staff')}
                value={selectedSlot?.staffName ?? t('booking.firstAvailable')}
              />
              <SummaryRow
                label={t('booking.date')}
                value={business.isDemo ? t('booking.demoDateShort') : date}
              />
              <SummaryRow
                label={t('booking.time')}
                value={business.isDemo ? demoTime : selectedSlot ? slotTime(selectedSlot) : '—'}
              />
            </dl>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-700">
              <span className="font-bold">{t('booking.total')}</span>
              <span className="text-2xl font-black text-indigo-600">
                {selectedService ? formatServicePrice(selectedService, i18n.language) : '—'}
              </span>
            </div>
            <button
              type="button"
              className="button button-primary button-large mt-6 w-full"
              disabled={business.isDemo || !selectedSlot || bookingMutation.isPending}
              onClick={submitBooking}
            >
              {bookingMutation.isPending ? t('booking.creating') : t('booking.confirm')}
            </button>
            {business.isDemo && (
              <p className="mt-3 text-center text-xs text-amber-700">
                {t('booking.demoWriteDisabled')}
              </p>
            )}
            {formError && <p className="mt-3 text-sm font-bold text-red-600">{formError}</p>}
          </aside>
        </div>
      </div>
    </section>
  )
}

function BookingUnavailable({ slug }: { slug: string }) {
  const { t } = useTranslation()
  return (
    <section className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div>
        <CalendarDays className="mx-auto size-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-black">{t('booking.unavailableTitle')}</h1>
        <p className="mt-3 text-slate-500">{t('booking.unavailableDescription')}</p>
        <Link to={`/b/${slug}`} className="button button-primary mt-6">
          {t('booking.back')}
        </Link>
      </div>
    </section>
  )
}

function BookingSection({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Check
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="panel">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-black">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
          <Icon className="size-5" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}
function ChoiceButton({
  active,
  onClick,
  title,
  detail
}: {
  active: boolean
  onClick: () => void
  title: string
  detail: string
}) {
  return (
    <button
      type="button"
      className={`choice-card ${active ? 'choice-card-active' : ''}`}
      onClick={onClick}
    >
      <span className="font-black">{title}</span>
      <span className="mt-2 text-sm text-slate-500">{detail}</span>
    </button>
  )
}
function ContactInput({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <span className="form-input-wrap">
        <input
          className="form-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  )
}
function EmptySelection({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800">{text}</p>
  )
}
