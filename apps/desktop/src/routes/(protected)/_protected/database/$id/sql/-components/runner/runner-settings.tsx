import type { ReactNode } from 'react'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Switch } from '@conar/ui/components/switch'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { databaseStore, setChatPosition, toggleChat, toggleResults } from '~/entities/database/store'
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
  value: string
  options: { value: T, label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="xs"
        value={value}
        onValueChange={(newValue) => {
          if (newValue) {
            onChange(newValue as T)
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

export function RunnerSettings({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { id } = Route.useParams()

  const store = databaseStore(id)
  const {
    chatVisible,
    resultsVisible,
    chatPosition,
  } = useStore(store, s => ({
    chatVisible: s.layout.chatVisible,
    resultsVisible: s.layout.resultsVisible,
    chatPosition: s.layout.chatPosition,
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="space-y-1">
          <ToggleRow
            label="Chat Panel"
            checked={chatVisible}
            onCheckedChange={() => toggleChat(id)}
          />
          <ToggleRow
            label="Results Panel"
            checked={resultsVisible}
            onCheckedChange={() => toggleResults(id)}
          />
          <PositionSelector
            label="Chat Position"
            value={chatPosition}
            options={[
              { value: 'left' as const, label: 'Left' },
              { value: 'right' as const, label: 'Right' },
            ]}
            onChange={v => setChatPosition(id, v)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
