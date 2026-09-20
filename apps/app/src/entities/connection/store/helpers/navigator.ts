import { getNavigatorStore } from '../stores'

type Navigator = ReturnType<typeof getNavigatorStore>['~']['output']

const seeded = new Set<string>()

export const setNavigator = (id: string, navigator: Navigator) => {
  getNavigatorStore(id).set(navigator)
}

export const seedNavigator = (id: string, navigator: Navigator) => {
  if (seeded.has(id)) {
    return
  }

  seeded.add(id)
  setNavigator(id, navigator)
}
