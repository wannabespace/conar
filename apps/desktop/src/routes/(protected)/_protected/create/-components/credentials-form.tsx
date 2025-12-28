import type { ConnectionFields } from '@conar/connection'
import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { KeyboardEvent } from 'react'
import { Button } from '@conar/ui/components/button'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useId, useState } from 'react'

const defaultPorts: Record<DatabaseType, number> = {
  postgres: 5432,
  mysql: 3306,
  mssql: 1433,
  clickhouse: 8443,
}

export function CredentialsForm({
  type,
  fields,
  onFieldChange,
  onEnter,
}: {
  type: DatabaseType
  fields: ConnectionFields
  onFieldChange: (field: keyof ConnectionFields, value: string) => void
  onEnter: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const hostId = useId()
  const portId = useId()
  const userId = useId()
  const passwordId = useId()
  const databaseId = useId()
  const optionsId = useId()

  const isClickHouse = type === 'clickhouse'

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={hostId}>
            Host
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id={hostId}
            placeholder="localhost or db.example.com"
            value={fields.host}
            onChange={e => onFieldChange('host', e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={portId}>Port</Label>
          <Input
            id={portId}
            type="number"
            placeholder={String(defaultPorts[type])}
            value={fields.port ?? ''}
            onChange={e => onFieldChange('port', e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={userId}>User</Label>
          <Input
            id={userId}
            placeholder={isClickHouse ? 'default' : 'postgres'}
            value={fields.user ?? ''}
            onChange={e => onFieldChange('user', e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={passwordId}>Password</Label>
          <div className="relative">
            <Input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              value={fields.password ?? ''}
              onChange={e => onFieldChange('password', e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword
                ? <RiEyeOffLine className="size-4" aria-hidden="true" />
                : <RiEyeLine className="size-4" aria-hidden="true" />}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {!isClickHouse && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={databaseId}>Database</Label>
          <Input
            id={databaseId}
            placeholder="postgres"
            value={fields.database ?? ''}
            onChange={e => onFieldChange('database', e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={optionsId}>
          Options
          <span className="text-muted-foreground/50 text-xs ml-1.5">(optional)</span>
        </Label>
        <Input
          id={optionsId}
          placeholder="sslmode=require&connect_timeout=10"
          value={fields.options ?? ''}
          onChange={e => onFieldChange('options', e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="text-xs text-muted-foreground">
          Query parameters like SSL mode, timeouts, etc.
        </p>
      </div>
    </div>
  )
}
