import { getOS } from '@conar/shared/utils/os'
import { Switch } from '@conar/ui/components/switch'
import { useKeyboardEvent } from '@react-hookz/web'

const os = getOS(navigator.userAgent)

export function CellSwitch({
  checked,
  onChange,
  onSave,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  onSave: (value: string) => void
}) {
  useKeyboardEvent(e => e.key === 'Enter' && (os.type === 'macos' ? e.metaKey : e.ctrlKey), () => onSave(checked ? 'true' : 'false'))

  return (
    <div className="flex gap-2 items-center text-xs">
      <Switch checked={checked} onCheckedChange={onChange} />
      <code className="font-mono">{checked.toString()}</code>
    </div>
  )
}
