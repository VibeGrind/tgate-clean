import { Clock } from 'lucide-react'
import { usePendingIndexing } from '../hooks/usePendingIndexing'

export function IndexingStatus() {
  const { data, isLoading, error } = usePendingIndexing()

  if (isLoading) {
    return (
      <div className="bg-tgate-panel border border-tgate-border rounded-xl shadow-tgate p-4 animate-pulse">
        <div className="flex items-center justify-end">
          <div className="h-4 w-32 bg-tgate-dark rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center justify-end text-red-400">
          <span className="text-sm">Ошибка получения данных</span>
        </div>
      </div>
    )
  }

  const pendingCount = data?.pending_count || 0

  return (
    <div className="bg-tgate-panel border border-tgate-border rounded-xl shadow-tgate p-4">
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2 text-tgate-text">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">Ожидает индексации:</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          pendingCount === 0 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : pendingCount <= 10
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {pendingCount.toLocaleString()}
        </div>
      </div>
    </div>
  )
}