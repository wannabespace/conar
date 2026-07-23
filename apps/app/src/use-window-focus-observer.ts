import { useEffect } from 'react'

export function useWindowFocusObserver() {
  useEffect(() => {
    return window.electron?.app.onFocusChange(isFocused => {
      document.documentElement.classList.toggle('window-blurred', !isFocused)
    })
  }, [])
}
