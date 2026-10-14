import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { SecretParam } from '@tamery/connection/secrets'
import { SafeURL } from '@tamery/shared/safe-url'
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
import { FieldGroup } from '@tamery/ui/components/field'
import { Form, useAppForm } from '@tamery/ui/components/tanstack-form'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useCollections } from '~/core/collections'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import { testConnectionQuery } from '~/core/queries/connection/test'

const CREDENTIAL_LABELS = {
  password: 'Password',
  ssh_key: 'SSH private key',
  ssh_passphrase: 'SSH key passphrase',
  ssh_password: 'SSH password',
  sslpassphrase: 'SSL key passphrase',
  sslpassword: 'SSL key passphrase',
} satisfies Record<'password' | SecretParam, string>

const EMPTY_CREDENTIALS = {
  password: '',
  ssh_key: '',
  ssh_passphrase: '',
  ssh_password: '',
  sslpassphrase: '',
  sslpassword: '',
} satisfies Record<'password' | SecretParam, string>

export const PasswordForm = ({
  connection,
  connectionResource,
}: {
  connection: Connection
  connectionResource: ConnectionResource
}) => {
  const { connectionStringsCollection } = useCollections()
  const router = useRouter()
  const { data: connectionString } = useLiveQuery({
    query: (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
  })
  const needsPassword =
    connection.isPasswordExists && !connectionString?.isPasswordPopulated
  const missingSecrets = connectionString?.missingSecrets ?? []
  const missingFields = [
    ...(needsPassword ? (['password'] as const) : []),
    ...missingSecrets,
  ]

  const { mutate: saveCredentials, status } = useMutation({
    meta: { event: 'connection_password_saved' },
    mutationFn: async (credentials: typeof EMPTY_CREDENTIALS) => {
      const url = new SafeURL(
        await connectionStringsCollection.utils.decrypt(connection.id)
      )
      if (needsPassword) {
        url.password = encodeURIComponent(credentials.password)
      }
      for (const param of missingSecrets) {
        url.searchParams.set(param, credentials[param])
      }
      url.pathname = encodeURIComponent(connectionResource.name || '')

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
      toast.success('Credentials saved')
    },
    onError: (error) => {
      toast.error("We couldn't connect to the connection", {
        description: error.message,
      })
    },
  })

  const form = useAppForm({
    defaultValues: EMPTY_CREDENTIALS,
    onSubmit: ({ value }) => saveCredentials(value),
  })
  const incomplete = useStore(form.store, ({ values }) =>
    missingFields.some((name) => !values[name])
  )
  const pending = status === 'pending'

  return (
    <div className="flex h-screen min-h-[inherit] flex-col justify-center">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="link-muted"
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
        <Form form={form} className="flex w-full items-center justify-center">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Credentials Required</CardTitle>
              <CardDescription>
                This device has no saved credentials for this connection yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup size="sm">
                {missingFields.map((name, index) => (
                  <form.AppField key={name} name={name}>
                    {(field) => (
                      <field.Field>
                        <field.Label>{CREDENTIAL_LABELS[name]}</field.Label>
                        {name === 'ssh_key' ? (
                          <field.Textarea
                            data-mask
                            rows={3}
                            disabled={pending}
                            spellCheck={false}
                            autoComplete="off"
                            autoFocus={index === 0}
                            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                            fileLabel="Load from file"
                          />
                        ) : (
                          <field.PasswordInput
                            data-mask
                            disabled={pending}
                            autoComplete="off"
                            autoFocus={index === 0}
                          />
                        )}
                      </field.Field>
                    )}
                  </form.AppField>
                ))}
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={pending || incomplete}
              >
                <LoadingContent loading={pending}>
                  {status === 'error'
                    ? 'Retry Saving Credentials'
                    : 'Save Credentials'}
                </LoadingContent>
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
    </div>
  )
}
