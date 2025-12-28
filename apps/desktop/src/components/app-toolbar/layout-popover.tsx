import type { ReactNode } from 'react'
import type { LayoutPreset } from '~/entities/database/store'
import { getOS } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { Switch } from '@conar/ui/components/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMoreLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useImperativeHandle, useState } from 'react'
import {
  applyLayout,
  databaseStore,
  deleteLayout,
  renameLayout,
  setChatPosition,
  setResultsPosition,
  toggleChat,
  toggleResults,
  toggleSidebar,
} from '~/entities/database'

const os = getOS(navigator.userAgent)
const modKey = os.type === 'macos' ? '⌘' : 'Ctrl'

export interface LayoutPopoverHandle {
  open: VoidFunction
  close: VoidFunction
}

interface LayoutPopoverProps {
  databaseId: string
  children: ReactNode
}

interface LayoutThumbnailProps {
  layout: LayoutPreset
  isActive: boolean
}

function LayoutThumbnail({ layout, isActive }: LayoutThumbnailProps) {
  const showSidebar = layout.sidebarVisible
  const showChat = layout.chatVisible
  const showResults = layout.resultsVisible
  const chatRight = layout.chatPosition === 'right'

  return (
    <div
      className={cn(
        `
          relative aspect-[4/3] w-full cursor-pointer rounded-lg border-2 p-1.5
          transition-all duration-200
        `,
        isActive
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : `
            border-border/50 bg-card/50
            hover:border-border hover:bg-card hover:shadow-sm
          `,
      )}
    >
      <div className="flex h-full gap-1">
        {showSidebar && (
          <div className="w-2 rounded-sm bg-primary/60" />
        )}

        <div className={cn('flex flex-1 gap-1', chatRight
          ? 'flex-row'
          : `flex-col`)}
        >
          <div className={cn('flex flex-col gap-1', chatRight
            ? 'flex-1'
            : `flex-1`)}
          >
            <div className={cn(
              'rounded-sm bg-primary/40',
              showResults ? 'flex-1' : 'h-full',
            )}
            />
            {showResults && (
              <div className="flex-1 rounded-sm bg-primary/20" />
            )}
          </div>

          {showChat && (
            <div className={cn(
              'rounded-sm bg-blue-500/40',
              chatRight ? 'w-1/3' : 'h-1/3',
            )}
            />
          )}
        </div>
      </div>

      {isActive && (
        <div className={`
          absolute -top-1 -right-1 flex size-4 items-center justify-center
          rounded-full bg-primary shadow-sm
        `}
        >
          <RiCheckLine className="size-2.5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

interface LayoutPresetItemProps {
  databaseId: string
  layout: LayoutPreset
  isActive: boolean
}

function LayoutPresetItem({ databaseId, layout, isActive }: LayoutPresetItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(layout.name)

  const handleRename = () => {
    if (editName.trim() && editName !== layout.name) {
      renameLayout(databaseId, layout.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteLayout(databaseId, layout.id)
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className={`
          w-full rounded-lg text-left transition-all duration-200
          hover:scale-[1.02]
          focus:outline-none
          focus-visible:ring-2 focus-visible:ring-ring
          active:scale-[0.98]
        `}
        onClick={() => applyLayout(databaseId, layout.id)}
      >
        <LayoutThumbnail layout={layout} isActive={isActive} />
      </button>

      <div className="mt-2 flex items-center justify-between px-0.5">
        {isEditing
          ? (
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    handleRename()
                  if (e.key === 'Escape') {
                    setEditName(layout.name)
                    setIsEditing(false)
                  }
                }}
                className={`
                  h-6 border-input bg-background px-2 text-xs font-medium
                  focus:border-primary
                `}
                autoFocus
              />
            )
          : (
              <span className={cn(
                'flex-1 truncate text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : `
                    text-muted-foreground
                    group-hover:text-foreground
                  `,
              )}
              >
                {layout.name}
              </span>
            )}

        {!layout.isBuiltIn && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                className={cn(
                  `
                    size-5 opacity-0 transition-all duration-200
                    hover:bg-muted
                  `,
                  'group-hover:scale-100 group-hover:opacity-100',
                )}
              >
                <RiMoreLine className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="cursor-pointer"
              >
                <RiEditLine className="mr-2 size-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className={`
                  cursor-pointer text-destructive
                  focus:bg-destructive/10 focus:text-destructive
                `}
              >
                <RiDeleteBinLine className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  shortcut,
  checked,
  onCheckedChange,
}: {
  label: string
  shortcut?: string
  checked: boolean
  onCheckedChange: VoidFunction
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

function PositionSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string, label: string }[]
  onChange: (value: string) => void
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

export function LayoutPopover({ ref, databaseId, children }: LayoutPopoverProps & { ref?: React.RefObject<LayoutPopoverHandle | null> }) {
  const [open, setOpen] = useState(false)

  const store = databaseStore(databaseId)
  const {
    sidebarVisible,
    chatVisible,
    resultsVisible,
    chatPosition,
    resultsPosition,
    layouts,
    activeLayoutId,
  } = useStore(store, s => ({
    sidebarVisible: s.sidebarVisible,
    chatVisible: s.chatVisible,
    resultsVisible: s.resultsVisible,
    chatPosition: s.chatPosition,
    resultsPosition: s.resultsPosition,
    layouts: s.layouts,
    activeLayoutId: s.activeLayoutId,
  }))

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={open ? false : undefined}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom" className="font-medium">
          <span className="flex items-center gap-2">
            Layout Settings
            <kbd className={`
              rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px]
              text-muted-foreground
            `}
            >
              {modKey}
              ,
            </kbd>
          </span>
        </TooltipContent>
      </Tooltip>
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
          <div className="grid grid-cols-4 gap-3">
            {layouts.map(layout => (
              <LayoutPresetItem
                key={layout.id}
                databaseId={databaseId}
                layout={layout}
                isActive={layout.id === activeLayoutId}
              />
            ))}
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
              label="Primary Sidebar"
              shortcut={`${modKey}B`}
              checked={sidebarVisible}
              onCheckedChange={() => toggleSidebar(databaseId)}
            />
            <ToggleRow
              label="Chat Panel"
              shortcut={`${modKey}J`}
              checked={chatVisible}
              onCheckedChange={() => toggleChat(databaseId)}
            />
            <ToggleRow
              label="Results Panel"
              shortcut={`${modKey}⇧R`}
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
                { value: 'right', label: 'Right' },
                { value: 'bottom', label: 'Bottom' },
              ]}
              onChange={v => setChatPosition(databaseId, v as 'right' | 'bottom')}
            />
            <PositionSelector
              label="Results Position"
              value={resultsPosition}
              options={[
                { value: 'bottom', label: 'Bottom' },
                { value: 'right', label: 'Right' },
              ]}
              onChange={v => setResultsPosition(databaseId, v as 'bottom' | 'right')}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

LayoutPopover.displayName = 'LayoutPopover'
