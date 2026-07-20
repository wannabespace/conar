import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

export const SIDEBAR_FOLD_TRANSITION = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1],
} as const

export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 420
export const SIDEBAR_DEFAULT_WIDTH = 256

export const tablesSidebarWidthValue = createWebStorageValue({
  type: 'localStorage',
  key: 'tables-sidebar-width',
  defaultValue: SIDEBAR_DEFAULT_WIDTH,
  schema: type('number'),
})
