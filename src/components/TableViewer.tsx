import { useState, useMemo, useEffect } from 'react'
import { useTableData } from '../hooks/useTableData'
import { useWebSocket } from '../hooks/useWebSocket'
import { Search, ChevronUp, ChevronDown, RefreshCw, Eye, EyeOff, Wifi, WifiOff, HelpCircle, X } from 'lucide-react'
import type { TableFilters } from '../types'

interface TableViewerProps {
  tableName: string
}

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200]

export function TableViewer({ tableName }: TableViewerProps) {
  const [filters, setFilters] = useState<TableFilters>({
    page: 1,
    page_size: 50,
    search: '',
    search_questions: '',
    search_emails: '',
    search_tg_links: '',
    search_www_links: '',
    search_mentions: '',
    search_hashtags: '',
    search_phones: '',
    search_intense_words: '',
    search_exclamations: '',
    search_emojis: '',
    sort_by: undefined,
    sort_order: 'desc'
  })
  
  const [searchInput, setSearchInput] = useState('')
  const [searchQuestionsInput, setSearchQuestionsInput] = useState('')
  const [searchEmailsInput, setSearchEmailsInput] = useState('')
  const [searchTgLinksInput, setSearchTgLinksInput] = useState('')
  const [searchWwwLinksInput, setSearchWwwLinksInput] = useState('')
  const [searchMentionsInput, setSearchMentionsInput] = useState('')
  const [searchHashtagsInput, setSearchHashtagsInput] = useState('')
  const [searchPhonesInput, setSearchPhonesInput] = useState('')
  const [searchIntenseWordsInput, setSearchIntenseWordsInput] = useState('')
  const [searchExclamationsInput, setSearchExclamationsInput] = useState('')
  const [searchEmojisInput, setSearchEmojisInput] = useState('')
  
  // Колонки, которые видны по умолчанию
  const getDefaultVisibleColumns = (table: string): Set<string> => {
    if (table === 'telegram_message') {
      return new Set<string>([
        'account_id', 'date', 'text_string', 'external_url', 'created_at', 'updated_at',
        'email_addresses', 'tg_links', 'www_links', 'mentions', 'hashtags', 'phone_numbers',
        'intense_words', 'questions', 'exclamations', 'emojis', 'topic_category'
      ])
    } else if (table === 'tg_objects') {
      return new Set<string>([
        'numeric_id', 'username', 'labels', 'status', 'is_private', 'created_at', 'updated_at'
      ])
    }
    return new Set<string>()
  }
  
  const defaultVisibleColumns = getDefaultVisibleColumns(tableName)
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(defaultVisibleColumns)
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnControls, setShowColumnControls] = useState(false)
  const [showSearchHelp, setShowSearchHelp] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: string} | null>(null)
  const [mousePosition, setMousePosition] = useState<{x: number, y: number}>({ x: 0, y: 0 })

  const { data, isLoading, error, refetch, isFetching } = useTableData(tableName, filters)
  const { isConnected, lastMessage } = useWebSocket(tableName)

  // Auto-refresh when we receive WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      // Small delay to ensure the database change is complete
      setTimeout(() => {
        refetch()
      }, 100)
    }
  }, [lastMessage, refetch])

  // Update visible columns when table changes
  useEffect(() => {
    setVisibleColumns(getDefaultVisibleColumns(tableName))
    setShowFilters(false)
    setShowColumnControls(false)
  }, [tableName])

  // Переводы названий колонок на русский
  const getColumnTranslation = (key: string): string => {
    const translations: Record<string, string> = {
      'account_id': 'автор',
      'date': 'дата публикации',
      'text_string': 'контент',
      'external_url': 'источник данных',
      'created_at': 'создана в системе',
      'updated_at': 'обновлена в системе',
      'email_addresses': 'email',
      'tg_links': 'телеграм ссылка',
      'www_links': 'интернет ссылка',
      'mentions': 'логин',
      'hashtags': 'хештеги',
      'phone_numbers': 'номера телефонов',
      'intense_words': 'кричащие слова',
      'questions': 'вопросительные\nпредложения',
      'exclamations': 'восклицательные\nпредложения',
      'emojis': 'эмоджи',
      'topic_category': 'категория',
      'numeric_id': 'ID',
      'username': 'имя пользователя',
      'labels': 'метки',
      'status': 'статус',
      'is_private': 'приватный'
    }
    return translations[key] || key.replace(/_/g, ' ')
  }

  const columns = useMemo(() => {
    if (!data?.rows?.length) return []
    const firstRow = data.rows[0] as Record<string, any>
    return Object.keys(firstRow).map(key => ({
      key,
      label: getColumnTranslation(key)
    }))
  }, [data?.rows])

  const handleSearch = () => {
    setFilters(prev => ({ 
      ...prev, 
      search: searchInput, 
      search_questions: searchQuestionsInput,
      search_emails: searchEmailsInput,
      search_tg_links: searchTgLinksInput,
      search_www_links: searchWwwLinksInput,
      search_mentions: searchMentionsInput,
      search_hashtags: searchHashtagsInput,
      search_phones: searchPhonesInput,
      search_intense_words: searchIntenseWordsInput,
      search_exclamations: searchExclamationsInput,
      search_emojis: searchEmojisInput,
      page: 1 
    }))
  }

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'desc' ? 'asc' : 'desc',
      page: 1
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey)
      } else {
        newSet.add(columnKey)
      }
      return newSet
    })
  }

  const displayedColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.key))
  }, [columns, visibleColumns])

  const formatCellValue = (value: any, columnKey?: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    
    // Форматирование дат для столбцов с датами
    if (columnKey && ['date', 'created_at', 'updated_at'].includes(columnKey)) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
          ]
          
          const day = date.getDate()
          const month = months[date.getMonth()]
          const year = date.getFullYear()
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          
          return `${day} ${month} ${year} ${hours}:${minutes}`
        }
      } catch (error) {
        // Если не удается распарсить дату, возвращаем как есть
      }
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    return String(value)
  }

  // Функция для полного отображения в tooltip'ах
  const formatFullValue = (value: any, columnKey?: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    
    // Форматирование дат для столбцов с датами
    if (columnKey && ['date', 'created_at', 'updated_at'].includes(columnKey)) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
          ]
          
          const day = date.getDate()
          const month = months[date.getMonth()]
          const year = date.getFullYear()
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          
          return `${day} ${month} ${year} ${hours}:${minutes}`
        }
      } catch (error) {
        // Если не удается распарсить дату, возвращаем как есть
      }
    }
    
    // Возвращаем полный текст без обрезания
    return String(value)
  }

  const totalPages = data ? Math.ceil(data.total / (filters.page_size || 50)) : 0
  const currentPage = filters.page || 1

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">
          Error loading table data: {(error as Error).message}
        </div>
        <button
          onClick={() => refetch()}
          className="tgate-button px-4 py-2"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1 bg-tgate-panel/50 p-1 rounded-lg border border-tgate-border/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                  <input
                    type="text"
                    placeholder="Поиск по контенту..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={isFetching}
                className="tgate-button px-4 py-2 disabled:opacity-50"
              >
                {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
              </button>
              <button
                onClick={() => setShowSearchHelp(true)}
                className="px-3 py-2 bg-tgate-panel text-tgate-text rounded-lg hover:bg-tgate-primary/10 border border-tgate-border"
                title="Справка по поиску"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.page_size}
              onChange={(e) => setFilters(prev => ({ ...prev, page_size: Number(e.target.value), page: 1 }))}
              className="bg-tgate-panel text-tgate-text px-3 py-2 rounded-lg focus:outline-none cursor-pointer border border-tgate-border hover:bg-tgate-primary/10"
              style={{ backgroundColor: '#2d2d2d' }}
            >
              {ROWS_PER_PAGE_OPTIONS.map(size => (
                <option key={size} value={size} style={{ backgroundColor: '#2d2d2d', color: '#e0e0e0' }}>{size} rows</option>
              ))}
            </select>
            
            {/* Real-time connection indicator */}
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
              isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
            
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 border border-tgate-border rounded-lg hover:bg-tgate-primary/10 disabled:opacity-50 text-tgate-text"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {tableName === 'telegram_message' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-tgate-panel hover:bg-tgate-primary/10 rounded-lg transition-colors text-tgate-text border border-tgate-border"
            >
              <Search className="h-4 w-4" />
              {showFilters ? 'Скрыть' : 'Развёрнутый поиск'}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          
          {(tableName === 'telegram_message' || tableName === 'tg_objects') && (
            <button
              onClick={() => setShowColumnControls(!showColumnControls)}
              className="flex items-center gap-2 px-4 py-2 bg-tgate-panel hover:bg-tgate-primary/10 rounded-lg transition-colors text-tgate-text border border-tgate-border"
            >
              <Eye className="h-4 w-4" />
              {showColumnControls ? 'Скрыть колонки' : 'Управление колонками'}
              {showColumnControls ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Additional search fields - collapsible */}
        {tableName === 'telegram_message' && showFilters && (
          <div className="border-t border-tgate-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Questions */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="вопросительные предложения"
                  value={searchQuestionsInput}
                  onChange={(e) => setSearchQuestionsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Emails */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="email"
                  value={searchEmailsInput}
                  onChange={(e) => setSearchEmailsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* TG Links */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="телеграм ссылка"
                  value={searchTgLinksInput}
                  onChange={(e) => setSearchTgLinksInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* WWW Links */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="интернет ссылка"
                  value={searchWwwLinksInput}
                  onChange={(e) => setSearchWwwLinksInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Mentions */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="логин"
                  value={searchMentionsInput}
                  onChange={(e) => setSearchMentionsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Hashtags */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="хештеги"
                  value={searchHashtagsInput}
                  onChange={(e) => setSearchHashtagsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Phone Numbers */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="номера телефонов"
                  value={searchPhonesInput}
                  onChange={(e) => setSearchPhonesInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Intense Words */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="кричащие слова"
                  value={searchIntenseWordsInput}
                  onChange={(e) => setSearchIntenseWordsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Exclamations */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="восклицательные предложения"
                  value={searchExclamationsInput}
                  onChange={(e) => setSearchExclamationsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
              
              {/* Emojis */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tgate-text-muted" />
                <input
                  type="text"
                  placeholder="эмоджи"
                  value={searchEmojisInput}
                  onChange={(e) => setSearchEmojisInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="tgate-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Column visibility controls - separate collapsible section */}
        {(tableName === 'telegram_message' || tableName === 'tg_objects') && showColumnControls && (
          <div className="border-t border-tgate-border pt-4">
            {columns.length > 0 && (
              <div className="p-3 bg-tgate-panel rounded-lg border border-tgate-border">
                <div className="flex flex-wrap gap-2">
                  {columns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleColumnVisibility(col.key)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        visibleColumns.has(col.key)
                          ? 'bg-tgate-primary/20 text-tgate-primary border border-tgate-primary/30'
                          : 'bg-tgate-dark text-tgate-text-muted border border-tgate-border'
                      }`}
                    >
                      {visibleColumns.has(col.key) ? (
                        <Eye className="h-3 w-3 mr-1" />
                      ) : (
                        <EyeOff className="h-3 w-3 mr-1" />
                      )}
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-tgate-primary" />
            <span className="ml-2 text-tgate-text">Loading...</span>
          </div>
        ) : !data?.rows?.length ? (
          <div className="text-center py-12 text-tgate-text-muted">
            No data found for table "{tableName}"
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {displayedColumns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-2 text-left text-[10px] font-normal text-tgate-text cursor-pointer hover:bg-tgate-primary/5 select-none whitespace-pre-line leading-tight"
                  >
                    <div className="flex items-start gap-1">
                      <span className="flex-1">{col.label}</span>
                      {filters.sort_by === col.key && (
                        <div className="flex-shrink-0 mt-0.5">
                          {filters.sort_order === 'desc' ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronUp className="h-3 w-3" />
                          }
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any, idx) => (
                <tr key={idx}>
                  {displayedColumns.map(col => {
                    const cellValue = formatCellValue(row[col.key], col.key)
                    const fullValue = formatFullValue(row[col.key], col.key)
                    const shouldShowTooltip = col.key === 'text_string' || fullValue.length > 100
                    
                    return (
                      <td 
                        key={col.key} 
                        className={`px-4 py-3 max-w-xs relative ${
                          col.key === 'text_string' 
                            ? 'text-base font-reading leading-relaxed' 
                            : 'text-sm'
                        }`}
                        onMouseEnter={() => shouldShowTooltip && setHoveredCell({row: idx, col: col.key})}
                        onMouseLeave={() => setHoveredCell(null)}
                        onMouseMove={(e) => {
                          if (shouldShowTooltip && hoveredCell?.row === idx && hoveredCell?.col === col.key) {
                            setMousePosition({
                              x: e.clientX,
                              y: e.clientY
                            });
                          }
                        }}
                      >
                        <div 
                          className={`truncate ${col.key === 'text_string' ? 'max-w-lg' : ''}`}
                          title={fullValue}
                        >
                          {cellValue}
                        </div>
                        
                        {/* Tooltip */}
                        {hoveredCell?.row === idx && hoveredCell?.col === col.key && shouldShowTooltip && (
                          <div 
                            className="fixed z-[9999] bg-tgate-panel border border-tgate-border rounded-lg p-6 shadow-tgate w-[600px] max-w-[80vw] pointer-events-none"
                            style={{
                              left: `${mousePosition.x + 20}px`,
                              top: `${mousePosition.y - 50}px`,
                              transform: mousePosition.x > window.innerWidth - 650 ? 'translateX(-100%)' : 'translateX(0)',
                            }}
                          >
                            <div className={`whitespace-pre-wrap break-words ${
                              col.key === 'text_string' 
                                ? 'text-base font-reading leading-relaxed' 
                                : 'text-xs'
                            }`}>
                              {fullValue}
                            </div>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-tgate-text">
            Showing {((currentPage - 1) * (filters.page_size || 50)) + 1} to{' '}
            {Math.min(currentPage * (filters.page_size || 50), data.total)} of{' '}
            {data.total} results
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-2 border border-tgate-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tgate-primary/10 text-tgate-text"
            >
              Previous
            </button>
            
            <span className="flex items-center px-4 py-2 text-sm text-tgate-text">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 border border-tgate-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tgate-primary/10 text-tgate-text"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Search Help Modal */}
      {showSearchHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="tgate-panel rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-tgate-border">
              <h2 className="text-xl font-semibold text-tgate-text">Справка по поиску</h2>
              <button
                onClick={() => setShowSearchHelp(false)}
                className="p-1 text-tgate-text-muted hover:text-tgate-text rounded-full hover:bg-tgate-primary/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* How Search Works */}
              <div>
                <h3 className="text-lg font-medium text-tgate-text mb-3">🚀 Как работает продвинутый поиск</h3>
                <div className="bg-tgate-primary/10 p-4 rounded-lg border border-tgate-primary/20">
                  <p className="text-sm text-tgate-text mb-3">
                    Поиск объединяет <strong>два типа результатов</strong> для максимальной точности и полноты:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-tgate-panel p-3 rounded border-l-4 border-tgate-primary">
                      <h4 className="font-medium text-tgate-primary mb-1">🎯 Точные совпадения</h4>
                      <p className="text-sm text-tgate-text">Находит сообщения, которые точно соответствуют вашему запросу</p>
                    </div>
                    <div className="bg-tgate-panel p-3 rounded border-l-4 border-green-400">
                      <h4 className="font-medium text-green-400 mb-1">🔍 Похожие результаты</h4>
                      <p className="text-sm text-tgate-text">Находит сообщения с опечатками и близкими по написанию словами</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Operators */}
              <div>
                <h3 className="text-lg font-medium text-tgate-text mb-3">✨ Специальные символы для поиска</h3>
                <p className="text-sm text-tgate-text-muted mb-4">Используйте эти символы, чтобы найти именно то, что нужно</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-tgate-panel border border-tgate-border rounded-lg">
                    <thead className="bg-tgate-dark">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-tgate-primary">Что написать</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-tgate-primary">Пример</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-tgate-primary">Результат</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tgate-border">
                      <tr>
                        <td className="px-4 py-2 text-sm">
                          <code className="bg-tgate-primary/20 px-2 py-1 rounded text-tgate-primary">"кавычки"</code>
                          <br /><span className="text-xs text-tgate-text-muted">для точных фраз</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-tgate-text">"красное яблоко"</td>
                        <td className="px-4 py-2 text-sm text-tgate-text">Найдет только эту точную фразу целиком</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">
                          <code className="bg-red-400/20 px-2 py-1 rounded text-red-400">минус -</code>
                          <br /><span className="text-xs text-tgate-text-muted">чтобы исключить</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-tgate-text">кот -собака</td>
                        <td className="px-4 py-2 text-sm text-tgate-text">Про котов, но исключит сообщения с собаками</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">
                          <code className="bg-green-400/20 px-2 py-1 rounded text-green-400">OR</code>
                          <br /><span className="text-xs text-tgate-text-muted">одно ИЛИ другое</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-tgate-text">кот OR собака</td>
                        <td className="px-4 py-2 text-sm text-tgate-text">Найдет сообщения с котами или с собаками</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">
                          <code className="bg-purple-400/20 px-2 py-1 rounded text-purple-400">AND</code>
                          <br /><span className="text-xs text-tgate-text-muted">обязательно оба</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-tgate-text">кот AND мурлыкает</td>
                        <td className="px-4 py-2 text-sm text-tgate-text">Найдет только там, где есть и кот, и мурлыкает</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Examples */}
              <div>
                <h3 className="text-lg font-medium text-tgate-text mb-3">💡 Как искать эффективно</h3>
                <div className="space-y-4">
                  <div className="bg-tgate-panel p-4 rounded-lg border-2 border-tgate-border">
                    <h4 className="font-semibold text-tgate-text mb-3">🔍 Обычный поиск</h4>
                    <p className="text-sm text-tgate-text-muted mb-3">Просто введите слово или фразу — система найдет как точные, так и похожие результаты</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">кот</code>
                        <p className="text-sm text-tgate-text mt-2">Найдет: "кот", "коты", "котик", "котёнок"</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">ябллко</code>
                        <p className="text-sm text-tgate-text mt-2">Исправит опечатку и найдет "яблоко"</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-tgate-primary/10 p-4 rounded-lg border-2 border-tgate-primary/30">
                    <h4 className="font-semibold text-tgate-primary mb-3">🎯 Точный поиск</h4>
                    <p className="text-sm text-tgate-text mb-3">Используйте кавычки для поиска точной фразы</p>
                    <div className="flex items-start gap-3">
                      <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">"красное яблоко"</code>
                      <p className="text-sm text-tgate-primary mt-2">Найдет только эту точную фразу целиком</p>
                    </div>
                  </div>
                  
                  <div className="bg-red-400/10 p-4 rounded-lg border-2 border-red-400/30">
                    <h4 className="font-semibold text-red-400 mb-3">🚫 Исключить ненужное</h4>
                    <p className="text-sm text-tgate-text mb-3">Добавьте минус перед словом, чтобы исключить его из результатов</p>
                    <div className="flex items-start gap-3">
                      <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">телефон -айфон</code>
                      <p className="text-sm text-red-400 mt-2">Найдет все про телефоны, кроме айфонов</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-400/10 p-4 rounded-lg border-2 border-green-400/30">
                    <h4 className="font-semibold text-green-400 mb-3">🔄 Гибкий поиск</h4>
                    <p className="text-sm text-tgate-text mb-3">Комбинируйте слова с помощью OR и AND</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">кот OR собака</code>
                        <p className="text-sm text-green-400 mt-2">Найдет сообщения про котов или собак</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-tgate-dark px-3 py-2 rounded-lg text-sm font-mono border border-tgate-border shadow-sm text-tgate-text">котёнок AND игрушка</code>
                        <p className="text-sm text-green-400 mt-2">Найдет только там, где упоминаются и котята, и игрушки</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-tgate-border p-4 bg-tgate-dark flex justify-end">
              <button
                onClick={() => setShowSearchHelp(false)}
                className="tgate-button px-4 py-2"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}