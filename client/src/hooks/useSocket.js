import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

function useSocket() {
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== 'undefined' ? window.location.origin : undefined)

  const socket = useMemo(() => {
    if (!socketUrl) {
      return null
    }

    return io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }, [socketUrl])

  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      return undefined
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
      setIsConnected(false)
    }
  }, [socket])

  return {
    socket,
    isConnected,
  }
}

export default useSocket
