import { Input } from '@conar/ui/components/input'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine } from '@remixicon/react'

export function DefinitionsSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        className={cn('w-[200px] pr-8', className)}
        value={value}
        autoFocus
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="
            absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
          "
          onClick={() => onChange('')}
        >
          <RiCloseLine className="size-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
