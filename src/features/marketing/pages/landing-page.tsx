import {
  ArrowUpRight,
  CalendarCheck2,
  Check,
  Clock3,
  Layers3,
  LockKeyhole,
  MessageCircleMore,
  Sparkles,
  UsersRound
} from 'lucide-react'
import { Link } from 'react-router-dom'

const featureCards = [
  {
    icon: CalendarCheck2,
    title: 'Akıllı takvim',
    description: 'Çakışmaları önleyen müsaitlik kurallarıyla randevular tek akışta.'
  },
  {
    icon: UsersRound,
    title: 'Ekibinizle uyumlu',
    description: 'Şube, personel, hizmet ve müşteri kayıtları her cihazda güncel.'
  },
  {
    icon: MessageCircleMore,
    title: 'Daha az unutulan randevu',
    description: 'Bildirim altyapısı ve takip akışlarıyla iletişimi düzenli tutun.'
  }
] as const

const schedule = [
  { time: '09:30', name: 'Deniz Kaya', service: 'Saç & sakal', color: 'bg-indigo-500' },
  { time: '11:00', name: 'Ece Yılmaz', service: 'Saç kesimi', color: 'bg-violet-500' },
  { time: '13:30', name: 'Mert Aydın', service: 'Bakım paketi', color: 'bg-emerald-500' }
] as const

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-24 pt-16 sm:pt-24 lg:px-8 lg:pb-32">
        <div className="hero-glow" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10 max-w-2xl">
            <div className="eyebrow">
              <Sparkles className="size-4" />
              İşletmeniz için yeni nesil randevu deneyimi
            </div>
            <h1 className="mt-7 text-balance text-5xl font-black leading-[1.03] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
              Takviminiz dolsun,
              <span className="block text-indigo-600">gününüz sadeleşsin.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Randevu, ekip ve müşteri yönetimini tek bir güvenli çalışma alanında birleştirin.
              Küçük bir stüdyodan çok şubeli işletmeye kadar sizinle büyür.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="button button-primary button-large">
                İşletmeni kur
                <ArrowUpRight className="size-5" />
              </Link>
              <Link to="/b/alley-barber" className="button button-secondary button-large">
                Müşteri deneyimini gör
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              {['14 gün deneme', 'Kredi kartı gerekmez', 'Kurulum desteği'].map((label) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -left-8 top-16 hidden w-44 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-indigo-100 backdrop-blur lg:block dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CalendarCheck2 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-500">Bugün</p>
                  <p className="text-xl font-black">12 randevu</p>
                </div>
              </div>
            </div>
            <div className="dashboard-preview">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-500">26 Kasım, Perşembe</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Günaydın, Aslı</h2>
                </div>
                <span className="grid size-11 place-items-center rounded-full bg-indigo-100 font-black text-indigo-700">
                  AK
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MetricCard label="Randevu" value="12" accent="text-indigo-600" />
                <MetricCard label="Doluluk" value="%84" accent="text-emerald-600" />
                <MetricCard label="Bekleyen" value="3" accent="text-amber-600" />
              </div>
              <div className="mt-7 flex items-center justify-between">
                <h3 className="font-black">Sıradaki randevular</h3>
                <span className="text-sm font-bold text-indigo-600">Tümü</span>
              </div>
              <div className="mt-4 space-y-2">
                {schedule.map((item) => (
                  <div key={item.time} className="schedule-row">
                    <div className="w-14 text-sm font-black text-slate-700 dark:text-slate-200">
                      {item.time}
                    </div>
                    <span className={`h-10 w-1 rounded-full ${item.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      <p className="truncate text-xs text-slate-500">{item.service}</p>
                    </div>
                    <Clock3 className="size-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="ozellikler"
        className="border-y border-slate-200 bg-white px-5 py-24 lg:px-8 dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="section-kicker">İşinize odaklanın</p>
            <h2 className="section-title">Randevu operasyonunun bütün parçaları, tek ritimde.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-7 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="isletmeler" className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] bg-slate-950 p-8 text-white sm:p-12 lg:grid-cols-[1fr_.8fr] lg:p-16">
          <div>
            <p className="section-kicker text-indigo-300">Sağlam bir temel</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Her işletme kendi alanında. Her veri doğru kişide.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Multi-tenant veri izolasyonu, rol bazlı yetkiler ve güvenli Supabase altyapısı en
              baştan mimariye dahil.
            </p>
            <Link
              to="/business/demo"
              className="button mt-9 border border-white/20 bg-white text-slate-950 hover:bg-slate-100"
            >
              İşletme panelini incele
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <DarkFeature
              icon={LockKeyhole}
              title="Tenant izolasyonu"
              detail="RLS ve açık veri erişim politikaları"
            />
            <DarkFeature
              icon={Layers3}
              title="Modüler mimari"
              detail="Yeni sektör ve özelliklere hazır"
            />
            <DarkFeature
              icon={CalendarCheck2}
              title="PWA deneyimi"
              detail="Mobilde ve masaüstünde kurulabilir"
            />
          </div>
        </div>
      </section>
    </>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <p className={`text-xl font-black ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  )
}

function DarkFeature({
  icon: Icon,
  title,
  detail
}: {
  icon: typeof LockKeyhole
  title: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-300">
        <Icon className="size-6" />
      </span>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{detail}</p>
      </div>
    </div>
  )
}
