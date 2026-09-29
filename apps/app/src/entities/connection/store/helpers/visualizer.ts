import type { viewportType } from '../stores'
import { getConnectionResourceStore } from '../stores'

export const visualizerLayout = {
  setPositions: (
    id: string,
    schema: string,
    positions: Record<string, { x: number; y: number }>
  ) => {
    getConnectionResourceStore(id).set(
      (state) =>
        ({
          ...state,
          visualizerPositions: {
            ...state.visualizerPositions,
            [schema]: positions,
          },
        }) satisfies typeof state
    )
  },
  setViewport: (
    id: string,
    schema: string,
    viewport: typeof viewportType.infer
  ) => {
    getConnectionResourceStore(id).set(
      (state) =>
        ({
          ...state,
          visualizerViewports: {
            ...state.visualizerViewports,
            [schema]: viewport,
          },
        }) satisfies typeof state
    )
  },
}
