import * as React from 'react'

export function useIsMounted() {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setIsMounted(true)

    return () => {
      setIsMounted(false)
    }
  }, [])

  return isMounted
}
