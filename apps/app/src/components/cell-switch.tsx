import { Switch } from '@tamery/ui/components/switch'
import { cn } from '@tamery/ui/lib/utils'

export function CellSwitch({
  checked,
  onChange,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <label className={cn('flex items-center gap-2 text-sm', className)}>
      <code className="font-mono">false</code>
      <Switch checked={checked} onCheckedChange={onChange} />
      <code className="font-mono">true</code>
    </label>
  )
}
