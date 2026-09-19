import { useEffect, useState } from 'react'

export const useDelay = (ms: number) => {
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setPassed(true), ms)

    return () => clearTimeout(timeout)
  }, [ms])

  return passed
}
