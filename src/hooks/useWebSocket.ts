import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface WebSocketMessage {
  channel: string
  payload: any
}

export function useWebSocket(tableName: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const queryClient = useQueryClient()
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const WS_BASE_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000'

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      ws.current = new WebSocket(`${WS_BASE_URL}/ws/${tableName}`)

      ws.current.onopen = () => {
        console.log(`WebSocket connected for table: ${tableName}`)
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Invalidate relevant queries to trigger refetch
          if (message.channel.includes(tableName) || message.channel.includes('_changes')) {
            queryClient.invalidateQueries({
              queryKey: ['table', tableName]
            })
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log(`WebSocket closed for table: ${tableName}`, event.code, event.reason)
        setIsConnected(false)

        // Attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          console.log(`Attempting to reconnect in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error(`WebSocket error for table: ${tableName}`, error)
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect')
      ws.current = null
    }
    setIsConnected(false)
  }

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [tableName])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect
  }
}