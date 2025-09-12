import { useQuery } from '@tanstack/react-query'

interface TableStatus {
  has_data: boolean
  count: number
  error?: string
}

interface TablesStatus {
  telegram_message: TableStatus
  tg_objects: TableStatus
}

const fetchTablesStatus = async (): Promise<TablesStatus> => {
  const apiUrl = (import.meta.env?.VITE_API_URL) || 'http://localhost:8000'
  const response = await fetch(`${apiUrl}/tables/status`)
  if (!response.ok) {
    throw new Error('Failed to fetch tables status')
  }
  return response.json()
}

export function useTablesStatus() {
  const result = useQuery({
    queryKey: ['tables-status'],
    queryFn: fetchTablesStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
  
  // Debug log
  if (result.data) {
    console.log('Tables Status:', result.data)
  }
  if (result.error) {
    console.error('Tables Status Error:', result.error)
  }
  
  return result
}