import { pick } from '@tamery/shared/utils/helpers'
import { Label } from '@tamery/ui/components/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Switch } from '@tamery/ui/components/switch'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@tamery/ui/components/toggle-group'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import {
  getConnectionResourceStore,
  setChatPosition,
  toggleChat,
  toggleResults,
} from '~/entities/connection/store'

const { useParams } = getRouteApi('/_protected/connection/$resourceId/query/')

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

const PositionSelector = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => (
  <div className="flex items-center justify-between">
    <Label className="text-foreground text-sm font-medium">{label}</Label>
    <ToggleGroup
      variant="outline"
      size="sm"
      value={[value]}
      onValueChange={(newValue) => {
        if (newValue[0]) {
          onChange(newValue[0] as T)
        }
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="text-xs"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
)

export const RunnerSettings = ({ children }: { children: ReactElement }) => {
  const [open, setOpen] = useState(false)
  const { resourceId } = useParams()

  const store = getConnectionResourceStore(resourceId)
  const { chatVisible, resultsVisible, chatPosition } = useSubscription(store, {
    selector: (s) =>
      pick(s.layout, ['chatVisible', 'resultsVisible', 'chatPosition']),
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent align="start" className="w-64">
        <div className="space-y-1">
          <ToggleRow
            label="Chat Panel"
            checked={chatVisible}
            onCheckedChange={() => toggleChat(resourceId)}
          />
          <ToggleRow
            label="Results Panel"
            checked={resultsVisible}
            onCheckedChange={() => toggleResults(resourceId)}
          />
          <PositionSelector
            label="Chat Position"
            value={chatPosition}
            options={[
              { value: 'left' as const, label: 'Left' },
              { value: 'right' as const, label: 'Right' },
            ]}
            onChange={(v) => setChatPosition(resourceId, v)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
