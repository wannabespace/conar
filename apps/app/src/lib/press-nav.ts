import type { MouseEvent } from 'react'

export const isPlainPress = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export const pressNavProps = (fire: () => void) => ({
  onClick: (e: MouseEvent) => {
    if (e.detail === 0) {
      fire()
    }
  },
  onMouseDown: (e: MouseEvent) => {
    if (isPlainPress(e)) {
      fire()
    }
  },
})
