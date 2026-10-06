import { Grid3X2Icon, ListViewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdShiftCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useSubscription } from 'seitu/react'

import { useTablePageStore } from '../../../lib/store'

export const ActionsView = () => {
  const store = useTablePageStore()
  const view = useSubscription(store, { selector: (state) => state.view })
  const label = view === 'grid' ? 'Show as documents' : 'Show as grid'
  const toggle = () =>
    store.set((state) => ({
      ...state,
      view: state.view === 'grid' ? 'documents' : 'grid',
    }))

  useHotkey('Mod+Shift+E', toggle)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={label}
            onClick={toggle}
          />
        }
      >
        <HugeiconsIcon
          icon={view === 'grid' ? ListViewIcon : Grid3X2Icon}
          strokeWidth={2}
          className="text-muted-foreground/60"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        <KbdShiftCtrlLetter userAgent={navigator.userAgent} letter="E" />
      </TooltipContent>
    </Tooltip>
  )
}
