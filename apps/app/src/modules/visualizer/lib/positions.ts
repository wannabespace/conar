import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

const viewportType = type({
  x: 'number',
  y: 'number',
  zoom: 'number',
})

const positionsType = type({
  '[string]': { x: 'number', y: 'number' },
})

export type Positions = typeof positionsType.infer

export const visualizerStore = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: { positions: {}, viewports: {} },
    key: `visualizer-${resourceId}`,
    schema: type({
      positions: { '[string]': positionsType },
      viewports: { '[string]': viewportType },
    }),
    type: 'localStorage',
  })
)

const setPositions = (
  id: string,
  schema: string,
  change: (positions: Positions) => Positions
) => {
  visualizerStore(id).set(
    (state) =>
      ({
        ...state,
        positions: {
          ...state.positions,
          [schema]: change(state.positions[schema] ?? {}),
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
    visualizerStore(id).set(
      (state) =>
        ({
          ...state,
          viewports: { ...state.viewports, [schema]: viewport },
        }) satisfies typeof state
    )
  },
}
