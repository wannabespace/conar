import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { MutationStatus } from '@tanstack/react-query'
import { motion } from 'motion/react'

import { TestStatus } from './test-status'

export const FormFooter = ({
  canTest,
  formId,
  onTest,
  reason,
  saving,
  testStatus,
}: {
  canTest: boolean
  formId: string
  onTest: () => void
  reason: string | null
  saving: boolean
  testStatus: MutationStatus
}) => {
  const failed = testStatus === 'error'

  return (
    <motion.footer
      className="border-t"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-2 px-6">
        <div className="min-w-0 flex-1">
          <TestStatus reason={reason} status={testStatus} />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!canTest || testStatus === 'pending'}
          onClick={onTest}
        >
          Test
        </Button>
        <Tooltip
          shortcut={!saving && <KbdCtrlEnter userAgent={navigator.userAgent} />}
        >
          <TooltipTrigger
            render={
              <Button
                type="submit"
                form={formId}
                variant={failed ? 'warning' : 'default'}
                disabled={saving || testStatus === 'pending'}
              />
            }
          >
            <LoadingContent loading={saving}>
              {failed ? 'Save anyway' : 'Save connection'}
            </LoadingContent>
          </TooltipTrigger>
          <TooltipContent>
            {failed
              ? 'The test failed — the connection saves as it is.'
              : 'Tests the connection, then saves it'}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.footer>
  )
}
