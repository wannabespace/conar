import { isCtrlEnter } from '@conar/shared/utils/os'
import { Switch } from '@conar/ui/components/switch'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { cn } from '@conar/ui/lib/utils'

export function CellSwitch({
  checked,
  onChange,
  onSave,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  onSave: (value: string) => void
  className?: string
}) {
  useKeyboardEvent(isCtrlEnter, () => onSave(checked ? 'true' : 'false'))

  return (
    <label className={cn('flex gap-2 items-center text-sm', className)}>
      <code className="font-mono">false</code>
      <Switch checked={checked} onCheckedChange={onChange} />
      <code className="font-mono">true</code>
    </label>
  )
}
