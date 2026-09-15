import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { PasswordInput } from '@tamery/ui/components/custom/password-input'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import type {
  Connection,
  ConnectionResource,
} from '~/entities/connection/core/sync'
import { testConnectionQuery } from '~/entities/connection/queries/connection/test'

export const PasswordForm = ({
  connection,
  connectionResource,
}: {
  connection: Connection
  connectionResource: ConnectionResource
}) => {
  const { connectionStringsCollection } = useCollections()
  const router = useRouter()
  const [password, setPassword] = useState('')

  const { mutate: savePassword, status } = useMutation({
    mutationFn: async (passwordValue: string) => {
      const baseString = await connectionStringsCollection.utils.decrypt(
        connection.id
      )
      const url = new SafeURL(baseString)
      url.password = passwordValue
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
    onError: (error) => {
      toast.error("We couldn't connect to the connection", {
        description: error.message,
      })
    },
  })

  return (
    <div className="flex h-screen min-h-[inherit] flex-col justify-center">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="link"
            tone="muted"
            onClick={() => router.history.back()}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3"
            />
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
              <CardDescription>
                To use this connection, you need to enter the password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PasswordInput
                placeholder="••••••••"
                value={password}
                disabled={status === 'pending'}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoFocus
                autoComplete="password"
                spellCheck="false"
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={status === 'pending' || password === ''}
              >
                <LoadingContent loading={status === 'pending'}>
                  {status === 'error'
                    ? 'Retry Saving Password'
                    : 'Save Password'}
                </LoadingContent>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
