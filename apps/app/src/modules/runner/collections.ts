import { createQueriesCollection } from './sync'

declare module '~/core/collections' {
  interface Collections {
    queriesCollection: ReturnType<typeof createQueriesCollection>
  }
}

const runnerCollections = () => ({
  queriesCollection: createQueriesCollection(),
})

export default runnerCollections
