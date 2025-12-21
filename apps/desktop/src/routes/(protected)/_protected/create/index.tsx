import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { title } from '@conar/shared/utils/title'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { Stepper, StepperContent, StepperList, StepperTrigger } from '~/components/stepper'
import { databasesCollection, executeSql, prefetchDatabaseCore } from '~/entities/database'
import { generateRandomName } from '~/lib/utils'
import { StepCredentials } from './-components/step-credentials'
import { StepSave } from './-components/step-save'
import { StepType } from './-components/step-type'

export const Route = createFileRoute(
  '/(protected)/_protected/create/',
)({
  component: CreateConnectionPage,
  head: () => ({
    meta: [{ title: title('Create connection') }],
  }),
})

const createConnectionType = type({
  name: 'string > 1',
  type: type.valueOf(DatabaseType).or('null'),
  connectionString: 'string > 1',
  saveInCloud: 'boolean',
  label: 'string | null',
  color: 'string | null',
})

function CreateConnectionPage() {
  const [step, setStep] = useState<'type' | 'credentials' | 'save'>('type')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function createConnection(data: {
    connectionString: string
    name: string
    type: DatabaseType
    saveInCloud: boolean
    label: string | null
    color: string | null
  }) {
    const id = v7()

    const password = new SafeURL(data.connectionString.trim()).password

    try {
      databasesCollection.insert({
        id,
        name: data.name,
        type: data.type,
        connectionString: data.connectionString,
        label: data.label || null,
        color: data.color || null,
        isPasswordExists: !!password,
        isPasswordPopulated: !!password,
        syncType: data.saveInCloud ? SyncType.Cloud : SyncType.CloudWithoutPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      toast.success('Connection created successfully 🎉')

      const database = databasesCollection.get(id) as typeof databases.$inferSelect

      prefetchDatabaseCore(database)

      router.navigate({ to: '/database/$id/table', params: { id } })
    }
    catch (error) {
      console.error('Failed to create connection:', error)
      toast.error('Failed to create connection', {
        description:
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'An unexpected error occurred while saving the connection.',
      })
    }
  }

  const defaultValues: typeof createConnectionType.infer = {
    connectionString: '',
    name: generateRandomName(),
    type: null,
    saveInCloud: true,
    label: null,
    color: null,
  }

  const form = useForm({
    defaultValues,

    onSubmit(e) {
      const result = createConnectionType(e.value)
      if (result instanceof type.errors) {
        toast.error(result.summary)
        return
      }
      const { type: dbType, connectionString, name, saveInCloud, label, color } = e.value

      if (!dbType) {
        toast.error('Select a database type')
        return
      }

      createConnection({ type: dbType, connectionString, name, saveInCloud, label, color })
    },
  })

  const { mutate: test, reset, status } = useMutation({
    mutationFn: ({ type, connectionString }: { type: DatabaseType, connectionString: string }) => executeSql({
      type,
      connectionString,
      sql: 'SELECT 1',
    }),
    onSuccess: () => {
      setStep('save')
      toast.success('Connection successful. You can save the database.')
    },
    onError: (error) => {
      toast.error('We couldn\'t connect to the database', {
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        description: <span dangerouslySetInnerHTML={{ __html: error.message.replaceAll('\n', '<br />') }} />,
      })
    },
  })

  const typeValue = useStore(form.store, state => state.values.type)
  const connectionString = useStore(form.store, state => state.values.connectionString)
  const name = useStore(form.store, state => state.values.name)
  const saveInCloud = useStore(form.store, state => state.values.saveInCloud)
  const label = useStore(form.store, state => state.values.label)
  const color = useStore(form.store, state => state.values.color)
  const values = useStore(form.store, state => state.values)
  const isValid = !(createConnectionType(values) instanceof type.errors)

  return (
    <ScrollArea className="py-[10vh]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex py-10 flex-col w-full max-w-2xl px-6 mx-auto"
      >
        <div className="flex items-center gap-2 w-full mb-6">
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
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Create a connection
        </h1>
        <p className="leading-7 not-first:mt-2 mb-10 text-muted-foreground">
          Connect to your database by providing the connection details.
        </p>
        <Stepper
          active={step}
          onChange={setStep}
        >
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
              setType={(type) => {
                form.setFieldValue('type', type)
                setStep('credentials')
              }}
            />
          </StepperContent>
          <StepperContent value="credentials">
            <StepCredentials
              ref={inputRef}
              type={typeValue!}
              connectionString={connectionString}
              setConnectionString={(connectionString) => {
                reset()
                form.setFieldValue('connectionString', connectionString)
              }}
              onEnter={() => {
                test({ type: typeValue!, connectionString })
              }}
            />
            <div className="flex gap-2 justify-end mt-auto pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.setFieldValue('type', null as unknown as DatabaseType)
                    setStep('type')
                  }}
                >
                  Back
                </Button>
                {status === 'success'
                  ? (
                      <Button
                        variant="default"
                        onClick={() => setStep('save')}
                      >
                        Continue
                      </Button>
                    )
                  : (
                      <Button
                        disabled={status === 'pending' || !connectionString}
                        onClick={() => test({ type: typeValue!, connectionString })}
                      >
                        <LoadingContent loading={status === 'pending'}>
                          {status === 'error' ? 'Try again' : 'Test connection'}
                        </LoadingContent>
                      </Button>
                    )}
              </div>
            </div>
          </StepperContent>
          <StepperContent value="save">
            <StepSave
              type={typeValue!}
              name={name}
              connectionString={connectionString}
              setName={name => form.setFieldValue('name', name)}
              onRandomName={() => form.setFieldValue('name', generateRandomName())}
              saveInCloud={saveInCloud}
              setSaveInCloud={saveInCloud => form.setFieldValue('saveInCloud', saveInCloud)}
              label={label}
              setLabel={label => form.setFieldValue('label', label)}
              color={color}
              setColor={color => form.setFieldValue('color', color)}
            />
            <div className="flex gap-2 justify-end mt-auto pt-4">
              <Button variant="outline" onClick={() => setStep('credentials')}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={status === 'pending' || !isValid}
              >
                <LoadingContent loading={status === 'pending'}>
                  <AppLogo className="w-4" />
                  Save connection
                </LoadingContent>
              </Button>
            </div>
          </StepperContent>
        </Stepper>
      </form>
    </ScrollArea>
  )
}
