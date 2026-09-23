import type { SFSymbol } from 'sf-symbols-typescript'

export type { SFSymbol } from 'sf-symbols-typescript'

export interface NativeMenuActionItem {
  type: 'item'
  id: string
  label: string
  enabled?: boolean
  kind?: 'normal' | 'checkbox' | 'radio'
  checked?: boolean
  accelerator?: string
  /** macOS only. */
  symbol?: SFSymbol
}

export interface NativeMenuSeparator {
  type: 'separator'
}

export interface NativeMenuLabel {
  type: 'label'
  label: string
}

export interface NativeMenuSubmenu {
  type: 'submenu'
  label: string
  enabled?: boolean
  symbol?: SFSymbol
  items: NativeMenuNode[]
}

export type NativeMenuNode =
  | NativeMenuActionItem
  | NativeMenuSeparator
  | NativeMenuLabel
  | NativeMenuSubmenu

export interface MenuPopupRequest {
  items: NativeMenuNode[]
  /** Window-relative CSS px; omitted = at the cursor. */
  position?: { x: number; y: number }
}

export type MenuPopupResult = string | null
