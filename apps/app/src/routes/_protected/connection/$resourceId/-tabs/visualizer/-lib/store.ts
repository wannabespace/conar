import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

export const viewportType = type({
  x: 'number',
  y: 'number',
  zoom: 'number',
})

export const visualizerPageType = type({
  viewports: {
    '[string]': viewportType,
  },
})

const defaultState: typeof visualizerPageType.infer = {
  viewports: {},
}

export const visualizerPageStore = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: defaultState,
    key: `${resourceId}.visualizer.store`,
    schema: visualizerPageType,
    type: 'localStorage',
  })
)

type VisualizerPageStore = ReturnType<typeof visualizerPageStore>

export const setSchemaViewport = (
  store: VisualizerPageStore,
  schema: string,
  viewport: typeof viewportType.infer
) => {
  store.set(
    (state) =>
      ({
        ...state,
        viewports: {
          ...state.viewports,
          [schema]: viewport,
        },
      }) satisfies typeof state
  )
}
