import * as React from 'react'

const emptySubscribe = () => () => {
  /* no-op */
}

export const useIsMounted = () =>
  React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
