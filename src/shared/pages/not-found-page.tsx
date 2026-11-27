import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-5 text-white">
      <div className="text-center">
        <p className="text-sm font-black tracking-[.3em] text-indigo-300">404</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Bu sayfa takvimde yok.</h1>
        <p className="mt-4 text-slate-400">Bağlantı taşınmış veya hiç oluşturulmamış olabilir.</p>
        <Link to="/" className="button mt-8 bg-white text-slate-950 hover:bg-slate-100">
          <ArrowLeft className="size-4" /> Ana sayfaya dön
        </Link>
      </div>
    </main>
  )
}
