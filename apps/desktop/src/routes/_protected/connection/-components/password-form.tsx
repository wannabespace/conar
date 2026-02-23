import type { connections, connectionsResources } from '~/drizzle'
import type { ConnectionMutationMetadata } from '~/entities/connection/sync'
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
import { testConnectionQuery } from '~/entities/connection/queries/test-connection'
import { connectionsCollection } from '~/entities/connection/sync'

export function PasswordForm({ connection, connectionResource }: { connection: typeof connections.$inferSelect, connectionResource: typeof connectionsResources.$inferSelect }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const url = new SafeURL(connection.connectionString)
  url.password = password
  url.pathname = connectionResource.name
  const newConnectionString = url.toString()

  const { mutate: savePassword, status } = useMutation({
    mutationFn: async (password: string) => {
      await testConnectionQuery.run({
        type: connection.type,
        connectionString: newConnectionString,
      })
      connectionsCollection.update(connection.id, {
        metadata: {
          cloudSync: false,
        } satisfies ConnectionMutationMetadata,
      }, (draft) => {
        const url = new SafeURL(draft.connectionString)

        url.password = password

        draft.connectionString = url.toString()
        draft.isPasswordPopulated = true
      })
    },
    onSuccess: () => {
      toast.success('Password successfully saved!')
      setPassword('')
    },
    onError: (error) => {
      toast.error('We couldn\'t connect to the database', {
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        description: <span dangerouslySetInnerHTML={{ __html: error.message.replaceAll('\n', '<br />') }} />,
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
            className="px-0! text-muted-foreground"
            onClick={() => router.history.back()}
          >
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
                    disabled={status === 'pending'}
                    onChange={e => setPassword(e.target.value)}
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
                    {showPassword
                      ? <RiEyeOffLine className="size-4" />
                      : <RiEyeLine className="size-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={status === 'pending'}
              >
                <LoadingContent loading={status === 'pending'}>
                  {status === 'error' ? 'Retry Saving Password' : 'Save Password'}
                </LoadingContent>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
