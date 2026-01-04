import type { ReactNode } from 'react'
import { Button } from '@conar/ui/components/button'
import { Ctrl, CtrlLetter, ShiftCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { Switch } from '@conar/ui/components/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { useStore } from '@tanstack/react-store'
import { useImperativeHandle, useState } from 'react'
import { databaseStore, setChatPosition, toggleChat, toggleResults } from '~/entities/database/store'

function ToggleRow({
  label,
  shortcut,
  checked,
  onCheckedChange,
}: {
  label: string
  shortcut?: ReactNode
  checked: boolean
  onCheckedChange: () => void
}) {
  return (
    <div className={`
      flex items-center justify-between rounded-lg px-1 py-2 transition-colors
      hover:bg-muted/30
    `}
    >
      <Label
        className={`
          cursor-pointer text-sm font-medium text-foreground select-none
        `}
        onClick={onCheckedChange}
      >
        {label}
      </Label>
      <div className="flex items-center gap-3">
        {shortcut && (
          <kbd className={`
            rounded-md border border-border/50 bg-muted px-2 py-1 font-mono
            text-[10px] text-muted-foreground
          `}
          >
            {shortcut}
          </kbd>
        )}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
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
    <div className={`
      flex items-center justify-between rounded-lg px-1 py-2 transition-colors
      hover:bg-muted/30
    `}
    >
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex gap-1 rounded-md bg-muted/50 p-0.5">
        {options.map(option => (
          <Button
            key={option.value}
            size="sm"
            variant={value === option.value ? 'default' : 'ghost'}
            className={cn(
              'h-7 px-3 text-xs font-medium transition-all duration-200',
              value === option.value
                ? 'bg-background text-foreground shadow-sm'
                : `
                  text-muted-foreground
                  hover:bg-background/50 hover:text-foreground
                `,
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function SqlToolbarPopover({ ref, databaseId, children }: {
  databaseId: string
  children: ReactNode
} & { ref?: React.RefObject<{
  open: () => void
  close: () => void
} | null> }) {
  const [open, setOpen] = useState(false)

  const store = databaseStore(databaseId)
  const {
    chatVisible,
    resultsVisible,
    chatPosition,
  } = useStore(store, s => ({
    chatVisible: s.layout.chatVisible,
    resultsVisible: s.layout.resultsVisible,
    chatPosition: s.layout.chatPosition,
  }))

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              {children}
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom" className="font-medium">
            <span className="flex items-center gap-2">
              Layout Settings
              <kbd className={`
                rounded border border-border/50 bg-muted px-1.5 py-0.5
                text-[10px] text-muted-foreground
              `}
              >
                <Ctrl userAgent={navigator.userAgent} />
                ,
              </kbd>
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        className="w-88 border-border/50 p-0 shadow-xl backdrop-blur-sm"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className={`
              text-xs font-semibold tracking-wider text-muted-foreground
              uppercase
            `}
            >
              Layout Presets
            </h4>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="p-4">
          <h4 className={`
            mb-3 text-xs font-semibold tracking-wider text-muted-foreground
            uppercase
          `}
          >
            Panel Visibility
          </h4>
          <div className="space-y-1">
            <ToggleRow
              label="Chat Panel"
              shortcut={<CtrlLetter userAgent={navigator.userAgent} letter="J" />}
              checked={chatVisible}
              onCheckedChange={() => toggleChat(databaseId)}
            />
            <ToggleRow
              label="Results Panel"
              shortcut={<ShiftCtrlLetter userAgent={navigator.userAgent} letter="R" />}
              checked={resultsVisible}
              onCheckedChange={() => toggleResults(databaseId)}
            />
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="p-4">
          <h4 className={`
            mb-3 text-xs font-semibold tracking-wider text-muted-foreground
            uppercase
          `}
          >
            Panel Positions
          </h4>
          <div className="space-y-1">
            <PositionSelector
              label="Chat Position"
              value={chatPosition}
              options={[
                { value: 'left' as const, label: 'Left' },
                { value: 'right' as const, label: 'Right' },
              ]}
              onChange={v => setChatPosition(databaseId, v)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
