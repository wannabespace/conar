import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { enabledFilters } from '@tamery/shared/filters'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { deleteRowsQuery } from '~/core/queries/rows/delete'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTableTotalQueryKey } from '~/core/queries/rows/total'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { useTableSessionStore } from '~/core/table/session'
import { usePermissions } from '~/core/user/permissions'
import { queryClient } from '~/lib/query-client'
import { NO_GUEST_FEATURES } from '~/store'

import { useTablePageStore } from '../../../lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ActionsDelete = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const canEdit = usePermissions().check('database.edit')
  const { connectionResource } = useRouteContext()
  const [isOpened, setIsOpened] = useState(false)
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const selected = useSubscription(sessionStore, {
    selector: (state) => state.selected,
  })

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await deleteRowsQuery({ primaryKeys: selected, schema, table }).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onError: (error) => {
      toast.error('Failed to delete rows', {
        description: error.message,
      })
    },
    onSuccess: () => {
      toast.success(
        `${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`
      )
      queryClient.invalidateQueries(
        resourceRowsQueryInfiniteOptions({
          connectionResource,
          query: {
            filters: enabledFilters(store.get().filters),
            orderBy: store.get().orderBy,
          },
          schema,
          table,
        })
      )
      queryClient.invalidateQueries({
        queryKey: resourceTableTotalQueryKey({
          connectionResource,
          schema,
          table,
        }),
      })
      sessionStore.set((state) => ({ ...state, selected: [] }))
    },
  })

  return (
    <>
      <AlertDialog open={isOpened} onOpenChange={setIsOpened}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm row
              {selected.length === 1 ? '' : 's'} deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected {selected.length}{' '}
              {selected.length === 1 ? 'row' : 'rows'} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogCancel
              variant="destructive"
              onClick={() => deleteRows()}
            >
              <LoadingContent loading={isDeleting}>
                Delete {selected.length} selected row
                {selected.length === 1 ? '' : 's'}
              </LoadingContent>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              variant="destructive"
              disabled={!canEdit}
              focusableWhenDisabled
              data-guest-locked={canEdit ? undefined : NO_GUEST_FEATURES.edit}
              onClick={() => setIsOpened(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              <span>
                Delete (
                <NumberFlow
                  spinTiming={{ duration: 200 }}
                  value={selected.length}
                  className="tabular-nums"
                />
                )
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
