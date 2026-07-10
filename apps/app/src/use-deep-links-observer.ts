import { useEffect, useEffectEvent } from 'react'

async function handleDeepLink(_url: string): Promise<{
  type:
    | 'unknown'
}> {
  // const { pathname, searchParams } = new URL(url.replace('conar://', 'https://conar.app/'))
  return {
    type: 'unknown',
  }
}

export function useDeepLinksObserver() {
  async function handle(url: string) {
    const { type: _type } = await handleDeepLink(url)
  }

  const handleEvent = useEffectEvent(handle)

  useEffect(() => {
    if (window.initialDeepLink) {
      handleEvent(window.initialDeepLink)

      window.initialDeepLink = null
    }

    return window.electron?.app.onDeepLink(handleEvent)
  }, [])
}
