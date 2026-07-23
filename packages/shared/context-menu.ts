export interface NativeMenuActionItem {
  type: 'item'
  id: string
  label: string
  enabled?: boolean
  kind?: 'normal' | 'checkbox' | 'radio'
  checked?: boolean
  accelerator?: string
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
  items: NativeMenuNode[]
}

export type NativeMenuNode =
  | NativeMenuActionItem
  | NativeMenuSeparator
  | NativeMenuLabel
  | NativeMenuSubmenu

export interface MenuPopupRequest {
  items: NativeMenuNode[]
}

export type MenuPopupResult = string | null
