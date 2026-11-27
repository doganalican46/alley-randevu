import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, CheckCircle2, Mail, NotebookPen, Phone, Plus, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { getBusinessMembership } from '@/features/businesses/data/business-membership.repository'
import {
  addCustomerNote,
  createBusinessCustomer,
  getBusinessCustomers,
  setCustomerActive
} from '@/features/customers/data/customers.repository'
import { hasBusinessPermission } from '@/core/permissions/permissions'
import { PageLoader } from '@/shared/components/page-loader'

export default function CustomersPage() {
  const { businessId = '' } = useParams()
  const { user } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [noteCustomerId, setNoteCustomerId] = useState<string | null>(null)
  const [noteBody, setNoteBody] = useState('')
  const customerQuery = useQuery({
    queryKey: ['business-customers', businessId],
    queryFn: () => getBusinessCustomers(businessId),
    retry: false
  })
  const membershipQuery = useQuery({
    queryKey: ['business-membership', businessId, user?.id],
    queryFn: () => getBusinessMembership(businessId, user?.id ?? ''),
    enabled: Boolean(user?.id),
    retry: false
  })
  const canManage = hasBusinessPermission(membershipQuery.data, 'customers.manage')
  const createMutation = useMutation({
    mutationFn: (input: {
      fullName: string
      email?: string
      phone?: string
      tags: string[]
      marketingConsent: boolean
    }) => createBusinessCustomer(businessId, input),
    onSuccess: () => {
      setMessage(t('customers.created'))
      void queryClient.invalidateQueries({ queryKey: ['business-customers', businessId] })
    }
  })
  const statusMutation = useMutation({
    mutationFn: ({ customerId, isActive }: { customerId: string; isActive: boolean }) =>
      setCustomerActive(customerId, isActive),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['business-customers', businessId] })
  })
  const noteMutation = useMutation({
    mutationFn: ({ customerId, body }: { customerId: string; body: string }) =>
      addCustomerNote(businessId, customerId, user?.id ?? '', body),
    onSuccess: () => {
      setNoteBody('')
      setNoteCustomerId(null)
      setMessage(t('customers.noteAdded'))
    }
  })

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    const tags = String(form.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (fullName.length < 2) {
      setMessage(t('customers.invalidName'))
      return
    }
    createMutation.mutate({
      fullName,
      tags,
      marketingConsent: form.get('marketingConsent') === 'on',
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {})
    })
    event.currentTarget.reset()
  }

  if (customerQuery.isLoading || membershipQuery.isLoading) return <PageLoader />
  const customers = customerQuery.data ?? []
  const hasError = customerQuery.isError || createMutation.isError || statusMutation.isError || noteMutation.isError

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">{t('customers.kicker')}</p>
            <h1 className="mt-2 text-3xl font-black">{t('customers.title')}</h1>
            <p className="mt-2 text-slate-500">{t('customers.description')}</p>
          </div>
          <Link to={`/business/${businessId}`} className="button button-ghost">
            {t('customers.back')}
          </Link>
        </header>

        {message && <p role="status" className="mt-6 rounded-2xl bg-indigo-50 p-4 font-bold text-indigo-700">{message}</p>}
        {hasError && <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">{t('customers.saveError')}</p>}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_2fr]">
          <section className="panel h-fit">
            <div className="panel-header">
              <div>
                <h2 className="text-lg font-black">{t('customers.add')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('customers.addHint')}</p>
              </div>
              <Plus className="size-5 text-indigo-600" />
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleCreate}>
              <Field label={t('customers.fullName')} name="fullName" required />
              <Field label={t('customers.email')} name="email" type="email" />
              <Field label={t('customers.phone')} name="phone" />
              <Field label={t('customers.tags')} name="tags" placeholder={t('customers.tagsHint')} />
              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
                <span className="text-sm font-bold">{t('customers.marketingConsent')}</span>
              </label>
              <button
                type="submit"
                className="button button-primary w-full"
                disabled={!canManage || createMutation.isPending}
                title={!canManage ? t('customers.permissionDisabled') : undefined}
              >
                {createMutation.isPending ? t('customers.saving') : t('customers.create')}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="text-lg font-black">{t('customers.list')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('customers.count', { count: customers.length })}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {customers.map((customer) => (
                <article key={customer.id} className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                        <UserRound className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-black">{customer.fullName}</h3>
                        <p className="mt-1 text-xs text-slate-500">{t('customers.appointments', { count: customer.appointmentCount })}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${customer.isActive ? 'status-confirmed' : 'status-waiting'}`}>
                      {customer.isActive ? t('customers.active') : t('customers.archived')}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    {customer.email && <p className="flex items-center gap-2"><Mail className="size-4" />{customer.email}</p>}
                    {customer.phone && <p className="flex items-center gap-2"><Phone className="size-4" />{customer.phone}</p>}
                  </div>
                  {customer.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {customer.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800">{tag}</span>)}
                    </div>
                  )}
                  {noteCustomerId === customer.id ? (
                    <form
                      className="mt-4"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (noteBody.trim().length >= 2) noteMutation.mutate({ customerId: customer.id, body: noteBody })
                      }}
                    >
                      <textarea className="form-input-wrap min-h-24 w-full p-3" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder={t('customers.notePlaceholder')} />
                      <div className="mt-3 flex gap-2">
                        <button className="button button-primary" disabled={!canManage || noteBody.trim().length < 2}>{t('customers.saveNote')}</button>
                        <button type="button" className="button button-ghost" onClick={() => setNoteCustomerId(null)}>{t('customers.cancel')}</button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <button type="button" className="button button-ghost" disabled={!canManage} onClick={() => setNoteCustomerId(customer.id)}><NotebookPen className="size-4" />{t('customers.addNote')}</button>
                      <button type="button" className="button button-ghost" disabled={!canManage || statusMutation.isPending} onClick={() => statusMutation.mutate({ customerId: customer.id, isActive: !customer.isActive })}>
                        {customer.isActive ? <Archive className="size-4" /> : <CheckCircle2 className="size-4" />}
                        {customer.isActive ? t('customers.archive') : t('customers.activate')}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {customers.length === 0 && <p className="py-12 text-center text-slate-500">{t('customers.empty')}</p>}
          </section>
        </div>
      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', required = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <span className="form-input-wrap">
        <input className="form-input" name={name} type={type} required={required} placeholder={placeholder} />
      </span>
    </label>
  )
}
