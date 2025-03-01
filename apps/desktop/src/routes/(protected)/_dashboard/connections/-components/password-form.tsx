import type { Connection } from '~/lib/indexeddb'
import { Button } from '@connnect/ui/components/button'
import { Input } from '@connnect/ui/components/input'
import { useMemo, useState } from 'react'
import { useTestConnection, useUpdateConnectionPassword } from '~/entities/connection'

export function PasswordForm({ connection }: { connection: Connection }) {
  const [password, setPassword] = useState('')
  const { mutate: savePassword, isPending } = useUpdateConnectionPassword(connection.id)
  const { mutate: testConnection, isPending: isConnecting } = useTestConnection()

  const newConnectionString = useMemo(() => {
    const url = new URL(connection.connectionString)
    url.password = password
    return url.toString()
  }, [connection.connectionString, password])

  return (
    <form
      className="flex items-center w-full p-10 justify-center"
      onSubmit={(e) => {
        e.preventDefault()
        savePassword(password)
      }}
    >
      <div className="w-full max-w-md space-y-6 bg-card rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Password Required</h2>
        <p className="text-muted-foreground text-center">
          To use this connection, you need to enter the password.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={password}
              type="password"
              onChange={e => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="Enter password"
            />
            <Button
              variant="outline"
              className="shrink-0"
              loading={isConnecting}
              disabled={isPending}
              onClick={() => testConnection({ type: connection.type, connectionString: newConnectionString })}
            >
              Test connection
            </Button>
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={isPending}
          >
            Save Password
          </Button>
        </div>
      </div>
    </form>
  )
}
