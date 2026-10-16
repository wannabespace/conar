import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { motion } from 'motion/react'

import { UPDATE_SQL } from './script'

export const ApprovalDialog = ({ pressed }: { pressed: boolean }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
    className="absolute inset-0 flex items-start justify-center bg-black/30 p-4 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="bg-card ring-foreground/4 flex w-full max-w-88 flex-col gap-3 rounded-2xl p-4 shadow-xl ring"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Run this statement?</span>
        <p className="text-muted-foreground text-xs text-pretty">
          An agent wants to run it on{' '}
          <span className="text-foreground font-medium">storefront</span>{' '}
          through MCP. It commits and cannot be undone.
        </p>
      </div>
      <CodeBlock
        code={UPDATE_SQL}
        language="sql"
        size="xs"
        variant="field"
        wrap
      />
      <p className="text-muted-foreground text-xs">
        The database estimates it changes about 1 row.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Decline
        </Button>
        <motion.div
          animate={{ scale: pressed ? 0.94 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <Button variant="warning" size="sm">
            Run
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </motion.div>
)
