import { FileDiffIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { draftsActions, useTableSessionStore } from '~/core/table/session'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { plural } from '~/utils/plural'

import { useSaveStaged } from '../../lib/save'
import { DraftsReviewDrawer } from './drafts-review-drawer'

export const DraftsActions = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const sessionStore = useTableSessionStore()
  const drafts = useSubscription(sessionStore, {
    selector: (state) => Object.values(state.drafts),
  })
  const newRows = useSubscription(sessionStore, {
    selector: (state) => state.newRows,
  })
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const { isSaving, save } = useSaveStaged({
    onSaved: () => setIsReviewOpen(false),
    schema,
    table,
  })

  useSaveHotkey(save, isSaving)

  const changeCount = drafts.length + newRows.length
  const errorCount = [...drafts, ...newRows].filter(
    (change) => !!change.error
  ).length

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost-muted"
              size="icon-sm"
              className="relative overflow-visible"
              aria-label="Review changes"
              onClick={() => setIsReviewOpen(true)}
              disabled={isSaving}
            />
          }
        >
          <HugeiconsIcon icon={FileDiffIcon} strokeWidth={2} />
          {errorCount > 0 && (
            <span
              aria-hidden
              className="bg-destructive text-2xs absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-medium text-white"
            >
              {errorCount}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-0.5">
            <span>Review changes before saving</span>
            {errorCount > 0 && (
              <span className="opacity-70">
                {plural(errorCount, 'change')} failed
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      <Tooltip
        shortcut={
          !isSaving && (
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />
          )
        }
      >
        <TooltipTrigger
          render={<Button size="sm" onClick={save} disabled={isSaving} />}
        >
          <LoadingContent loading={isSaving}>
            <span>
              Save (
              <NumberFlow value={changeCount} />)
            </span>
          </LoadingContent>
        </TooltipTrigger>
        <TooltipContent>Save in one transaction</TooltipContent>
      </Tooltip>
      <DraftsReviewDrawer
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        table={table}
        schema={schema}
        isSaving={isSaving}
        onSave={save}
        onDiscardAll={() => {
          draftsActions(sessionStore).clear()
          setIsReviewOpen(false)
        }}
      />
    </>
  )
}
