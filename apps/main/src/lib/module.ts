import type { ComponentType } from 'react'

export interface Slotted {
  Component: ComponentType
  order: number
}

/** `modules/<name>/module.tsx`; a module's pages live in its own `routes/`, mirroring where they mount. */
export interface MainModule {
  accountNav?: Slotted[]
  authFooter?: Slotted[]
  footerLinks?: Slotted[]
  headerLinks?: Slotted[]
  homeSections?: Slotted[]
}
