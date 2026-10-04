import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { isLocalhostConnectionString } from '@tamery/connection/utils'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/safe-url'
import { title } from '@tamery/shared/title'
import { tryCatch } from '@tamery/shared/utils'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'

import {
  Stepper,
  StepperContent,
  StepperList,
  StepperTrigger,
} from '~/components/stepper'
import { mutateOffline, useCollections } from '~/core/collections'
import { prefetchConnectionResourceCore } from '~/core/connection/fetching'
import { fetchingConfig } from '~/core/connection/fetching-config'
import { getConnectionStore } from '~/core/connection/stores'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { permix } from '~/core/user/permissions'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { generateRandomName } from '~/lib/faker'
import { posthog } from '~/lib/posthog'

import { StepCredentials } from './-components/step-credentials'
import { StepSave } from './-components/step-save'
import { StepType } from './-components/step-type'

const createConnectionType = type({
  name: 'string > 1',
  type: type.valueOf(ConnectionType).or('null'),
  connectionString: 'string > 1',
  syncType: type.valueOf(SyncType),
  label: 'string | null',
  color: 'string | null',
})

const CreateConnectionPage = () => {
  const collections = useCollections()
  const { data: activeWorkspace } = useActiveWorkspace()
  const [step, setStep] = useState<'type' | 'credentials' | 'save'>('type')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const { mutate: createConnectionMutation, isPending: isCreatingConnection } =
    useMutation({
      mutationFn: async (data: {
        connectionString: string
        name: string
        type: ConnectionType
        syncType: SyncType
        label: string | null
        color: string | null
      }) => {
        if (!activeWorkspace) {
          throw new Error('Workspace is still loading. Please try again.')
        }

        const id = v7()
        const url = new SafeURL(data.connectionString.trim())

        const resource =
          url.pathname === '/' || url.pathname === ''
            ? null
            : url.pathname.slice(1)
        const resourceId = v7()
        const updatedAt = new Date()
        const createdAt = new Date()
        const {
          connectionsCollection,
          connectionStringsCollection,
          connectionsResourcesCollection,
        } = collections

        connectionStringsCollection.insert(
          await connectionStringsCollection.utils.prepare({
            connectionId: id,
            connectionString: url.toString(),
            updatedAt,
          })
        )
        const tx = mutateOffline(() => {
          connectionsCollection.insert({
            id,
            workspaceId: activeWorkspace.id,
            name: data.name,
            type: data.type,
            label: data.label || null,
            color: data.color || null,
            isPasswordExists: !!url.password,
            syncType: data.syncType,
            createdAt,
            updatedAt,
          })
          connectionsResourcesCollection.insert({
            id: resourceId,
            connectionId: id,
            name: resource,
            createdAt,
            updatedAt,
          })
        })

        if (resource) {
          getConnectionStore(id).set((state) => ({
            ...state,
            lastOpenedResourceName: resource,
          }))
        }

        if (!window.electron && navigator.onLine) {
          await tx.isPersisted.promise
        }

        const createdResource = connectionsResourcesCollection.get(resourceId)
        if (!createdResource) {
          throw new Error('Connection resource not found after create')
        }
        prefetchConnectionResourceCore(createdResource)
        await router.navigate({
          to: '/connection/$resourceId',
          params: { resourceId },
        })
        posthog.capture('connection_created', {
          syncType: data.syncType,
          type: data.type,
        })
        toast.success('Connection created successfully 🎉')
      },
    })

  const defaultValues: typeof createConnectionType.infer = {
    connectionString: '',
    name: generateRandomName(),
    type: null,
    syncType: SyncType.Cloud,
    label: null,
    color: null,
  }

  const form = useForm({
    defaultValues,
    validators: {
      onChange: createConnectionType,
    },
    onSubmit(e) {
      const {
        type: connectionType,
        connectionString: formConnectionString,
        name: formName,
        syncType: formSyncType,
        label: formLabel,
        color: formColor,
      } = e.value

      if (!connectionType) {
        toast.error('Select a database type')
        return
      }

      createConnectionMutation({
        type: connectionType,
        connectionString: formConnectionString,
        name: formName,
        syncType: formSyncType,
        label: formLabel,
        color: formColor,
      })
    },
  })

  const {
    mutate: test,
    reset,
    status: testingStatus,
  } = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: ({
      type: connectionType,
      connectionString: stringToTest,
    }: {
      type: ConnectionType
      connectionString: string
    }) =>
      testConnectionQuery.run({
        type: connectionType,
        connectionString: stringToTest,
      }),
    onSuccess: () => {
      setStep('save')
      toast.success('Connection successful. You can save the connection.')
    },
    onError: (error) => {
      const description = error.message.toLowerCase().includes('invalid url')
        ? 'Invalid URL, check your connection string and try again'
        : error.message
      toast.error("We couldn't connect to the connection", {
        description,
        classNames: {
          description: 'whitespace-pre-wrap',
        },
      })
    },
  })

  const connectionString = useStore(
    form.store,
    (state) => state.values.connectionString
  )
  const url = tryCatch(() => new SafeURL(connectionString.trim())).data
  const {
    name,
    syncType,
    label,
    color,
    type: typeValue,
  } = useStore(form.store, (state) => state.values)
  const isValid = useStore(form.store, (state) => state.isValid)

  const isLocalProxyAvailable = useLocalProxyAvailable()
  const hasPassword = !!url?.password
  const isLocalhost =
    tryCatch(() => isLocalhostConnectionString(connectionString)).data === true
  const { canSend } = fetchingConfig(
    {
      syncType,
      isPasswordExists: hasPassword,
    },
    {
      hasLocalConnectionString: true,
      isLocalProxyAvailable,
      isPasswordPopulated: hasPassword,
      isLocalhost,
    }
  )
  const canSaveInCloud = !!url && canSend

  return (
    <ScrollArea>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="mx-auto flex w-full max-w-2xl flex-col px-6 py-34"
      >
        <div className="mb-6 flex w-full items-center gap-2">
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
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Create a connection
        </h1>
        <p className="text-muted-foreground mb-10 leading-7 not-first:mt-2">
          Connect to your database by providing the connection details.
        </p>
        <Stepper active={step} onChange={setStep}>
          <StepperList>
            <StepperTrigger value="type" number={1}>
              Type
            </StepperTrigger>
            <StepperTrigger value="credentials" number={2}>
              Credentials
            </StepperTrigger>
            <StepperTrigger value="save" number={3}>
              Save
            </StepperTrigger>
          </StepperList>
          <StepperContent value="type">
            <StepType
              type={typeValue}
              setType={(nextType) => {
                form.setFieldValue('type', nextType)
                setStep('credentials')
              }}
            />
          </StepperContent>
          <StepperContent value="credentials">
            {typeValue ? (
              <>
                <StepCredentials
                  ref={inputRef}
                  type={typeValue}
                  connectionString={connectionString}
                  setConnectionString={(nextConnectionString) => {
                    reset()
                    form.setFieldValue('connectionString', nextConnectionString)
                  }}
                  onEnter={() => {
                    if (canSend) {
                      test({ type: typeValue, connectionString })
                    }
                  }}
                />
                <div className="mt-auto flex justify-end gap-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        form.setFieldValue(
                          'type',
                          null as unknown as ConnectionType
                        )
                        setStep('type')
                      }}
                    >
                      Back
                    </Button>
                    {testingStatus === 'success' ? (
                      <Button variant="default" onClick={() => setStep('save')}>
                        Continue
                      </Button>
                    ) : (
                      <Button
                        disabled={
                          testingStatus === 'pending' ||
                          !connectionString ||
                          !canSend
                        }
                        onClick={() =>
                          test({ type: typeValue, connectionString })
                        }
                      >
                        <LoadingContent loading={testingStatus === 'pending'}>
                          {testingStatus === 'error'
                            ? 'Try again'
                            : 'Test connection'}
                        </LoadingContent>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </StepperContent>
          <StepperContent value="save">
            {typeValue ? (
              <>
                <StepSave
                  type={typeValue}
                  name={name}
                  connectionString={connectionString}
                  setName={(nextName) => form.setFieldValue('name', nextName)}
                  onRandomName={() =>
                    form.setFieldValue('name', generateRandomName())
                  }
                  syncType={syncType}
                  setSyncType={(nextSyncType) =>
                    form.setFieldValue('syncType', nextSyncType)
                  }
                  label={label}
                  setLabel={(nextLabel) =>
                    form.setFieldValue('label', nextLabel)
                  }
                  color={color}
                  setColor={(nextColor) =>
                    form.setFieldValue('color', nextColor)
                  }
                />
                <div className="mt-auto flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('credentials')}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || !canSaveInCloud || !activeWorkspace}
                  >
                    <LoadingContent
                      loading={isCreatingConnection || !activeWorkspace}
                    >
                      <AppLogo className="w-4" />
                      Save connection
                    </LoadingContent>
                  </Button>
                </div>
              </>
            ) : null}
          </StepperContent>
        </Stepper>
      </form>
    </ScrollArea>
  )
}

export const Route = createFileRoute('/_protected/create/')({
  beforeLoad: ({ context: { collections } }) => {
    if (
      !permix.check('connection.create', {
        count: collections.connectionsCollection.size,
      })
    ) {
      throw redirect({ to: '/' })
    }
  },
  component: CreateConnectionPage,
  head: () => ({
    meta: [{ title: title('Create connection') }],
  }),
})
