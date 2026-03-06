import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const whitespaceRegex = /\s+/g

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)).replace(whitespaceRegex, ' ').trim()
}
