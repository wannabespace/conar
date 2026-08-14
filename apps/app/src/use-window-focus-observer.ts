import { useEffect } from 'react'

export const useWindowFocusObserver = () => {
  useEffect(
    () =>
      window.electron?.app.onFocusChange((isFocused) => {
        document.documentElement.classList.toggle('window-blurred', !isFocused)
      }),
    []
  )
}
