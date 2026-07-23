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
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={cn('flex items-center gap-2.5 text-sm', className)}>
      <code
        className={cn(
          'font-mono transition-colors duration-150',
          checked ? 'text-muted-foreground/60' : 'font-medium text-foreground',
        )}
      >
        false
      </code>
      <Switch checked={checked} onCheckedChange={onChange} />
      <code
        className={cn(
          'font-mono transition-colors duration-150',
          checked ? 'font-medium text-foreground' : 'text-muted-foreground/60',
        )}
      >
        true
      </code>
    </label>
  )
}
