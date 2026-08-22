import type { NavigatorList } from '..'
import { getNavigatorStore } from '..'

export const setNavigator = (id: string, navigator: NavigatorList) => {
  getNavigatorStore(id).set(navigator)
}
