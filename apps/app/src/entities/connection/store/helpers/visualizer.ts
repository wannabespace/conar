import type { Positions, viewportType } from '../stores'
import { getConnectionResourceStore } from '../stores'

const setPositions = (
  id: string,
  schema: string,
  change: (positions: Positions) => Positions
) => {
  getConnectionResourceStore(id).set(
    (state) =>
      ({
        ...state,
        visualizerPositions: {
          ...state.visualizerPositions,
          [schema]: change(state.visualizerPositions[schema] ?? {}),
        },
      }) satisfies typeof state
  )
}

export const visualizerLayout = {
  moveTable: (id: string, schema: string, from: string, to: string | null) =>
    setPositions(id, schema, ({ [from]: position, ...rest }) =>
      position && to ? { ...rest, [to]: position } : rest
    ),
  setPositions,
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
