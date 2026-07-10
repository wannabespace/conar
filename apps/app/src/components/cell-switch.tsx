import { Switch } from '@conar/ui/components/switch'
import { cn } from '@conar/ui/lib/utils'
import { useId } from 'react'

export function CellSwitch({
  checked,
  onChange,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  const id = useId()

  return (
    <label htmlFor={id} className={cn('flex items-center gap-2 text-sm', className)}>
      <code className="font-mono">false</code>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <code className="font-mono">true</code>
    </label>
  )
}
