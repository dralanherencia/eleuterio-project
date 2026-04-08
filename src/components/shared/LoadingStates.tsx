export function KanbanSkeleton() {
  const cols = ['Pendiente', 'En progreso', 'Revisión', 'Listo']
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map(col => (
        <div key={col} className="min-w-[260px] w-[260px]">
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-5 w-6 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="bg-gray-50 rounded-2xl p-2 space-y-2 min-h-[120px]">
            {[...Array(col === 'En progreso' ? 3 : col === 'Revisión' ? 2 : 2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-gray-100 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-5 h-64" />
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 h-64" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-48" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="24" height="24" fill="none" stroke="#E24B4A" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{message}</p>
        <p className="text-xs text-gray-400 mt-1">Verifica tu conexión a internet</p>
      </div>
      <button onClick={onRetry}
        className="flex items-center gap-2 bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 009-9 9 9 0 00-9 9 9 9 0 009 9 9 9 0 009-9"/>
          <path d="M21 3v5h-5"/>
        </svg>
        Reintentar
      </button>
    </div>
  )
}
