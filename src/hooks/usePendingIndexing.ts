import { useQuery } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface PendingIndexingResponse {
  pending_count: number
  error?: string
}

async function fetchPendingIndexing(): Promise<PendingIndexingResponse> {
  const response = await fetch(`${API_URL}/indexing/pending`)
  if (!response.ok) {
    throw new Error(`Failed to fetch pending indexing: ${response.statusText}`)
  }
  return response.json()
}

export function usePendingIndexing() {
  return useQuery({
    queryKey: ['pending-indexing'],
    queryFn: fetchPendingIndexing,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000 // Consider data stale after 20 seconds
  })
}