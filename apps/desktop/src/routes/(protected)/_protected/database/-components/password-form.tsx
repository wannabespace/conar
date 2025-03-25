import type { Database } from '~/lib/indexeddb'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useMemo, useState } from 'react'
import { useTestDatabase, useUpdateDatabasePassword } from '~/entities/database'

export function PasswordForm({ database }: { database: Database }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: savePassword, isPending } = useUpdateDatabasePassword(database)
  const { mutate: testConnection, isPending: isConnecting } = useTestDatabase()

  const newConnectionString = useMemo(() => {
    const url = new URL(database.connectionString)
    url.password = password
    return url.toString()
  }, [database.connectionString, password])

  return (
    <form
      className="relative flex items-center w-full p-10 justify-center"
      onSubmit={(e) => {
        e.preventDefault()
        savePassword(password)
      }}
    >
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Password Required</CardTitle>
          <CardDescription>
            To use this connection, you need to enter the password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <Input
                placeholder="••••••••"
                value={password}
                disabled={isPending}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoCapitalize="none"
                className="pe-10"
                autoComplete="password"
                spellCheck="false"
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? (
                      <RiEyeOffLine className="size-4" />
                    )
                  : (
                      <RiEyeLine className="size-4" />
                    )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            <Button
              variant="outline"
              className="shrink-0"
              disabled={isConnecting || isPending}
              onClick={() => testConnection({ type: database.type, connectionString: newConnectionString })}
            >
              <LoadingContent loading={isConnecting}>
                Test connection
              </LoadingContent>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            <LoadingContent loading={isPending}>
              Save Password
            </LoadingContent>
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
