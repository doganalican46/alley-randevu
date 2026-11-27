export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Yükleniyor">
      <div className="size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
    </div>
  )
}
