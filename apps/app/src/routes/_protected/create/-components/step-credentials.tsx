import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { placeholderMap } from '@tamery/shared/utils/connections'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { Field, FieldDescription, FieldLabel } from '@tamery/ui/components/field'
import { Input } from '@tamery/ui/components/input'
import type { RefObject } from 'react'
import { useId } from 'react'

import { useLocalProxyAvailable } from '~/entities/connection/runtime'

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
  const localProxyAvailable = useLocalProxyAvailable()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>Enter the credentials of your connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field className="gap-2">
          <FieldLabel htmlFor={id}>Connection string</FieldLabel>
          <Input
            id={id}
            placeholder={placeholderMap[type]}
            ref={ref}
            autoFocus
            value={connectionString}
            onChange={e => setConnectionString(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEnter()
              }
            }}
          />
          {!window.electron && (
            <FieldDescription>
              {localProxyAvailable
                ? 'Local connections will be routed through your tamery proxy.'
                : 'Run `tamery proxy` to query local connections from the web.'}
            </FieldDescription>
          )}
        </Field>
      </CardContent>
    </Card>
  )
}
