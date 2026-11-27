import { CircleAlert } from 'lucide-react'
import { env } from '@/core/config/env'

export function ConfigurationBanner() {
  if (env.isSupabaseConfigured) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-sm font-medium">
        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
        <span>Geliştirme modu: Supabase henüz bağlı değil; veri yazan işlemler devre dışı.</span>
      </div>
    </div>
  )
}
