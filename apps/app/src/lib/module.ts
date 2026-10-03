import type { IconSvgElement } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter } from '@tamery/shared/filters'
import type { ComponentType, ReactNode } from 'react'
import type { Readable, Subscribable, Writable } from 'seitu'

import type { Connection, ConnectionResource } from '~/core/connection/sync'

// Methods, not properties: method parameters are bivariant, so a kind or view
// typed with its own params still fits the registry's `TabKind[]` / `TabView`.
// Annotate a view as `TabView<Params>` before registering it.
/* oxlint-disable typescript/method-signature-style */
export interface TabKind<Params = unknown> {
  available?(params: Params, connectionType: ConnectionType): boolean
  fullTitle?(params: Params): string
  icon: IconSvgElement
  label?(params: Params, siblings: Params[]): string
  match(id: string): Params | null
  onActivate?(resourceId: string, params: Params): void
  onClose?(resourceId: string, id: string): void
  title(params: Params): string
  type: string
}

export interface TabContext {
  connection: Connection
  connectionResource: ConnectionResource
}

export interface TabView<Params = unknown> {
  Content(props: { id: string; params: Params }): ReactNode
  load?(context: TabContext & { params: Params; search: TabSearch }): void
  prefetch?(connectionResource: ConnectionResource, params: Params): void
  Refresh?(props: { params: Params }): ReactNode
}
/* oxlint-enable typescript/method-signature-style */

// Sync with the `$tabId` route's validateSearch.
export interface TabSearch {
  create?: string
  filters?: ActiveFilter[]
  open?: string
  orderBy?: Record<string, 'ASC' | 'DESC'>
  schema?: string
}

export const SCHEMA_GROUPS = [
  'Overview',
  'Structure',
  'Types',
  'Logic',
  'Security',
] as const

export interface SchemaItem {
  available?: (connectionType: ConnectionType) => boolean
  group: (typeof SCHEMA_GROUPS)[number]
  icon: IconSvgElement
  label: string
  order: number
  tabId: string
}

export interface NewTabAction {
  icon: IconSvgElement
  keywords: string[]
  label: string
  open: (resourceId: string) => string
}

export interface CommandEntry {
  action: () => void
  group: 'Navigation' | 'Database' | 'View' | 'Application'
  icon: IconSvgElement
  keywords: string[]
  order: number
  shortcut?: string
  value: string
}

export interface CommandContext {
  current?: TabContext
  tabId?: string
}

export interface Slotted<Props = object> {
  Component: ComponentType<Props>
  order: number
}

export type PanelOpen = Readable<boolean> &
  Subscribable<boolean> &
  Writable<boolean>

export interface Panel {
  Component: ComponentType
  defaultSize: number
  id: string
  label: string
  maxSize: number | `${number}%`
  minSize: number
  open: (resourceId: string) => PanelOpen
  region: 'left' | 'right' | 'bottom'
}

/** `modules/<name>/module.ts` — loaded with the app entry, so it must stay off the data layer. */
export interface AppModule {
  mounts?: ComponentType[]
  newTabActions?: NewTabAction[]
  schemaItems?: SchemaItem[]
  tabs?: TabKind[]
}

/** `modules/<name>/protected.tsx` — loaded with the signed-in layout. */
export interface ProtectedModule {
  banners?: Slotted[]
  mounts?: ComponentType[]
  titlebar?: Slotted[]
  commands?: (context: CommandContext) => CommandEntry[]
}

/** `modules/<name>/workspace.tsx` — loaded with the connection workspace layout. */
export interface WorkspaceModule {
  emptyPane?: Slotted[]
  header?: ComponentType
  mounts?: ComponentType[]
  panels?: Panel[]
  referenceTable?: ComponentType<{
    column: string
    schema: string
    table: string
    value: unknown
  }>
  tabBarEnd?: Slotted<{ resourceId: string }>[]
  tabs?: Record<string, TabView>
}
