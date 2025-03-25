import { useEffect, useRef } from 'react'

interface UseDocumentTitleOptions {
  resetOnUnmount?: boolean
}

function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {},
): void {
  const isBrowser = typeof window !== 'undefined'
  const prevTitleRef = useRef(isBrowser ? document.title : '')
  const { resetOnUnmount = false } = options

  useEffect(() => {
    if (!isBrowser)
      return

    document.title = title

    const lastTitle = prevTitleRef.current

    return () => {
      if (resetOnUnmount) {
        document.title = lastTitle
      }
    }
  }, [title, isBrowser, resetOnUnmount])
}

export { useDocumentTitle }
