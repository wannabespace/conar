import { FileImportIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'

export const DropOverlay = ({ shown }: { shown: boolean }) => (
  <AnimatePresence>
    {shown && (
      <motion.div
        className="bg-background/70 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="border-primary/50 bg-primary/5 text-primary flex size-full max-w-xl flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed"
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <HugeiconsIcon
            icon={FileImportIcon}
            strokeWidth={2}
            className="size-8"
          />
          <p className="text-sm font-medium">Drop to read the connection</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)
