import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clickHandlers(callback: (e: React.MouseEvent<Element>) => void) {
  return {
    // onMouseDown: (e: React.MouseEvent<Element>) => {
    //   callback()
    // },
    onClick: (e: React.MouseEvent<Element>) => {
      // e.preventDefault()
      callback(e)
    },
    // onKeyDown: (e: React.KeyboardEvent<Element>) => {
    //   if (e.key === 'Enter' && e.target === e.currentTarget) {
    //     callback()
    //   }
    // },
  }
}
