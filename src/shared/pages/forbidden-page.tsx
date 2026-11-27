import { LockKeyhole } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-5 text-white">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-indigo-500/20 text-indigo-300">
          <LockKeyhole className="size-7" />
        </span>
        <h1 className="mt-6 text-4xl font-black tracking-tight">{t('errors.forbiddenTitle')}</h1>
        <p className="mt-4 leading-7 text-slate-400">{t('errors.forbiddenDescription')}</p>
        <Link to="/" className="button mt-8 bg-white text-slate-950 hover:bg-slate-100">
          {t('errors.backHome')}
        </Link>
      </div>
    </main>
  )
}
