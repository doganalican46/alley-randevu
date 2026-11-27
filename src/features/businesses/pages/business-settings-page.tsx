import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Download, ExternalLink, QrCode, Save } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { env } from '@/core/config/env'
import {
  getBusinessSettings,
  updateBusinessSettings
} from '@/features/businesses/data/business-settings.repository'
import {
  businessSettingsSchema,
  type BusinessSettingsFormValues
} from '@/features/businesses/model/business-settings.schema'
import { PageLoader } from '@/shared/components/page-loader'

export default function BusinessSettingsPage() {
  const { businessId = '' } = useParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isDemo = businessId === 'demo'
  const [feedback, setFeedback] = useState<string>('')
  const settingsQuery = useQuery({
    queryKey: ['business-settings', businessId],
    queryFn: () => getBusinessSettings(businessId),
    enabled: !isDemo && Boolean(businessId),
    retry: false
  })
  const settings = settingsQuery.data
  const bookingUrl = useMemo(() => {
    const slug = isDemo ? 'alley-barber' : settings?.slug
    return slug ? new URL(`/b/${slug}`, env.appUrl).toString() : ''
  }, [isDemo, settings?.slug])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const form = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
      bookingIntervalMinutes: '15',
      minimumBookingNoticeMinutes: 60,
      maximumBookingDays: 90,
      cancellationNoticeHours: 24,
      autoConfirmAppointments: false,
      isPublished: false
    }
  })

  useEffect(() => {
    if (!settings) return
    form.reset({
      name: settings.name,
      description: settings.description,
      timezone: settings.timezone,
      currency: settings.currency,
      bookingIntervalMinutes: String(settings.bookingIntervalMinutes) as
        '5' | '10' | '15' | '20' | '30' | '60',
      minimumBookingNoticeMinutes: settings.minimumBookingNoticeMinutes,
      maximumBookingDays: settings.maximumBookingDays,
      cancellationNoticeHours: settings.cancellationNoticeHours,
      autoConfirmAppointments: settings.autoConfirmAppointments,
      isPublished: settings.isPublished
    })
  }, [form, settings])

  useEffect(() => {
    if (!bookingUrl) return
    void QRCode.toDataURL(bookingUrl, { width: 640, margin: 2, errorCorrectionLevel: 'H' }).then(
      setQrDataUrl
    )
  }, [bookingUrl])

  const saveMutation = useMutation({
    mutationFn: (values: BusinessSettingsFormValues) =>
      updateBusinessSettings(businessId, businessSettingsSchema.parse(values)),
    onSuccess: (nextSettings) => {
      queryClient.setQueryData(['business-settings', businessId], nextSettings)
      void queryClient.invalidateQueries({ queryKey: ['business-summary', businessId] })
      setFeedback(t('settings.saved'))
    },
    onError: () => setFeedback(t('settings.saveError'))
  })

  if (!isDemo && settingsQuery.isLoading) return <PageLoader />
  if (!isDemo && (settingsQuery.isError || !settings)) {
    return <SettingsState title={t('settings.loadError')} businessId={businessId} />
  }

  async function shareBookingUrl() {
    if (!bookingUrl) return
    try {
      if (navigator.share) {
        await navigator.share({ title: t('settings.shareTitle'), url: bookingUrl })
      } else {
        await navigator.clipboard.writeText(bookingUrl)
      }
      setFeedback(t('settings.linkCopied'))
    } catch {
      setFeedback(t('settings.shareError'))
    }
  }

  async function downloadSvg() {
    if (!bookingUrl) return
    const svg = await QRCode.toString(bookingUrl, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'H'
    })
    downloadUrl(
      URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      'alley-randevu-qr.svg',
      true
    )
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <Link
          to={`/business/${businessId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300"
        >
          <ArrowLeft className="size-4" /> {t('settings.back')}
        </Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            className="panel space-y-6"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <header>
              <p className="section-kicker">{t('settings.kicker')}</p>
              <h1 className="mt-2 text-3xl font-black">{t('settings.title')}</h1>
              <p className="mt-2 text-slate-500">{t('settings.description')}</p>
            </header>
            <div className="grid gap-5 sm:grid-cols-2">
              <SettingsField
                label={t('settings.businessName')}
                error={form.formState.errors.name?.message}
              >
                <input className="form-input" {...form.register('name')} disabled={isDemo} />
              </SettingsField>
              <SettingsField
                label={t('settings.timezone')}
                error={form.formState.errors.timezone?.message}
              >
                <input className="form-input" {...form.register('timezone')} disabled={isDemo} />
              </SettingsField>
              <SettingsField
                label={t('settings.currency')}
                error={form.formState.errors.currency?.message}
              >
                <input
                  className="form-input"
                  maxLength={3}
                  {...form.register('currency')}
                  disabled={isDemo}
                />
              </SettingsField>
              <SettingsField
                label={t('settings.interval')}
                error={form.formState.errors.bookingIntervalMinutes?.message}
              >
                <select
                  className="form-input"
                  {...form.register('bookingIntervalMinutes')}
                  disabled={isDemo}
                >
                  {[5, 10, 15, 20, 30, 60].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </SettingsField>
              <SettingsField
                label={t('settings.minimumNotice')}
                error={form.formState.errors.minimumBookingNoticeMinutes?.message}
              >
                <input
                  className="form-input"
                  type="number"
                  {...form.register('minimumBookingNoticeMinutes')}
                  disabled={isDemo}
                />
              </SettingsField>
              <SettingsField
                label={t('settings.maximumDays')}
                error={form.formState.errors.maximumBookingDays?.message}
              >
                <input
                  className="form-input"
                  type="number"
                  {...form.register('maximumBookingDays')}
                  disabled={isDemo}
                />
              </SettingsField>
              <SettingsField
                label={t('settings.cancellationHours')}
                error={form.formState.errors.cancellationNoticeHours?.message}
              >
                <input
                  className="form-input"
                  type="number"
                  {...form.register('cancellationNoticeHours')}
                  disabled={isDemo}
                />
              </SettingsField>
            </div>
            <SettingsField
              label={t('settings.businessDescription')}
              error={form.formState.errors.description?.message}
            >
              <textarea
                className="form-input min-h-28 resize-y"
                {...form.register('description')}
                disabled={isDemo}
              />
            </SettingsField>
            <label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span>
                <strong className="block">{t('settings.autoConfirm')}</strong>
                <span className="text-sm text-slate-500">{t('settings.autoConfirmHint')}</span>
              </span>
              <input
                type="checkbox"
                className="size-5"
                {...form.register('autoConfirmAppointments')}
                disabled={isDemo}
              />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span>
                <strong className="block">{t('settings.publish')}</strong>
                <span className="text-sm text-slate-500">{t('settings.publishHint')}</span>
              </span>
              <input
                type="checkbox"
                className="size-5"
                {...form.register('isPublished')}
                disabled={isDemo}
              />
            </label>
            <button
              className="button button-primary"
              type="submit"
              disabled={isDemo || saveMutation.isPending}
              title={isDemo ? t('settings.demoDisabled') : undefined}
            >
              <Save className="size-4" />{' '}
              {saveMutation.isPending ? t('settings.saving') : t('settings.save')}
            </button>
          </form>
          <aside className="panel h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
              <QrCode className="size-6 text-indigo-600" />
              <h2 className="text-xl font-black">{t('settings.qrTitle')}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">{t('settings.qrDescription')}</p>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={t('settings.qrAlt')}
                className="mx-auto mt-5 w-full max-w-64 rounded-2xl bg-white p-3"
              />
            )}
            <p className="mt-4 break-all rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
              {bookingUrl}
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="button button-primary"
                onClick={() => void shareBookingUrl()}
              >
                <Copy className="size-4" /> {t('settings.copyShare')}
              </button>
              <button
                type="button"
                className="button button-ghost border border-slate-200 dark:border-slate-700"
                onClick={() => qrDataUrl && downloadUrl(qrDataUrl, 'alley-randevu-qr.png')}
                disabled={!qrDataUrl}
              >
                <Download className="size-4" /> {t('settings.downloadPng')}
              </button>
              <button
                type="button"
                className="button button-ghost border border-slate-200 dark:border-slate-700"
                onClick={() => void downloadSvg()}
                disabled={!bookingUrl}
              >
                <Download className="size-4" /> {t('settings.downloadSvg')}
              </button>
              <a className="button button-ghost" href={bookingUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> {t('settings.preview')}
              </a>
            </div>
            {feedback && (
              <p className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600">
                <Check className="size-4" /> {feedback}
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

function SettingsField({
  label,
  error,
  children
}: {
  label: string
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <span className="form-input-wrap">{children}</span>
      {error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  )
}

function SettingsState({ title, businessId }: { title: string; businessId: string }) {
  const { t } = useTranslation()
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <Link className="button button-primary mt-5" to={`/business/${businessId}`}>
          {t('settings.back')}
        </Link>
      </div>
    </main>
  )
}

function downloadUrl(url: string, filename: string, revoke = false) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  if (revoke) URL.revokeObjectURL(url)
}
