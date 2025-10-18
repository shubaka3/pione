import React, { useEffect, useRef, useState } from 'react'

function useCameraPermission() {
  const [granted, setGranted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setGranted(true))
      .catch(() => setGranted(false))
  }, [])

  const request = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setGranted(true)
    } catch (e) {
      setGranted(false)
    }
  }

  return [granted, request] as const
}

const App: React.FC = () => {
  const [permission, requestPermission] = useCameraPermission()
  const [connected, setConnected] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false) // Thêm state để quản lý trạng thái bật/tắt
  const [isRealtime, setIsRealtime] = useState(false) // Thêm state cho chế độ real-time
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<number | null>(null)

  // Chỉ kết nối khi có permission
  useEffect(() => {
    if (permission === null || !permission || !isEnabled) {
      // Đóng kết nối WebSocket nếu có
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
        setConnected(false)
      }
      return
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
    }
  }, [permission, isEnabled])

  // Quản lý việc chụp ảnh tự động
  useEffect(() => {
    if (!connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    startAutoCapture(isRealtime ? 100 : 5000) // 100ms cho real-time, 5000ms cho bình thường

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [connected, isRealtime])

  useEffect(() => {
    // attach camera stream to video element
    let mounted = true
    if (permission && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (!mounted) return
        videoRef.current!.srcObject = stream
        videoRef.current!.play().catch(() => { })
      })
    }
    return () => {
      mounted = false
      // stop video tracks
      const stream = videoRef.current?.srcObject as MediaStream | undefined
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [permission])

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    ws.onopen = () => {
      console.log('✅ Connected to server')
      setConnected(true)
    }
    ws.onerror = (e) => console.log('❌ WS error', e)
    ws.onclose = () => {
      console.log('🔌 Disconnected from server')
      setConnected(false)
    }
    wsRef.current = ws
  }

  const startAutoCapture = (interval: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current) // Xóa interval cũ
    intervalRef.current = window.setInterval(() => {
      if (!videoRef.current || wsRef.current?.readyState !== 1) return
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

      // Chỉ gửi qua WebSocket
      const payload = JSON.stringify({
        type: 'image_upload',
        image: dataUrl
      })
      wsRef.current.send(payload)
      console.log(`📤 Sent image via WebSocket (interval: ${interval}ms)`)
    }, interval)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      wsRef.current?.close()
    }
  }, [])

  if (permission === false) {
    return (
      <div className="center">
        <p>🔒 Cần quyền truy cập camera</p>
        <button onClick={() => requestPermission()}>Cấp quyền</button>
      </div>
    )
  }

  return (
    <div className="container">
      <video ref={videoRef} className="camera" playsInline muted />
      <div className="status">
        <span style={{ color: connected ? 'lime' : 'red' }}>
          {connected ? 'Đã kết nối server' : 'Chưa kết nối'}
        </span>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: isEnabled ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isEnabled ? 'Tắt kết nối' : 'Bật kết nối'}
        </button>
        {isEnabled && (
          <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="realtime"
              checked={isRealtime}
              onChange={(e) => setIsRealtime(e.target.checked)}
            />
            <label htmlFor="realtime" style={{ marginLeft: '5px', color: 'white' }}>
              Real-time
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
