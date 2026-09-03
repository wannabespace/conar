import {
  ArrowLeft01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
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
import { Input } from '@tamery/ui/components/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import { testConnectionQuery } from '~/entities/connection/queries/test-connection'

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
  const [showPassword, setShowPassword] = useState(false)

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
            className="text-muted-foreground px-0!"
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
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground absolute inset-y-0 right-2 my-auto size-7"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        />
                      }
                    >
                      {showPassword ? (
                        <HugeiconsIcon
                          icon={ViewOffSlashIcon}
                          strokeWidth={2}
                          className="size-4"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={ViewIcon}
                          strokeWidth={2}
                          className="size-4"
                        />
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {showPassword ? 'Hide password' : 'Show password'}
                    </TooltipContent>
                  </Tooltip>
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
