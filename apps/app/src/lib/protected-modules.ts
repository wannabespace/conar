import type { CommandContext, ProtectedModule } from './module'
import { byOrder } from './modules'

// Import only from the signed-in layout's chunk: the glob bundles every
// `protected.tsx` wherever this file is imported.
const list = Object.values(
  import.meta.glob<ProtectedModule>('/src/modules/*/protected.tsx', {
    eager: true,
    import: 'default',
  })
)

export const protectedModules = {
  banners: byOrder(list.flatMap((module) => module.banners ?? [])),
  commands: (context: CommandContext) =>
    list.flatMap((module) => module.commands?.(context) ?? []),
  mounts: list.flatMap((module) => module.mounts ?? []),
  titlebar: byOrder(list.flatMap((module) => module.titlebar ?? [])),
}
