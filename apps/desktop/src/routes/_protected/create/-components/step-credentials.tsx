import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { RefObject } from 'react'
import { placeholderMap } from '@conar/shared/utils/connections'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useId } from 'react'

export function StepCredentials({ ref, type, connectionString, setConnectionString, onEnter }: {
  ref: RefObject<HTMLInputElement | null>
  type: ConnectionType
  connectionString: string
  setConnectionString: (connectionString: string) => void
  onEnter: () => void
}) {
  const id = useId()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>Enter the credentials of your connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor={id} className="mb-2">
          Connection string
        </Label>
        <Input
          id={id}
          placeholder={placeholderMap[type as ConnectionType]}
          ref={ref}
          autoFocus
          value={connectionString}
          onChange={e => setConnectionString(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter()
            }
          }}
        />
      </CardContent>
    </Card>
  )
}
