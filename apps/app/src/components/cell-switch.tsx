import { Switch } from '@tamery/ui/components/switch'
import { cn } from '@tamery/ui/lib/utils'

export const CellSwitch = ({
  checked,
  onChange,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) => (
  // oxlint-disable-next-line jsx-a11y/label-has-associated-control
  <label className={cn('flex items-center gap-2.5 text-sm', className)}>
    <code
      className={cn(
        'font-mono transition-colors duration-150',
        checked ? 'text-muted-foreground/60' : 'text-foreground font-medium'
      )}
    >
      false
    </code>
    <Switch checked={checked} onCheckedChange={onChange} />
    <code
      className={cn(
        'font-mono transition-colors duration-150',
        checked ? 'text-foreground font-medium' : 'text-muted-foreground/60'
      )}
    >
      true
    </code>
  </label>
)
