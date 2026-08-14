import { useEffect, useEffectEvent } from 'react'

const handleDeepLink = (
  _url: string
): Promise<{
  type: 'unknown'
}> =>
  Promise.resolve({
    type: 'unknown',
  })

export const useDeepLinksObserver = () => {
  const handle = async (url: string) => {
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
