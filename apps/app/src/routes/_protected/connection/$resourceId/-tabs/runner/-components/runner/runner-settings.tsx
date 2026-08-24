import { Label } from '@tamery/ui/components/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Switch } from '@tamery/ui/components/switch'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { toggleResults, useRunnerPageStore } from '../../-lib/store'

const ToggleRow = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: () => void
}) => (
  <div className="flex items-center justify-between py-0.5">
    <Label htmlFor={label}>{label}</Label>
    <Switch id={label} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
)

export const RunnerSettings = ({ children }: { children: ReactElement }) => {
  const [open, setOpen] = useState(false)
  const store = useRunnerPageStore()
  const resultsVisible = useSubscription(store, {
    selector: (state) => state.layout.resultsVisible,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent align="start" className="w-64">
        <div className="space-y-1">
          <ToggleRow
            label="Results Panel"
            checked={resultsVisible}
            onCheckedChange={() => toggleResults(store)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
