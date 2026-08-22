import type { viewportType } from '..'
import { getConnectionResourceStore } from '..'

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
