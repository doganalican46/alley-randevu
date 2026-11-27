import { useQuery } from '@tanstack/react-query'
import { Clock3, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { env } from '@/core/config/env'
import { demoBusiness } from '@/features/booking/data/demo-business'
import { getPublicBusiness } from '@/features/booking/data/public-business.repository'
import { demoPublicBusiness, formatServicePrice } from '@/features/booking/model/public-business'
import { PageLoader } from '@/shared/components/page-loader'

export default function BusinessPublicPage() {
  const { slug = '' } = useParams()
  const { t, i18n } = useTranslation()
  const isDemo = slug === demoBusiness.slug
  const businessQuery = useQuery({
    queryKey: ['public-business', slug],
    queryFn: () => getPublicBusiness(slug),
    enabled: env.isSupabaseConfigured && !isDemo && Boolean(slug),
    retry: false
  })

  if (!isDemo && businessQuery.isLoading) return <PageLoader />
  if (!isDemo && (!env.isSupabaseConfigured || businessQuery.isError || !businessQuery.data)) {
    return <PublicBusinessUnavailable isConfigurationMissing={!env.isSupabaseConfigured} />
  }

  const business = isDemo ? demoPublicBusiness : businessQuery.data
  if (!business) return <PublicBusinessUnavailable isConfigurationMissing={false} />
  const primaryBranch = business.branches.find((branch) => branch.isPrimary) ?? business.branches[0]

  return (
    <section className="px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="business-cover">
          <div className="cover-orb cover-orb-one" />
          <div className="cover-orb cover-orb-two" />
        </div>
        <div className="relative -mt-14 px-4 sm:px-8">
          <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-end dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <span className="grid size-24 shrink-0 place-items-center rounded-3xl border-4 border-white bg-indigo-600 text-3xl font-black text-white shadow-lg dark:border-slate-900">
              {business.initials}
            </span>
            <div className="min-w-0 flex-1">
              <span className="demo-pill">
                {business.isDemo ? t('publicBusiness.demoBadge') : t('publicBusiness.liveBadge')}
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{business.name}</h1>
              {business.isDemo ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <Star className="size-4 fill-amber-400 text-amber-400" /> {demoBusiness.rating} ·{' '}
                  {t('publicBusiness.reviewCount', { count: demoBusiness.reviewCount })}
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="size-4" /> {t('publicBusiness.publishedProfile')}
                </p>
              )}
            </div>
            {business.services.length > 0 ? (
              <Link
                to={`/b/${business.slug}/book`}
                className="button button-primary button-large sm:w-auto"
              >
                {t('publicBusiness.book')}
              </Link>
            ) : (
              <button
                type="button"
                className="button button-primary button-large sm:w-auto"
                disabled
                title={t('publicBusiness.noServices')}
              >
                {t('publicBusiness.book')}
              </button>
            )}
          </div>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{t('publicBusiness.services')}</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
              {business.description || t('publicBusiness.defaultDescription')}
            </p>
            <div className="mt-7 space-y-3">
              {business.services.map((service) => (
                <div key={service.id} className="service-row">
                  <div>
                    <h3 className="font-black">{service.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock3 className="size-4" />{' '}
                      {t('publicBusiness.duration', { count: service.durationMinutes })}
                    </p>
                  </div>
                  <p className="font-black text-indigo-600">
                    {formatServicePrice(service, i18n.language)}
                  </p>
                </div>
              ))}
              {business.services.length === 0 && (
                <p className="rounded-2xl bg-slate-100 p-5 text-sm text-slate-500 dark:bg-slate-800">
                  {t('publicBusiness.noServices')}
                </p>
              )}
            </div>
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-black">{t('publicBusiness.contact')}</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              {primaryBranch?.addressLine && (
                <p className="flex gap-3">
                  <MapPin className="size-5 shrink-0 text-indigo-600" />
                  {primaryBranch.addressLine}
                </p>
              )}
              {primaryBranch?.phone && (
                <p className="flex gap-3">
                  <Phone className="size-5 shrink-0 text-indigo-600" />
                  {primaryBranch.phone}
                </p>
              )}
              {business.branches.length > 0 && (
                <p className="flex gap-3">
                  <MapPin className="size-5 shrink-0 text-indigo-600" />
                  {t('publicBusiness.branchCount', { count: business.branches.length })}
                </p>
              )}
              {!primaryBranch?.addressLine && !primaryBranch?.phone && (
                <p>{t('publicBusiness.noContact')}</p>
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-500 dark:border-slate-800">
              <ShieldCheck className="size-4 text-emerald-600" />
              {t('publicBusiness.secureBooking')}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function PublicBusinessUnavailable({
  isConfigurationMissing
}: {
  isConfigurationMissing: boolean
}) {
  const { t } = useTranslation()
  return (
    <section className="grid min-h-[60vh] place-items-center px-5 py-16 text-center">
      <div className="max-w-lg">
        <ShieldCheck className="mx-auto size-12 text-slate-300" />
        <h1 className="mt-5 text-3xl font-black">{t('publicBusiness.unavailableTitle')}</h1>
        <p className="mt-3 text-slate-500">
          {isConfigurationMissing
            ? t('publicBusiness.configurationMissing')
            : t('publicBusiness.unavailableDescription')}
        </p>
        <Link to="/" className="button button-primary mt-7">
          {t('publicBusiness.backHome')}
        </Link>
      </div>
    </section>
  )
}
