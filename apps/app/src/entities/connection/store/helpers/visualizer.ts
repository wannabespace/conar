import type { viewportType } from '../stores'
import { getConnectionResourceStore } from '../stores'

export const setVisualizerViewport = (
  id: string,
  schema: string,
  viewport: typeof viewportType.infer
) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        visualizerViewports: {
          ...state.visualizerViewports,
          [schema]: viewport,
        },
      }) satisfies typeof state
  )
}
