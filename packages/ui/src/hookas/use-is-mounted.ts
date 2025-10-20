import * as React from 'react'

export function useIsMounted() {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsMounted(true)

    return () => {
      setIsMounted(false)
    }
  }, [])

  return isMounted
}
