import { useEffect } from 'react'

export const useWindowFullscreenObserver = () => {
  useEffect(
    () =>
      window.electron?.app.onFullscreenChange((isFullscreen) => {
        document.documentElement.classList.toggle(
          'window-fullscreen',
          isFullscreen
        )
      }),
    []
  )
}
