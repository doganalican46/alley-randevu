import { Download, RefreshCw, WifiOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaExperience() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installDismissed, setInstallDismissed] = useState(false)
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstall)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstall)
    }
  }, [])

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
    else setInstallDismissed(true)
  }

  if (!isOnline) {
    return (
      <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-2xl bg-amber-950 p-4 text-sm font-bold text-amber-100 shadow-2xl">
        <WifiOff className="mt-0.5 size-5 shrink-0" />
        {t('pwa.offline')}
      </aside>
    )
  }

  if (needRefresh) {
    return (
      <PwaPrompt
        icon={RefreshCw}
        title={t('pwa.updateTitle')}
        description={t('pwa.updateDescription')}
        primary={t('pwa.update')}
        onPrimary={() => void updateServiceWorker(true)}
        onClose={() => setNeedRefresh(false)}
      />
    )
  }

  if (offlineReady) {
    return (
      <PwaPrompt
        icon={RefreshCw}
        title={t('pwa.offlineReady')}
        description=""
        primary={t('pwa.later')}
        onPrimary={() => setOfflineReady(false)}
        onClose={() => setOfflineReady(false)}
      />
    )
  }

  if (installPrompt && !installDismissed) {
    return (
      <PwaPrompt
        icon={Download}
        title={t('pwa.installTitle')}
        description={t('pwa.installDescription')}
        primary={t('pwa.install')}
        onPrimary={() => void install()}
        onClose={() => setInstallDismissed(true)}
      />
    )
  }

  return null
}

function PwaPrompt({
  icon: Icon,
  title,
  description,
  primary,
  onPrimary,
  onClose
}: {
  icon: typeof Download
  title: string
  description: string
  primary: string
  onPrimary: () => void
  onClose: () => void
}) {
  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-3xl border border-indigo-200 bg-white p-5 shadow-2xl dark:border-indigo-900 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
      </div>
      <button type="button" className="button button-primary mt-4 w-full" onClick={onPrimary}>
        {primary}
      </button>
    </aside>
  )
}
