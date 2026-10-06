import { ArrowTurnBackwardIcon, SaveIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { cardClass } from '~/components/card'
import { DiscardButton } from '~/components/discard-button'
import { PaneEmpty } from '~/components/pane-empty'
import { inlineParameters } from '~/core/codegen/formats/sql'
import { coldDialects } from '~/core/runtime/dialects'
import { formatSql } from '~/lib/formatter'
import { plural } from '~/lib/plural'

import { applyConsequence } from '../lib/apply'
import type { DiagramDraft } from '../lib/statements'
import { draftStatement, inApplyOrder } from '../lib/statements'

const draftLabel = (draft: DiagramDraft) => {
  switch (draft.kind) {
    case 'createTable': {
      return `Create table with ${plural(draft.columns.length, 'column')}`
    }
    case 'renameTable': {
      return `Rename table to ${draft.newName}`
    }
    case 'dropTable': {
      return draft.cascade ? 'Drop table and its dependents' : 'Drop table'
    }
    case 'addColumn': {
      return `Add column ${draft.column.name} ${draft.column.type}`
    }
    case 'renameColumn': {
      return `Rename column ${draft.column} to ${draft.newName}`
    }
    case 'alterColumn': {
      return `Change ${draft.column} to ${draft.type}${draft.nullable ? '' : ' not null'}`
    }
    case 'dropColumn': {
      return `Drop column ${draft.column}`
    }
    case 'addForeignKey': {
      return `Link ${draft.columns.join(', ')} to ${draft.foreignTable}.${draft.foreignColumns.join(', ')}`
    }
    case 'dropForeignKey': {
      return `Drop foreign key ${draft.name}`
    }
    default: {
      return draft satisfies never
    }
  }
}

// SQL Server's sp_rename takes names as bound values, which the preview
// has to show; a statement without any keeps its raw text untouched.
const previewSql = (type: ConnectionType, draft: DiagramDraft) => {
  const { parameters, sql } = draftStatement(type, coldDialects[type](), draft)
  return formatSql(
    parameters.length > 0 ? inlineParameters(sql, parameters) : sql,
    type
  )
}

export const ReviewDrawer = ({
  applying,
  connectionType,
  ddlRollback,
  drafts,
  error,
  onApply,
  onDiscard,
  onDiscardAll,
  onOpenChange,
  open,
}: {
  applying: boolean
  connectionType: ConnectionType
  ddlRollback: boolean
  drafts: DiagramDraft[]
  error: Error | null
  onApply: () => void
  onDiscard: (id: string) => void
  onDiscardAll: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const groups = [
    ...Map.groupBy(
      inApplyOrder(drafts),
      (draft) => `${draft.schema}.${draft.table}`
    ),
  ]
  const consequence = applyConsequence(drafts, ddlRollback)

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
      size="sm"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Review changes</DrawerTitle>
          <DrawerDescription>
            {plural(drafts.length, 'change')} · {consequence.description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
          {groups.length === 0 ? (
            <PaneEmpty
              icon={SaveIcon}
              title="Nothing to review"
              description="Edit tables on the canvas and the changes will show up here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map(([key, tableDrafts]) => (
                <div key={key} className={cardClass}>
                  <header className="border-foreground/6 flex h-9 items-center border-b px-3">
                    <span
                      data-mask
                      className="text-2xs text-foreground truncate font-mono"
                    >
                      {key}
                    </span>
                  </header>
                  {tableDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="border-foreground/6 flex flex-col gap-1.5 border-b py-2 pr-1.5 pl-3 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          data-mask
                          className="min-w-0 flex-1 truncate text-xs"
                        >
                          {draftLabel(draft)}
                        </span>
                        <DiscardButton
                          label="Discard change"
                          onClick={() => onDiscard(draft.id)}
                          disabled={applying}
                        />
                      </div>
                      <CodeBlock
                        code={previewSql(connectionType, draft)}
                        language="sql"
                        size="xs"
                        wrap
                        className="mr-1.5"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {error && (
          <Alert variant="destructive" className="mx-3 mb-3">
            <AlertTitle>The database refused the changes</AlertTitle>
            <AlertDescription>
              <span data-mask className="font-mono select-text">
                {error.message}
              </span>
            </AlertDescription>
          </Alert>
        )}
        <DrawerFooter>
          <Button
            variant="ghost-muted"
            onClick={onDiscardAll}
            disabled={applying || drafts.length === 0}
            className="mr-auto"
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
            Discard all
          </Button>
          <DrawerClose render={<Button variant="outline">Close</Button>} />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={consequence.variant}
                  onClick={onApply}
                  disabled={applying || drafts.length === 0}
                />
              }
            >
              <LoadingContent loading={applying}>
                Apply {plural(drafts.length, 'change')}
              </LoadingContent>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-0.5">
                <span>
                  {`Apply ${plural(drafts.length, 'change')} to the database. `}
                  {consequence.description}
                </span>
                <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />
              </div>
            </TooltipContent>
          </Tooltip>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
