import type { ReactElement } from 'react'
import { pick } from '@conar/shared/utils/helpers'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Switch } from '@conar/ui/components/switch'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { getConnectionResourceStore, setChatPosition, toggleChat, toggleResults } from '~/entities/connection/store'
import { Route } from '../..'

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <Label htmlFor={label}>
        {label}
      </Label>
      <Switch
        id={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

function PositionSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T, label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <ToggleGroup
        variant="outline"
        size="sm"
        value={[value]}
        onValueChange={(newValue) => {
          if (newValue[0]) {
            onChange(newValue[0])
          }
        }}
      >
        {options.map(option => (
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
}

export function RunnerSettings({ children }: { children: ReactElement }) {
  const [open, setOpen] = useState(false)
  const { resourceId } = Route.useParams()

  const store = getConnectionResourceStore(resourceId)
  const {
    chatVisible,
    resultsVisible,
    chatPosition,
  } = useSubscription(store, { selector: s => pick(s.layout, ['chatVisible', 'resultsVisible', 'chatPosition']) })

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
            onChange={v => setChatPosition(resourceId, v)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
