import { Link } from 'react-router-dom'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Alley Randevu ana sayfa">
      <span className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-200 transition-transform group-hover:-rotate-3 dark:shadow-indigo-950">
        A
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-black tracking-tight text-slate-950 dark:text-white">
            Alley
          </span>
          <span className="block text-xs font-semibold text-slate-500">Randevu</span>
        </span>
      )}
    </Link>
  )
}
