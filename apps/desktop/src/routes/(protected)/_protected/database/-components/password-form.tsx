import type { databases } from '~/drizzle'
import type { DatabaseMutationMetadata } from '~/entities/database'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { RiArrowLeftSLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { databasesCollection, dbTestConnection } from '~/entities/database'

export function PasswordForm({ database }: { database: typeof databases.$inferSelect }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const newConnectionString = useMemo(() => {
    const url = new SafeURL(database.connectionString)
    url.password = password
    return url.toString()
  }, [database.connectionString, password])

  const { mutate: savePassword, status } = useMutation({
    mutationFn: async (password: string) => {
      await dbTestConnection({ type: database.type, connectionString: newConnectionString })
      databasesCollection.update(database.id, {
        metadata: {
          sync: false,
        } satisfies DatabaseMutationMetadata,
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
        description: error.message,
      })
    },
  })

  return (
    <div className="min-h-[inherit] h-screen flex flex-col justify-center">
      <div className="w-full flex flex-col gap-6 max-w-xl mx-auto py-10 px-6">
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
                    disabled={status === 'pending'}
                    onChange={e => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                    className="pe-10"
                    autoComplete="password"
                    spellCheck="false"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
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
