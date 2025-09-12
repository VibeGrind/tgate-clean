import React, { useState, useRef, useEffect } from 'react'
import './IndexViewer.css'

const API_BASE_URL = import.meta.env.VITE_INDEX_API_URL || 'http://localhost:5005/api'

interface IndexViewerProps {}

const IndexViewer: React.FC<IndexViewerProps> = () => {
  const [links, setLinks] = useState('')
  const [delay, setDelay] = useState(63)
  const [delayUnit, setDelayUnit] = useState('сек')
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState<Array<{timestamp: string, level: string, message: string}>>([])
  const [, setCurrentSessionId] = useState<string | null>(null)
  const [remainingCount, setRemainingCount] = useState(200)
  const [, setHoursUntilReset] = useState(24)
  const [, setTotalProcessedToday] = useState(0)
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [lastResetTimestamp, setLastResetTimestamp] = useState<string | null>(null)
  const [isValidInput, setIsValidInput] = useState(false)
  const [categories, setCategories] = useState<Array<{id: string, title: string, description?: string}>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('')
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categorySearchInput, setCategorySearchInput] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  // Загружаем информацию о счетчике и настройки при запуске
  useEffect(() => {
    fetchCounterInfo()
    fetchSettings()
    // Обновляем счетчик каждые 30 секунд
    const counterInterval = setInterval(fetchCounterInfo, 30000)
    return () => clearInterval(counterInterval)
  }, [])

  // Загружаем категории при старте
  useEffect(() => {
    if (!categoriesLoaded) {
      fetchCategories()
    }
  }, [categoriesLoaded])

  // Реал-тайм таймер обратного отсчета
  useEffect(() => {
    const timerInterval = setInterval(() => {
      updateCountdown()
    }, 1000)
    
    return () => clearInterval(timerInterval)
  }, [lastResetTimestamp])

  // Валидация ввода при изменении текста и проверка хеш-ссылок
  useEffect(() => {
    setIsValidInput(validateAllLinks(links))
    
  }, [links])

  const updateCountdown = () => {
    if (!lastResetTimestamp) return
    
    try {
      const now = new Date()
      const resetTime = new Date(lastResetTimestamp)
      const nextReset = new Date(resetTime.getTime() + 24 * 60 * 60 * 1000) // +24 часа
      
      const timeDiff = nextReset.getTime() - now.getTime()
      
      if (timeDiff <= 0) {
        // Время истекло, обновляем данные
        setTimeUntilReset({ hours: 0, minutes: 0, seconds: 0 })
        fetchCounterInfo()
        return
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      
      setTimeUntilReset({ hours, minutes, seconds })
    } catch (error) {
      console.error('Error updating countdown:', error)
    }
  }

  const formatTime = (time: {hours: number, minutes: number, seconds: number}) => {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`
  }

  const fetchCounterInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/counter`)
      if (response.ok) {
        const data = await response.json()
        setRemainingCount(data.remaining_count || 200)
        setHoursUntilReset(data.hours_until_reset || 24)
        setTotalProcessedToday(data.total_processed_today || 0)
        setLastResetTimestamp(data.last_reset_timestamp)
        
        // Обновляем таймер сразу при получении новых данных
        if (data.last_reset_timestamp) {
          updateCountdownFromTimestamp(data.last_reset_timestamp)
        }
      }
    } catch (error) {
      console.error('Error fetching counter info:', error)
    }
  }

  const updateCountdownFromTimestamp = (timestamp: string) => {
    try {
      const now = new Date()
      const resetTime = new Date(timestamp)
      const nextReset = new Date(resetTime.getTime() + 24 * 60 * 60 * 1000) // +24 часа
      
      const timeDiff = nextReset.getTime() - now.getTime()
      
      if (timeDiff <= 0) {
        setTimeUntilReset({ hours: 0, minutes: 0, seconds: 0 })
        return
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      
      setTimeUntilReset({ hours, minutes, seconds })
    } catch (error) {
      console.error('Error calculating countdown:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setDelay(data.settings.default_batch_delay)
          addLog('info', `Загружены настройки: задержка ${data.settings.default_batch_delay} сек`)
        }
      }
    } catch (error) {
      console.log('Error loading settings:', error)
    }
  }

  const fetchCategories = async () => {
    console.log('=== НАЧАЛО fetchCategories ===')
    console.log('API_BASE_URL:', API_BASE_URL)
    console.log('Полный URL:', `${API_BASE_URL}/categories`)
    
    try {
      console.log('Делаем fetch запрос...')
      const response = await fetch(`${API_BASE_URL}/categories`)
      console.log('Response статус:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        console.log('Парсим JSON...')
        const data = await response.json()
        console.log('Полученные данные:', data)
        console.log('data.success:', data.success)
        console.log('data.categories длина:', data.categories?.length)
        
        if (data.success) {
          console.log('SUCCESS: Устанавливаем категории')
          setCategories(data.categories || [])
          setCategoriesLoaded(true)
          addLog('info', `Загружено ${data.categories?.length || 0} категорий`)
        } else {
          console.log('ERROR: data.success = false')
          addLog('error', `Ошибка загрузки категорий: ${data.error}`)
        }
      } else {
        console.log('ERROR: Response не ok, статус:', response.status)
        addLog('error', `Ошибка загрузки категорий: HTTP ${response.status}`)
      }
    } catch (error) {
      console.log('CATCH ERROR:', error)
      console.log('Error type:', (error as Error).constructor.name)
      console.log('Error message:', (error as Error).message)
      addLog('error', `Ошибка сети: ${(error as Error).message}`)
    }
    console.log('=== КОНЕЦ fetchCategories ===')
  }

  const pollProcessingStatus = (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/status/${sessionId}`)
        const data = await response.json()
        
        if (data.success) {
          // Добавляем новые логи
          if (data.logs && data.logs.length > 0) {
            data.logs.forEach((logMessage: string) => {
              addLog('info', logMessage)
            })
          }
          
          // Если обработка завершена - останавливаем polling
          if (data.completed) {
            clearInterval(pollInterval)
            addLog('success', `🎉 Батч обработка завершена! Обработано: ${data.processed}/${data.total}, ошибок: ${data.failed}`)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Проверяем каждые 2 секунды
    
    return pollInterval
  }

  const addLog = (level: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    
    // Обрабатываем специальные случаи
    let processedMessage = message
    let processedLevel = level
    
    // Удаляем информацию о счетчике из сообщений
    processedMessage = processedMessage.replace(/\s*\(осталось в счетчике: \d+\)/g, '')
    processedMessage = processedMessage.replace(/\. Осталось в счетчике: \d+/g, '')
    
    // Заменяем текст сообщений
    processedMessage = processedMessage.replace(/Начата обработка (\d+) ссылок?/g, 'Получаем данные $1 объектов')
    processedMessage = processedMessage.replace(/Обработка завершена\./g, 'Все данные получены.')
    
    // Выделяем ожидание жирным
    processedMessage = processedMessage.replace(/(Ожидание \d+ секунд[^\.]*)/g, '<strong>$1</strong>')
    
    // Обрабатываем ссылки - оборачиваем в span с классом
    processedMessage = processedMessage.replace(/(https?:\/\/[^\s]+)/g, '<span class="log-link">$1</span>')
    
    // Обрабатываем финишное сообщение
    if (message.includes('Обработка завершена') || processedMessage.includes('Все данные получены')) {
      processedLevel = 'finish'
      processedMessage = processedMessage + ' 🎉'
    }
    
    setLogs(prev => [...prev, { timestamp, level: processedLevel, message: processedMessage }])
  }

  // const clearLogs = () => {
  //   setLogs([])
  // }

  const isValidLinkFormat = (link: string) => {
    // Убираем пробелы для проверки
    const trimmedLink = link.trim()
    
    if (trimmedLink.length === 0) {
      return false // Пустые строки не допускаются
    }
    
    // Формат 1: https://t.me/username или https://t.me/+hash
    if (trimmedLink.startsWith('https://t.me/')) {
      const afterDomain = trimmedLink.substring('https://t.me/'.length)
      // Проверяем что после домена есть корректное имя или хэш
      // Username не может начинаться с цифры, но хэш с + может
      if (afterDomain.startsWith('+')) {
        return /^\+[a-zA-Z0-9_+-]+$/.test(afterDomain) && afterDomain.length > 1
      } else {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(afterDomain) && afterDomain.length > 0
      }
    }
    
    // Формат 2: @username
    if (trimmedLink.startsWith('@')) {
      const username = trimmedLink.substring(1)
      // Username должен начинаться с буквы или подчеркивания, не с цифры
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(username) && username.length > 0
    }
    
    // Формат 3: простое имя (username без @)
    // Username должен начинаться с буквы или подчеркивания, не с цифры
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedLink)) {
      return true
    }
    
    return false
  }

  const validateAllLinks = (text: string) => {
    if (!text || text.trim().length === 0) {
      return false
    }
    
    const lines = text.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    
    if (nonEmptyLines.length === 0) {
      return false
    }
    
    // Все непустые строки должны быть корректными ссылками
    return nonEmptyLines.every(line => isValidLinkFormat(line))
  }

  const normalizeLink = (link: string) => {
    // Убираем пробелы
    link = link.trim()
    
    // Если уже полная ссылка https://t.me/
    if (link.startsWith('https://t.me/')) {
      return link
    }
    
    // Если начинается с @, убираем @ и добавляем https://t.me/
    if (link.startsWith('@')) {
      return `https://t.me/${link.substring(1)}`
    }
    
    // Если простое имя без @ и без https://, добавляем https://t.me/
    if (link.length > 0 && !link.includes('/') && !link.includes('@')) {
      return `https://t.me/${link}`
    }
    
    // Возвращаем как есть в остальных случаях
    return link
  }

  const parseLinks = (text: string) => {
    return text
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0)
      .map(link => normalizeLink(link))
  }


  const processLinks = async () => {
    const linksList = parseLinks(links)
    
    if (linksList.length === 0) {
      addLog('error', 'Не указаны ссылки для обработки')
      return
    }

    // Проверяем выбор категории 
    if (!selectedCategoryId) {
      addLog('error', 'Выберите категорию')
      return
    }

    // Сначала проверяем дубликаты
    addLog('info', `Проверяем ${linksList.length} ссылок на дубликаты в базе данных...`)
    
    try {
      const duplicateResponse = await fetch(`${API_BASE_URL}/check-duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          links: linksList
        })
      })
      
      if (!duplicateResponse.ok) {
        throw new Error(`HTTP error! status: ${duplicateResponse.status}`)
      }
      
      const duplicateResult = await duplicateResponse.json()
      
      if (!duplicateResult.success) {
        addLog('error', `Ошибка проверки дубликатов: ${duplicateResult.error}`)
        return
      }
      
      // Обновляем поле ввода только уникальными ссылками
      const uniqueLinks = duplicateResult.unique_links
      setLinks(uniqueLinks.join('\n'))
      
      // Логируем результаты проверки
      if (duplicateResult.duplicate_count > 0) {
        addLog('warning', `Найдено ${duplicateResult.duplicate_count} дубликатов, они удалены из списка`)
        duplicateResult.duplicates.forEach((duplicate: string) => {
          addLog('warning', `Дубликат: ${duplicate} уже есть в базе данных`)
        })
      }
      
      if (duplicateResult.warnings && duplicateResult.warnings.length > 0) {
        duplicateResult.warnings.forEach((warning: string) => {
          addLog('warning', warning)
        })
      }
      
      if (uniqueLinks.length === 0) {
        addLog('error', 'Все ссылки уже существуют в базе данных')
        return
      }
      
      addLog('info', `Осталось ${uniqueLinks.length} уникальных ссылок для обработки`)
      
      // Проверяем достаточно ли ссылок в счетчике
      if (remainingCount < uniqueLinks.length) {
        addLog('error', `Недостаточно ссылок. Осталось: ${remainingCount}, требуется: ${uniqueLinks.length}`)
        return
      }
      
    } catch (error) {
      addLog('error', `Ошибка при проверке дубликатов: ${error}`)
      return
    }

    // Получаем актуальный список уникальных ссылок
    const finalLinksList = parseLinks(links) // Используем обновлённое поле ввода
    
    setIsProcessing(true)
    
    addLog('info', `Обработка ${finalLinksList.length} ссылок началась`)
    
    // Генерируем уникальный session ID для polling
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    setCurrentSessionId(sessionId)
    
    // Начинаем polling статуса
    const pollInterval = pollProcessingStatus(sessionId)
    
    try {
      console.log('Начинаю батч обработку ссылок')
      
      // Преобразуем задержку в секунды для API
      const batchDelaySeconds = delayUnit === 'мин' ? delay * 60 : delayUnit === 'час' ? delay * 3600 : delay
      
      
      const response = await fetch(`${API_BASE_URL}/process-links-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          links: finalLinksList,
          category: selectedCategoryTitle,
          batch_delay: batchDelaySeconds,
          session_id: sessionId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Логи приходят через polling, здесь только обновляем счетчик
        if (result.remaining_count !== undefined) {
          setRemainingCount(result.remaining_count)
        }
      } else {
        addLog('error', `❌ Ошибка батч обработки: ${result.message || result.error}`)
        clearInterval(pollInterval)
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      addLog('error', `Ошибка сети: ${(error as Error).message}`)
      clearInterval(pollInterval)
    } finally {
      setLinks('')
      setIsProcessing(false)
      setCurrentSessionId(null)
    }
  }

  // Category modal functions
  const selectCategory = (category: {id: string, title: string, description?: string}) => {
    setSelectedCategoryId(category.id)
    setSelectedCategoryTitle(category.title)
    // Автоматически закрываем модальное окно при выборе категории
    setShowCategoryModal(false)
    setCategorySearchInput('')
  }



  const getFilteredCategories = () => {
    if (!categorySearchInput) return categories
    const searchTerm = categorySearchInput.toLowerCase()
    return categories.filter(category => 
      category.title.toLowerCase().includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm))
    )
  }

  return (
    <div className="container">
      <div className="control-panel">
        {/* Прогресс-бар лимитов */}
        <div className="counter-section">
          <video className="counter-background-video" autoPlay muted loop>
            <source src={`${import.meta.env.BASE_URL}keyword.mp4`} type="video/mp4" />
          </video>
          <div className="counter-content">
            <div className="counter-header">
              <span className="counter-title">Лимит аккаунта</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{background: `linear-gradient(to right, #0088cc 0%, #0088cc ${((200 - remainingCount) / 200) * 100}%, #555 ${((200 - remainingCount) / 200) * 100}%, #555 100%)`}}>
                <span className="progress-count">{remainingCount}</span>
                <span className="progress-timer">{formatTime(timeUntilReset)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="input-section">
          <div className="textarea-container">
            <textarea
              id="links"
              className="links-textarea"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              onPaste={(e) => {
                // Получаем вставляемый текст
                const pastedText = e.clipboardData.getData('text')
                if (pastedText) {
                  // Предотвращаем стандартную вставку
                  e.preventDefault()
                  
                  // Добавляем новую строку в конце если текст не заканчивается на \n
                  const textToAdd = pastedText.endsWith('\n') ? pastedText : pastedText + '\n'
                  const currentValue = e.currentTarget.value
                  const cursorPosition = e.currentTarget.selectionStart
                  
                  // Вставляем текст в позицию курсора
                  const newValue = currentValue.slice(0, cursorPosition) + textToAdd + currentValue.slice(e.currentTarget.selectionEnd)
                  setLinks(newValue)
                  
                  // Перемещаем курсор в конец
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = cursorPosition + textToAdd.length
                  }, 0)
                }
              }}
placeholder={`Поместите каждую ссылку на новой строчке:

https://t.me/+iGJVxZANxyM0Mzg9
https://t.me/example
@example
example`}
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Category selection button */}
        <div className="category-section">
          <label className="category-label">Категория:</label>
          <button
            className={`category-select-button ${selectedCategoryId ? 'selected' : ''}`}
            onClick={() => setShowCategoryModal(true)}
            disabled={isProcessing || !categoriesLoaded}
          >
            {selectedCategoryTitle || 'Выберите категорию...'}
            <span className="category-arrow">▼</span>
          </button>
          {!categoriesLoaded && (
            <div className="category-loading">Загрузка категорий...</div>
          )}
        </div>

        <div className="controls-and-delay">
          <div className="index-controls">
            <button
              className={`magic-button ${isProcessing ? 'processing' : ''}`}
              onClick={processLinks}
              disabled={isProcessing || !isValidInput || remainingCount <= 0 || !selectedCategoryId}
            >
              <span className="magic-button-content">
                <span className="magic-arrow">▶</span>
                <span className="magic-text">{isProcessing ? 'Обработка...' : 'RUN'}</span>
              </span>
            </button>
          </div>
          
          <div className="delay-section">
            <div className="delay-label-top">
              Ожидание между
            </div>
            <div className="delay-input-row">
              <input
                id="delay"
                type="number"
                className="delay-input"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value) || 60)}
                min="1"
                max="3600"
                disabled={isProcessing}
              />
              <select 
                className="delay-unit-select"
                value={delayUnit}
                onChange={(e) => {
                  const newUnit = e.target.value
                  setDelayUnit(newUnit)
                  // Устанавливаем значение по умолчанию для каждой единицы
                  if (newUnit === 'сек') {
                    setDelay(120)
                  } else if (newUnit === 'мин') {
                    setDelay(30)
                  } else if (newUnit === 'час') {
                    setDelay(2)
                  }
                }}
                disabled={isProcessing}
              >
                <option value="сек">сек</option>
                <option value="мин">мин</option>
                <option value="час">час</option>
              </select>
            </div>
          </div>
        </div>


        <div className="logs-section">
          <div className="logs-container">
            {logs.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                История работы программы...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className={`log-level ${log.level}`}>
                    {log.level === 'finish' ? 'FINISH' : log.level.toUpperCase()}
                  </span>
                  <span className={`log-message ${log.level}`} dangerouslySetInnerHTML={{ __html: log.message }}></span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
          
          <div className="designer-signature">
            Design by <span className="designer-name">Irina Vutkareva</span>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="category-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="category-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h2 className="category-modal-title">Выберите категорию</h2>
              <button
                className="category-modal-close"
                onClick={() => setShowCategoryModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="category-modal-content">
              <div className="category-search-container">
                <input 
                  type="text" 
                  className="category-search-input" 
                  placeholder="Найти категорию..." 
                  value={categorySearchInput}
                  onChange={(e) => setCategorySearchInput(e.target.value)}
                />
                <span className="category-search-icon">🔍</span>
              </div>

              <div className="category-grid">
                {getFilteredCategories().map(category => (
                  <div
                    key={category.id}
                    className={`category-item ${selectedCategoryId === category.id ? 'selected' : ''}`}
                    onClick={() => selectCategory(category)}
                  >
                    <div className="category-text">
                      <div className="category-name">{category.title}</div>
                      {category.description && (
                        <div className="category-description">{category.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="category-modal-actions">
              <button 
                className="category-cancel-button" 
                onClick={() => setShowCategoryModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexViewer