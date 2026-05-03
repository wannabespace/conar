import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { RefObject } from 'react'
import { placeholderMap } from '@conar/shared/utils/connections'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Field, FieldDescription, FieldLabel } from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { useId } from 'react'

export function StepCredentials({
  ref,
  type,
  connectionString,
  setConnectionString,
  onEnter,
}: {
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
        <Field className="gap-2">
          <FieldLabel htmlFor={id}>
            Connection string
          </FieldLabel>
          <Input
            id={id}
            placeholder={placeholderMap[type]}
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
          {!window.electron && (
            <FieldDescription>
              The web app cannot query local connections
            </FieldDescription>
          )}
        </Field>
      </CardContent>
    </Card>
  )
}
