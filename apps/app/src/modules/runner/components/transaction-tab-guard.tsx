import { NavigationGuard } from '~/components/navigation-guard'
import { getConnectionResourceStore } from '~/core/connection/stores'
import { permix } from '~/core/user/permissions'

import { runnerTransaction } from '../lib/transaction'

export const TransactionTabGuard = () => (
  <NavigationGuard
    title="Roll back the transaction?"
    description="Without an account one tab stays open, so opening this closes the query tab and rolls back its open transaction."
    cancel="Keep transaction"
    confirm="Roll back"
    shouldBlock={({ next }) => {
      if (
        permix.check('tab.multiple') ||
        next.routeId !== '/_protected/connection/$resourceId/$tabId'
      ) {
        return false
      }
      const { resourceId, tabId } = next.params
      return getConnectionResourceStore(resourceId)
        .get()
        .tabs.some(
          (tab) =>
            tab.id !== tabId &&
            runnerTransaction.state({ resourceId, tabId: tab.id }).get()
        )
    }}
  />
)
