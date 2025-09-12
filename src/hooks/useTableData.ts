import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { TableResponse, TableFilters } from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

export function useTableData<T>(tableName: string, filters: TableFilters) {
  return useQuery({
    queryKey: ['table', tableName, filters],
    queryFn: async (): Promise<TableResponse<T>> => {
      const params = new URLSearchParams()
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.page_size) params.append('page_size', filters.page_size.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      if (filters.search) params.append('search', filters.search)
      if (filters.search_questions) params.append('search_questions', filters.search_questions)
      if (filters.search_emails) params.append('search_emails', filters.search_emails)
      if (filters.search_tg_links) params.append('search_tg_links', filters.search_tg_links)
      if (filters.search_www_links) params.append('search_www_links', filters.search_www_links)
      if (filters.search_mentions) params.append('search_mentions', filters.search_mentions)
      if (filters.search_hashtags) params.append('search_hashtags', filters.search_hashtags)
      if (filters.search_phones) params.append('search_phones', filters.search_phones)
      if (filters.search_intense_words) params.append('search_intense_words', filters.search_intense_words)
      if (filters.search_exclamations) params.append('search_exclamations', filters.search_exclamations)
      if (filters.search_emojis) params.append('search_emojis', filters.search_emojis)
      
      const response = await api.get(`/tables/${tableName}?${params}`)
      return response.data
    },
    enabled: !!tableName,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

export function useTableSchema(tableName: string) {
  return useQuery({
    queryKey: ['schema', tableName],
    queryFn: async () => {
      const response = await api.get(`/tables/${tableName}/schema`)
      return response.data
    },
    enabled: !!tableName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}