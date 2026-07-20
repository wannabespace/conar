import { useEffect } from 'react'

// Mirrors native macOS chrome dimming: while the window is inactive the
// `window-blurred` class on <html> swaps accent tokens to neutral grays
// (see globals.css).
export function useWindowFocusObserver() {
  useEffect(() => {
    return window.electron?.app.onFocusChange(isFocused => {
      document.documentElement.classList.toggle('window-blurred', !isFocused)
    })
  }, [])
}
