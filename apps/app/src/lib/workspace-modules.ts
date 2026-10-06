import type { Panel, WorkspaceModule } from './module'
import { byOrder } from './modules'

// Import only from the connection workspace's chunks: the glob bundles every
// `workspace.tsx` wherever this file is imported.
const list = Object.values(
  import.meta.glob<WorkspaceModule>('/src/modules/*/workspace.tsx', {
    eager: true,
    import: 'default',
  })
)
const panels = list.flatMap((module) => module.panels ?? [])

export const workspaceModules = {
  emptyPane: byOrder(list.flatMap((module) => module.emptyPane ?? [])),
  headers: list.flatMap((module) => (module.header ? [module.header] : [])),
  mounts: list.flatMap((module) => module.mounts ?? []),
  panelIn: (region: Panel['region']) =>
    panels.find((panel) => panel.region === region),
  panels,
  tabBarEnd: byOrder(list.flatMap((module) => module.tabBarEnd ?? [])),
  tabs: Object.fromEntries(
    list.flatMap((module) => Object.entries(module.tabs ?? {}))
  ),
}
