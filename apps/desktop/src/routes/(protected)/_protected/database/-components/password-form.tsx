import type { Database } from '~/lib/indexeddb'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { DotsBg } from '@connnect/ui/components/custom/dots-bg'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { RiArrowLeftSLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTestDatabase, useUpdateDatabasePassword } from '~/entities/database'

export function PasswordForm({ database }: { database: Database }) {
  const router = useRouter()
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
    <div className="relative flex flex-col flex-1 justify-center py-10 w-full">
      <DotsBg
        className="absolute -z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex flex-col gap-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 w-full">
          <Button
            type="button"
            variant="link"
            className="px-0! text-muted-foreground"
            onClick={() => router.history.back()}
          >
            <RiArrowLeftSLine className="size-3" />
            Back
          </Button>
        </div>
        <form
          className="flex items-center w-full justify-center"
          onSubmit={(e) => {
            e.preventDefault()
            savePassword(password)
          }}
        >
          <Card className="w-full">
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
      </div>
    </div>
  )
}
