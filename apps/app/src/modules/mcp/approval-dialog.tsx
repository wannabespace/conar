import { destructiveKeywords, dialects, writesData } from '@tamery/sql'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { approval } from './approval'
import { ImpactNote } from './impact-note'

export const ApprovalDialog = () => {
  const [item] = useSubscription(approval.store, {
    selector: (state) => state.pending,
  })
  const declineRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) {
          item?.decide(false)
        }
      }}
    >
      {item && (
        <AlertDialogContent
          key={item.id}
          initialFocus={declineRef}
          className="sm:max-w-lg"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Run this statement?</AlertDialogTitle>
            <AlertDialogDescription>
              An agent wants to run it on{' '}
              <span data-mask className="text-foreground font-medium">
                {item.connection.name}
              </span>{' '}
              through MCP. It commits and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <CodeBlock
            code={item.sql}
            language="sql"
            size="xs"
            variant="field"
            wrap
            className="max-h-60"
          />
          <ImpactNote
            estimate={item.estimate}
            impact={item.impact}
            writesRows={writesData(item.sql, dialects[item.connection.type])}
          />
          <AlertDialogFooter>
            <AlertDialogCancel ref={declineRef}>Decline</AlertDialogCancel>
            <AlertDialogAction
              variant={
                destructiveKeywords(item.sql, dialects[item.connection.type])
                  .length > 0
                  ? 'destructive'
                  : 'warning'
              }
              onClick={() => item.decide(true)}
            >
              Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
