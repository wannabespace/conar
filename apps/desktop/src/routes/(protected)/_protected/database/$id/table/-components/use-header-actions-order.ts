import { omit } from '@conar/shared/utils/helpers'
import { usePageStoreContext } from '../-store'

export function useHeaderActionsOrder() {
  const store = usePageStoreContext()

  const setOrder = (columnId: string, order: 'ASC' | 'DESC') => {
    store.setState(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [columnId]: order,
      },
    } satisfies typeof state))
  }

  const removeOrder = (columnId: string) => {
    store.setState(state => ({
      ...state,
      orderBy: omit(state.orderBy, [columnId]),
    } satisfies typeof state))
  }

  const onOrder = (columnId: string) => {
    const currentOrder = store.state.orderBy?.[columnId]

    if (currentOrder === 'ASC') {
      setOrder(columnId, 'DESC')
    }
    else if (currentOrder === 'DESC') {
      removeOrder(columnId)
    }
    else {
      setOrder(columnId, 'ASC')
    }
  }

  return {
    setOrder,
    removeOrder,
    onOrder,
  }
}
