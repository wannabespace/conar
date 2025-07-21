import { getOS } from '@conar/shared/utils/os'
import { Checkbox } from '@conar/ui/components/checkbox'
import { useKeyboardEvent } from '@react-hookz/web'

export function CellCheckbox({
  checked,
  onChange,
  onSave,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  onSave: (value: string) => void
}) {
  const os = getOS(navigator.userAgent)
  useKeyboardEvent(e => e.key === 'Enter' && (os.type === 'macos' ? e.metaKey : e.ctrlKey), () => onSave(checked ? 'true' : 'false'))

  return (
    <Checkbox checked={checked} onCheckedChange={onChange} />
  )
}
