import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { KeyboardEvent } from 'react'
import { placeholderMap } from '@conar/shared/utils/connections'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { cn } from '@conar/ui/lib/utils'
import { useId } from 'react'

interface ConnectionStringInputProps {
  connectionString: string
  type: DatabaseType | null
  parseError: string | null
  setConnectionString: (value: string) => void
  onEnter: () => void
}

export function ConnectionStringInput({
  connectionString,
  type,
  parseError,
  setConnectionString,
  onEnter,
}: ConnectionStringInputProps) {
  const id = useId()

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    }
  }

  const placeholder = type
    ? placeholderMap[type]
    : 'postgresql://user:password@host:port/database'

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        Connection String
        <span className="text-destructive ml-0.5">*</span>
      </Label>
      <Input
        id={id}
        data-testid="connection-string"
        placeholder={placeholder}
        value={connectionString}
        onChange={e => setConnectionString(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'font-mono text-sm',
          parseError && 'border-destructive focus-visible:ring-destructive/20',
        )}
        aria-invalid={!!parseError}
        aria-describedby={parseError ? `${id}-error` : undefined}
      />
      {parseError
        ? (
            <p id={`${id}-error`} className="text-sm text-destructive">
              {parseError}
            </p>
          )
        : (
            <p className="text-xs text-muted-foreground">
              Paste your full connection string or switch to Form tab to enter fields individually.
            </p>
          )}
    </div>
  )
}
