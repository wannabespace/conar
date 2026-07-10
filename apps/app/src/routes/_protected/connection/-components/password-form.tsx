import { SafeURL } from '@conar/shared/utils/safe-url'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { RiArrowLeftSLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import { testConnectionQuery } from '~/entities/connection/queries/test-connection'

function ConnectionErrorDescription({ message }: { message: string }) {
  return <span dangerouslySetInnerHTML={{ __html: message.replaceAll('\n', '<br />') }} />
}

function handleConnectionTestError(error: Error) {
  toast.error("We couldn't connect to the connection", {
    description: <ConnectionErrorDescription message={error.message} />,
  })
}

export function PasswordForm({ connection, connectionResource }: { connection: Connection; connectionResource: ConnectionResource }) {
  const { connectionStringsCollection } = useCollections()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: savePassword, status } = useMutation({
    mutationFn: async (password: string) => {
      const baseString = await connectionStringsCollection.utils.decrypt(connection.id)
      const url = new SafeURL(baseString)
      url.password = password
      url.pathname = connectionResource.name || ''

      await testConnectionQuery.run({
        type: connection.type,
        connectionString: url.toString(),
        resourceId: connectionResource.id,
      })

      const record = await connectionStringsCollection.utils.prepare({
        connectionId: connection.id,
        connectionString: url.toString(),
        updatedAt: connection.updatedAt,
      })

      connectionStringsCollection.update(connection.id, (draft) => {
        Object.assign(draft, record)
      })
    },
    onSuccess: () => {
      toast.success('Password successfully saved!')
      setPassword('')
    },
    onError: handleConnectionTestError,
  })

  return (
    <div className="flex h-screen min-h-[inherit] flex-col justify-center">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <div className="flex w-full items-center gap-2">
          <Button type="button" variant="link" className="px-0! text-muted-foreground" onClick={() => router.history.back()}>
            <RiArrowLeftSLine className="size-3" />
            Back
          </Button>
        </div>
        <form
          className="flex w-full items-center justify-center"
          onSubmit={(e) => {
            e.preventDefault()
            savePassword(password)
          }}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Password Required</CardTitle>
              <CardDescription>To use this connection, you need to enter the password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Input
                    placeholder="••••••••"
                    value={password}
                    disabled={status === 'pending'}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                    autoFocus
                    className="pe-10"
                    autoComplete="password"
                    spellCheck="false"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 size-7 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <RiEyeOffLine className="size-4" /> : <RiEyeLine className="size-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={status === 'pending'}>
                <LoadingContent loading={status === 'pending'}>{status === 'error' ? 'Retry Saving Password' : 'Save Password'}</LoadingContent>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
