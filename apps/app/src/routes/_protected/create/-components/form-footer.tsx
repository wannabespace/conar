import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { MutationStatus } from '@tanstack/react-query'
import { motion } from 'motion/react'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'

import { PageColumns } from './page-columns'
import { TestStatus } from './test-status'

export const FormFooter = ({
  canTest,
  editing,
  onSave,
  onTest,
  reason,
  submitting,
  testStatus,
}: {
  canTest: boolean
  editing: boolean
  /** Not a submit button: with none in the form, Enter in a field never saves. */
  onSave: () => void
  onTest: () => void
  reason: string | null
  submitting: boolean
  testStatus: MutationStatus
}) => {
  const failed = testStatus === 'error'
  const testing = testStatus === 'pending'

  return (
    <motion.footer
      className="border-t"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageColumns>
        <div className="flex min-h-14 items-center gap-2 py-2">
          <div className="min-w-0 flex-1">
            <TestStatus reason={reason} status={testStatus} />
          </div>
          <Button
            type="button"
            variant="ghost-tint-muted"
            disabled={!canTest || testing || submitting}
            focusableWhenDisabled
            onClick={onTest}
          >
            Test
          </Button>
          <Tooltip shortcut={!submitting && <ShortcutKbd shortcut="submit" />}>
            <TooltipTrigger
              render={
                <Button
                  variant={failed ? 'warning' : 'default'}
                  disabled={submitting}
                  focusableWhenDisabled
                  onClick={onSave}
                />
              }
            >
              <LoadingContent loading={submitting && !testing}>
                {failed && 'Save anyway'}
                {!failed && (editing ? 'Save changes' : 'Save connection')}
              </LoadingContent>
            </TooltipTrigger>
            <TooltipContent>
              {failed
                ? 'The test failed. The connection saves as it is.'
                : 'Tests the connection, then saves it'}
            </TooltipContent>
          </Tooltip>
        </div>
      </PageColumns>
    </motion.footer>
  )
}
