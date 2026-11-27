import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import { BrandMark } from '@/shared/components/brand-mark'
import { ConfigurationBanner } from '@/shared/components/configuration-banner'

export function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)] text-slate-950 dark:text-slate-50">
      <ConfigurationBanner />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex dark:text-slate-300">
            <a href="/#ozellikler" className="hover:text-indigo-600">
              {t('nav.features')}
            </a>
            <a href="/#isletmeler" className="hover:text-indigo-600">
              {t('nav.businesses')}
            </a>
            <Link to="/login" className="hover:text-indigo-600">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="button button-primary">
              {t('nav.start')}
            </Link>
          </nav>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label="Menüyü aç veya kapat"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {isOpen && (
          <nav className="grid gap-2 border-t border-slate-100 p-4 md:hidden dark:border-slate-800">
            <a href="/#ozellikler" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
              {t('nav.features')}
            </a>
            <a href="/#isletmeler" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
              {t('nav.businesses')}
            </a>
            <Link to="/login" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="button button-primary mt-2"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.start')}
            </Link>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <p className="text-sm text-slate-500">© 2026 Alley Software. Güvenle planlayın.</p>
        </div>
      </footer>
    </div>
  )
}
