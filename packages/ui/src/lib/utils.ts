import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clickHandlers(callback: () => void) {
  return {
    onMouseDown: callback,
    onClick: (e: React.MouseEvent<Element>) => {
      e.preventDefault()
    },
    onKeyDown: (e: React.KeyboardEvent<Element>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        callback()
      }
    },
  }
}
