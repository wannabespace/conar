import type { MouseEvent } from 'react'

export function isPlainPress(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

export function pressNavProps(fire: () => void) {
  return {
    onMouseDown: (e: MouseEvent) => {
      if (isPlainPress(e)) fire()
    },
    onClick: (e: MouseEvent) => {
      if (e.detail === 0) fire()
    },
  }
}
