import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Home,
  Menu,
  Megaphone,
  Plus,
  Search,
  Settings,
  UsersRound
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { getBusinessSummary } from '@/features/businesses/data/business.repository'
import { BrandMark } from '@/shared/components/brand-mark'
import { PageLoader } from '@/shared/components/page-loader'

const appointments = [
  { time: '09:30', name: 'Deniz Kaya', service: 'Saç & sakal', status: 'Onaylandı' },
  { time: '11:00', name: 'Ece Yılmaz', service: 'Saç kesimi', status: 'Bekliyor' },
  { time: '13:30', name: 'Mert Aydın', service: 'Bakım paketi', status: 'Onaylandı' }
]

export default function BusinessDashboardPage() {
  const { businessId } = useParams()
  const { t } = useTranslation()
  const isDemo = businessId === 'demo'
  const businessQuery = useQuery({
    queryKey: ['business-summary', businessId],
    queryFn: () => getBusinessSummary(businessId ?? ''),
    enabled: !isDemo && Boolean(businessId),
    retry: false
  })
  const businessName = isDemo ? 'Alley Barber' : (businessQuery.data?.name ?? 'İşletme')
  const workspaceStatus = isDemo
    ? 'Demo'
    : businessQuery.data?.status === 'draft'
      ? 'Kurulum devam ediyor'
      : 'Aktif'
  const visibleAppointments = isDemo ? appointments : []
  const metricValues = isDemo
    ? { appointments: '12', pending: '3', revenue: '₺8.450', occupancy: '%84' }
    : { appointments: '0', pending: '0', revenue: '₺0', occupancy: '%0' }
  const weeklyBars = isDemo ? [42, 68, 54, 88, 72, 96, 35] : [0, 0, 0, 0, 0, 0, 0]
  const businessInitials = businessName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR')

  if (!isDemo && businessQuery.isLoading) return <PageLoader />
  if (!isDemo && businessQuery.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-5 dark:bg-slate-950">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">{t('dashboard.loadError')}</h1>
          <p className="mt-3 text-slate-500">{t('dashboard.loadErrorDescription')}</p>
          <button
            type="button"
            className="button button-primary mt-6"
            onClick={() => void businessQuery.refetch()}
          >
            {t('dashboard.retry')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block dark:border-slate-800 dark:bg-slate-900">
        <BrandMark />
        <div className="mt-8 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
          <p className="text-xs font-bold text-slate-500">Çalışma alanı</p>
          <p className="mt-1 font-black">{businessName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {workspaceStatus} · {businessId}
          </p>
        </div>
        <nav className="mt-8 space-y-1">
          <SideLink icon={Home} label="Özet" to={`/business/${businessId ?? ''}`} active />
          <SideLink icon={CalendarDays} label="Takvim" />
          <SideLink
            icon={Clock3}
            label="Randevular"
            to={`/business/${businessId ?? ''}/appointments`}
          />
          <SideLink icon={UsersRound} label="Ekip" to={`/business/${businessId ?? ''}/team`} />
          <SideLink
            icon={UsersRound}
            label="Müşteriler"
            to={`/business/${businessId ?? ''}/customers`}
          />
          <SideLink
            icon={Settings}
            label="Şube ve hizmetler"
            to={`/business/${businessId ?? ''}/catalog`}
          />
          <SideLink
            icon={Settings}
            label="Ayarlar ve QR"
            to={`/business/${businessId ?? ''}/settings`}
          />
          <SideLink
            icon={Clock3}
            label="Operasyonlar"
            to={`/business/${businessId ?? ''}/operations`}
          />
          <SideLink
            icon={Megaphone}
            label={t('growth.nav')}
            to={`/business/${businessId ?? ''}/growth`}
          />
        </nav>
        <Link
          to="/"
          className="absolute bottom-6 left-6 text-sm font-bold text-slate-500 hover:text-indigo-600"
        >
          ← Siteye dön
        </Link>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Menü"
              title="Mobil menü henüz etkin değil"
              disabled
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-xs font-bold text-indigo-600">
                {isDemo ? 'DEMO GÖRÜNÜMÜ' : 'İŞLETME PANELİ'}
              </p>
              <h1 className="font-black">İşletme özeti</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="button button-ghost"
              aria-label="Ara"
              title="Arama henüz etkin değil"
              disabled
            >
              <Search className="size-5" />
            </button>
            <button
              type="button"
              className="button button-ghost"
              aria-label="Bildirimler"
              title="Bildirimler henüz etkin değil"
              disabled
            >
              <Bell className="size-5" />
            </button>
            <span className="ml-1 grid size-10 place-items-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700">
              {businessInitials}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 pb-24 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-slate-500">
                {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date())}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">
                {isDemo ? 'Günaydın, Aslı' : `${businessName} çalışma alanı hazır`}
              </h2>
            </div>
            <button
              type="button"
              className="button button-primary"
              disabled
              title="Randevu oluşturma modülü henüz etkin değil"
            >
              <Plus className="size-4" /> Yeni randevu
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric
              label="Bugünkü randevu"
              value={metricValues.appointments}
              detail={isDemo ? 'Geçen haftaya göre +2' : 'Henüz randevu yok'}
              tone="indigo"
            />
            <DashboardMetric
              label="Bekleyen onay"
              value={metricValues.pending}
              detail={isDemo ? 'İnceleme gerekiyor' : 'Bekleyen kayıt yok'}
              tone="amber"
            />
            <DashboardMetric
              label="Bugünkü gelir"
              value={metricValues.revenue}
              detail={isDemo ? 'Tamamlanan işlemler' : 'Henüz tahsilat yok'}
              tone="emerald"
            />
            <DashboardMetric
              label="Doluluk"
              value={metricValues.occupancy}
              detail={isDemo ? 'Bugünün kapasitesi' : 'Takvim henüz boş'}
              tone="violet"
            />
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3 className="text-lg font-black">Bugünün akışı</h3>
                  <p className="mt-1 text-sm text-slate-500">Yaklaşan randevular</p>
                </div>
                <button type="button" className="text-sm font-bold text-indigo-600" disabled>
                  Takvimi aç
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleAppointments.map((appointment) => (
                  <div key={appointment.time} className="flex items-center gap-4 py-4">
                    <span className="w-12 text-sm font-black">{appointment.time}</span>
                    <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-sm font-black dark:bg-slate-800">
                      {appointment.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{appointment.name}</p>
                      <p className="truncate text-sm text-slate-500">{appointment.service}</p>
                    </div>
                    <span
                      className={`status-badge ${appointment.status === 'Bekliyor' ? 'status-waiting' : 'status-confirmed'}`}
                    >
                      {appointment.status}
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </div>
                ))}
                {!isDemo && (
                  <div className="py-10 text-center">
                    <CalendarDays className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 font-bold">Henüz randevu yok</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Hizmet ve personel kurulumundan sonra randevular burada görünür.
                    </p>
                  </div>
                )}
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3 className="text-lg font-black">Haftalık görünüm</h3>
                  <p className="mt-1 text-sm text-slate-500">Randevu yoğunluğu</p>
                </div>
              </div>
              <div className="mt-8 flex h-44 items-end justify-between gap-3">
                {weeklyBars.map((height, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div
                      className="min-h-1 rounded-t-lg bg-indigo-500"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-center text-xs font-bold text-slate-500">
                      {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <MobileLink icon={Home} label="Özet" />
          <MobileLink icon={CalendarDays} label="Takvim" />
          <MobileLink icon={Plus} label="Yeni" />
          <MobileLink icon={Menu} label="Diğer" />
        </nav>
      </div>
    </div>
  )
}

function SideLink({
  icon: Icon,
  label,
  to,
  active = false
}: {
  icon: typeof Home
  label: string
  to?: string
  active?: boolean
}) {
  const className = `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`

  if (to) {
    return (
      <Link to={to} className={className}>
        <Icon className="size-5" />
        {label}
      </Link>
    )
  }

  return (
    <span className={className}>
      <Icon className="size-5" />
      {label}
    </span>
  )
}
function MobileLink({ icon: Icon, label }: { icon: typeof Home; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1 py-1 text-[11px] font-bold text-slate-500">
      <Icon className="size-5" />
      {label}
    </span>
  )
}
function DashboardMetric({
  label,
  value,
  detail,
  tone
}: {
  label: string
  value: string
  detail: string
  tone: 'indigo' | 'amber' | 'emerald' | 'violet'
}) {
  return (
    <article className="panel !p-5">
      <span className={`metric-dot metric-${tone}`} />
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  )
}
