import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BriefcaseBusiness,
  Clock3,
  Plus,
  Power,
  Trash2,
  UserRoundPlus,
  UsersRound
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import type { Branch, Service } from '@/features/catalog/data/catalog.repository'
import {
  createStaff,
  deleteWorkingHour,
  getTeamSetup,
  replaceStaffServices,
  saveWorkingHour,
  setStaffActive,
  type StaffProfile,
  type StaffWorkingHour,
  type TeamSetup
} from '@/features/team/data/team.repository'
import { canManageTeam } from '@/features/team/model/team-permissions'
import {
  staffSchema,
  workingHourSchema,
  type StaffFormValues,
  type WorkingHourFormValues
} from '@/features/team/model/team.schema'
import { BrandMark } from '@/shared/components/brand-mark'
import { PageLoader } from '@/shared/components/page-loader'

const demoBranch: Branch = {
  id: 'demo-branch',
  business_id: 'demo',
  name: 'Merkez Şube',
  slug: 'merkez',
  address_line: 'Kadıköy, İstanbul',
  phone: null,
  timezone: 'Europe/Istanbul',
  is_primary: true,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

const demoService: Service = {
  id: 'demo-service',
  business_id: 'demo',
  name: 'Saç & sakal',
  description: null,
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

const demoStaff: StaffProfile = {
  id: 'demo-staff',
  business_id: 'demo',
  user_id: null,
  display_name: 'Aslı Demir',
  title: 'Kıdemli uzman',
  is_bookable: true,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

const demoHour: StaffWorkingHour = {
  id: 'demo-hour',
  business_id: 'demo',
  branch_id: 'demo-branch',
  staff_id: 'demo-staff',
  weekday: 1,
  starts_at: '09:00:00',
  ends_at: '18:00:00',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

const demoSetup: TeamSetup = {
  branches: [demoBranch],
  services: [demoService],
  staff: [demoStaff],
  staffServices: [
    {
      business_id: 'demo',
      staff_id: 'demo-staff',
      service_id: 'demo-service',
      created_at: '2026-01-01T00:00:00.000Z'
    }
  ],
  workingHours: [demoHour]
}

export default function TeamPage() {
  const { businessId = '' } = useParams()
  const { user } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const isDemo = businessId === 'demo'
  const teamKey = ['business-team', businessId]
  const teamQuery = useQuery({
    queryKey: teamKey,
    queryFn: () => getTeamSetup(businessId),
    enabled: !isDemo,
    retry: false
  })
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId, user?.id ?? ''),
    enabled: !isDemo && Boolean(user?.id),
    retry: false
  })
  const setup = isDemo ? demoSetup : teamQuery.data
  const canManage = !isDemo && canManageTeam(membershipQuery.data)
  const disabledReason = isDemo ? t('team.demoDisabled') : t('team.permissionDisabled')
  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { displayName: '', title: '' }
  })
  const refreshTeam = async () => queryClient.invalidateQueries({ queryKey: teamKey })

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: async () => {
      staffForm.reset()
      setFeedback(t('team.staffCreated'))
      await refreshTeam()
    },
    onError: () => setFeedback(t('team.saveError'))
  })
  const statusMutation = useMutation({
    mutationFn: (input: { staffId: string; isActive: boolean }) =>
      setStaffActive(businessId, input.staffId, input.isActive),
    onSuccess: async () => {
      setFeedback(t('team.statusUpdated'))
      await refreshTeam()
    },
    onError: () => setFeedback(t('team.saveError'))
  })
  const servicesMutation = useMutation({
    mutationFn: (input: { staffId: string; serviceIds: string[] }) =>
      replaceStaffServices(businessId, input.staffId, input.serviceIds),
    onSuccess: async () => {
      setFeedback(t('team.servicesUpdated'))
      await refreshTeam()
    },
    onError: () => setFeedback(t('team.saveError'))
  })
  const hourMutation = useMutation({
    mutationFn: (input: WorkingHourFormValues & { staffId: string }) =>
      saveWorkingHour({
        businessId,
        staffId: input.staffId,
        branchId: input.branchId,
        weekday: Number(input.weekday),
        startsAt: input.startsAt,
        endsAt: input.endsAt
      }),
    onSuccess: async () => {
      setFeedback(t('team.hourSaved'))
      await refreshTeam()
    },
    onError: () => setFeedback(t('team.saveError'))
  })
  const deleteHourMutation = useMutation({
    mutationFn: (hourId: string) => deleteWorkingHour(businessId, hourId),
    onSuccess: async () => {
      setFeedback(t('team.hourRemoved'))
      await refreshTeam()
    },
    onError: () => setFeedback(t('team.saveError'))
  })

  if (!isDemo && (teamQuery.isLoading || membershipQuery.isLoading)) return <PageLoader />

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <BrandMark />
          <Link
            to={`/business/${businessId}`}
            className="button button-ghost border border-slate-200 dark:border-slate-700"
          >
            {t('team.backToDashboard')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="max-w-3xl">
          <p className="section-kicker">{t('team.kicker')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t('team.title')}</h1>
          <p className="mt-3 text-slate-500">{t('team.description')}</p>
        </div>

        {isDemo && <Notice text={t('team.demoDisabled')} tone="warning" />}
        {feedback && <Notice text={feedback} tone="info" />}
        {!isDemo && (teamQuery.isError || membershipQuery.isError) && (
          <Notice text={t('team.loadError')} tone="error" />
        )}

        <section className="panel mt-8">
          <div className="panel-header">
            <div>
              <h2 className="text-lg font-black">{t('team.addStaff')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('team.addStaffDescription')}</p>
            </div>
            <UserRoundPlus className="size-6 text-indigo-500" />
          </div>
          <form
            className="grid gap-4 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={staffForm.handleSubmit((values) =>
              createMutation.mutate({ businessId, ...values })
            )}
          >
            <FormField
              label={t('team.name')}
              error={staffForm.formState.errors.displayName ? t('team.invalidField') : undefined}
            >
              <input className="form-input-wrap w-full" {...staffForm.register('displayName')} />
            </FormField>
            <FormField label={t('team.titleField')}>
              <input className="form-input-wrap w-full" {...staffForm.register('title')} />
            </FormField>
            <button
              type="submit"
              className="button button-primary"
              disabled={!canManage || createMutation.isPending}
              title={!canManage ? disabledReason : undefined}
            >
              <Plus className="size-4" />
              {createMutation.isPending ? t('team.saving') : t('team.createStaff')}
            </button>
          </form>
        </section>

        <div className="mt-8 space-y-6">
          {setup?.staff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              services={setup.services}
              branches={setup.branches}
              assignedServiceIds={setup.staffServices
                .filter((item) => item.staff_id === staff.id)
                .map((item) => item.service_id)}
              hours={setup.workingHours.filter((hour) => hour.staff_id === staff.id)}
              canManage={canManage}
              disabledReason={disabledReason}
              isSaving={
                statusMutation.isPending ||
                servicesMutation.isPending ||
                hourMutation.isPending ||
                deleteHourMutation.isPending
              }
              onStatusChange={(isActive) => statusMutation.mutate({ staffId: staff.id, isActive })}
              onServicesSave={(serviceIds) =>
                servicesMutation.mutate({ staffId: staff.id, serviceIds })
              }
              onHourSave={(values) => hourMutation.mutate({ staffId: staff.id, ...values })}
              onHourDelete={(hourId) => deleteHourMutation.mutate(hourId)}
            />
          ))}
          {setup?.staff.length === 0 && (
            <div className="panel py-12 text-center">
              <UsersRound className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 font-black">{t('team.noStaff')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StaffCard({
  staff,
  services,
  branches,
  assignedServiceIds,
  hours,
  canManage,
  disabledReason,
  isSaving,
  onStatusChange,
  onServicesSave,
  onHourSave,
  onHourDelete
}: {
  staff: StaffProfile
  services: Service[]
  branches: Branch[]
  assignedServiceIds: string[]
  hours: StaffWorkingHour[]
  canManage: boolean
  disabledReason: string
  isSaving: boolean
  onStatusChange: (isActive: boolean) => void
  onServicesSave: (serviceIds: string[]) => void
  onHourSave: (values: WorkingHourFormValues) => void
  onHourDelete: (hourId: string) => void
}) {
  const { t } = useTranslation()
  const [selectedServiceIds, setSelectedServiceIds] = useState(assignedServiceIds)
  useEffect(() => setSelectedServiceIds(assignedServiceIds), [assignedServiceIds])
  const hourForm = useForm<WorkingHourFormValues>({
    resolver: zodResolver(workingHourSchema),
    defaultValues: {
      branchId: branches[0]?.id ?? '',
      weekday: '1',
      startsAt: '09:00',
      endsAt: '18:00'
    }
  })

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    )
  }

  return (
    <article className="panel">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-indigo-100 font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {staff.display_name
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">{staff.display_name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase dark:bg-slate-800">
                {staff.is_active ? t('team.active') : t('team.inactive')}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{staff.title || t('team.noTitle')}</p>
          </div>
        </div>
        <button
          type="button"
          className="button button-ghost border border-slate-200 dark:border-slate-700"
          disabled={!canManage || isSaving}
          title={!canManage ? disabledReason : undefined}
          onClick={() => onStatusChange(!staff.is_active)}
        >
          <Power className="size-4" />
          {staff.is_active ? t('team.deactivate') : t('team.activate')}
        </button>
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="size-5 text-indigo-500" />
            <h3 className="font-black">{t('team.servicesTitle')}</h3>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-bold dark:border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedServiceIds.includes(service.id)}
                  disabled={!canManage || isSaving}
                  onChange={() => toggleService(service.id)}
                />
                {service.name}
              </label>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-slate-500">{t('team.noServices')}</p>
            )}
          </div>
          <button
            type="button"
            className="button button-primary mt-4"
            disabled={!canManage || isSaving || services.length === 0}
            title={!canManage ? disabledReason : undefined}
            onClick={() => onServicesSave(selectedServiceIds)}
          >
            {t('team.saveServices')}
          </button>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-indigo-500" />
            <h3 className="font-black">{t('team.hoursTitle')}</h3>
          </div>
          <div className="mt-4 space-y-2">
            {hours
              .slice()
              .sort((left, right) => left.weekday - right.weekday)
              .map((hour) => (
                <div
                  key={hour.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <span className="font-bold">
                    {t(`team.weekdays.${hour.weekday}`)} · {hour.starts_at.slice(0, 5)}–
                    {hour.ends_at.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                    aria-label={t('team.removeHour')}
                    disabled={!canManage || isSaving}
                    title={!canManage ? disabledReason : t('team.removeHour')}
                    onClick={() => onHourDelete(hour.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            {hours.length === 0 && <p className="text-sm text-slate-500">{t('team.noHours')}</p>}
          </div>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={hourForm.handleSubmit(onHourSave)}
          >
            <FormField label={t('team.branch')}>
              <select className="form-input-wrap w-full" {...hourForm.register('branchId')}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('team.weekday')}>
              <select className="form-input-wrap w-full" {...hourForm.register('weekday')}>
                {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {t(`team.weekdays.${weekday}`)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('team.startsAt')}>
              <input
                type="time"
                className="form-input-wrap w-full"
                {...hourForm.register('startsAt')}
              />
            </FormField>
            <FormField
              label={t('team.endsAt')}
              error={hourForm.formState.errors.endsAt ? t('team.invalidHours') : undefined}
            >
              <input
                type="time"
                className="form-input-wrap w-full"
                {...hourForm.register('endsAt')}
              />
            </FormField>
            <button
              type="submit"
              className="button button-primary sm:col-span-2"
              disabled={!canManage || isSaving || branches.length === 0}
              title={!canManage ? disabledReason : undefined}
            >
              {t('team.saveHour')}
            </button>
          </form>
        </section>
      </div>
    </article>
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

function Notice({ text, tone }: { text: string; tone: 'warning' | 'info' | 'error' }) {
  const tones = {
    warning:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200',
    error:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
  }
  return (
    <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${tones[tone]}`}>{text}</div>
  )
}
