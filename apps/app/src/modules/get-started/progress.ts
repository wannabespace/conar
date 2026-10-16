import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

const trackedStep = type("'table' | 'query'")

const progress = createWebStorageValue({
  defaultValue: { dismissed: false, done: [] },
  key: 'get-started',
  schema: type({ dismissed: 'boolean', done: trackedStep.array() }),
  type: 'localStorage',
})

export const getStarted = {
  complete: (step: typeof trackedStep.infer) => {
    const current = progress.get()
    if (!current.done.includes(step)) {
      progress.set({ ...current, done: [...current.done, step] })
    }
  },
  dismiss: () => progress.set((current) => ({ ...current, dismissed: true })),
  progress,
}
