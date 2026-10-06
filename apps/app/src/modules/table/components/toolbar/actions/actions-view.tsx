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

import { posthog } from '~/lib/posthog'

import { useTablePageStore } from '../../../lib/store'

export const ActionsView = () => {
  const store = useTablePageStore()
  const view = useSubscription(store, { selector: (state) => state.view })
  const label = view === 'grid' ? 'Show as documents' : 'Show as grid'
  const toggle = () => {
    const next = view === 'grid' ? 'documents' : 'grid'
    store.set((state) => ({ ...state, view: next }))
    posthog.capture('table_view_toggled', { view: next })
  }

  useHotkey('Mod+Shift+E', toggle)

  return (
    <Tooltip
      shortcut={
        <KbdShiftCtrlLetter userAgent={navigator.userAgent} letter="E" />
      }
    >
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
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
