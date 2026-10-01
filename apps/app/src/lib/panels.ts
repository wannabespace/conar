import { type } from 'arktype'
import { memoize } from 'memoza'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { SHELL_LAYOUT_KEY } from '~/lib/constants'
import type { Panel } from '~/lib/module'
import { workspaceModules } from '~/lib/workspace-modules'

export const panelSize = memoize(
  (panel: Panel) =>
    createWebStorageValue({
      defaultValue: panel.defaultSize,
      key: `panel-size-${panel.id}`,
      schema: type('number'),
      type: 'localStorage',
    }),
  { cacheKey: (panel) => panel.id }
)

// boot.ts reads this before any JS module loads to size the shell placeholders.
export const useShellLayout = (resourceId: string) => {
  useEffect(() => {
    const { panels } = workspaceModules
    const write = () =>
      localStorage.setItem(
        SHELL_LAYOUT_KEY,
        JSON.stringify(
          Object.fromEntries(
            panels
              .filter((panel) => panel.open(resourceId).get())
              .map((panel) => [panel.region, panelSize(panel).get()])
          )
        )
      )
    const unsubscribes = panels.flatMap((panel) => [
      panel.open(resourceId).subscribe(write),
      panelSize(panel).subscribe(write),
    ])

    write()

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }
    }
  }, [resourceId])
}

const neverOpen = createStore(false)

export const usePanelOpen = (region: Panel['region'], resourceId: string) =>
  useSubscription(
    workspaceModules.panelIn(region)?.open(resourceId) ?? neverOpen
  )
