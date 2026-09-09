import { getNavigatorStore } from '../stores'

export const setNavigator = (
  id: string,
  navigator: ReturnType<typeof getNavigatorStore>['~']['output']
) => {
  getNavigatorStore(id).set(navigator)
}
