import { useEffect, useState } from 'react'

export function useElapsed(running) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) {
      setSeconds(0)
      return
    }
    const start = Date.now()
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500)
    return () => clearInterval(id)
  }, [running])
  return seconds
}