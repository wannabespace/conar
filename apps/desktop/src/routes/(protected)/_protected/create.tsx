import type { RefObject } from 'react'
import { databaseLabels, DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { getProtocols } from '@conar/shared/utils/connections'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { title } from '@conar/shared/utils/title'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Checkbox } from '@conar/ui/components/checkbox'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { faker } from '@faker-js/faker'
import { RiArrowLeftSLine, RiLoopLeftLine } from '@remixicon/react'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import posthog from 'posthog-js'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { ConnectionDetails } from '~/components/connection-details'
import { Stepper, StepperContent, StepperList, StepperTrigger } from '~/components/stepper'
import { DatabaseIcon, databasesCollection, dbTestConnection, prefetchDatabaseCore } from '~/entities/database'
import { MongoIcon } from '~/icons/mongo'
import { MySQLIcon } from '~/icons/mysql'

export const Route = createFileRoute(
  '/(protected)/_protected/create',
)({
  component: CreateConnectionPage,
  head: () => ({
    meta: [{ title: title('Create connection') }],
  }),
})

function generateRandomName() {
  const vehicle = faker.vehicle.model()
  const color = faker.color.human()

  return `${color.charAt(0).toUpperCase() + color.slice(1)} ${vehicle}`
}

function StepType({ type, setType }: { type: DatabaseType, setType: (type: DatabaseType) => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Type of connection</CardTitle>
        <CardDescription>Choose the type of connection you want to create.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          variant="outline"
          value={type}
          onValueChange={value => setType(value as DatabaseType)}
        >
          <ToggleGroupItem value={DatabaseType.Postgres} aria-label="Postgres">
            <DatabaseIcon type={DatabaseType.Postgres} className="size-4 shrink-0 text-primary" />
            {databaseLabels[DatabaseType.Postgres]}
          </ToggleGroupItem>
          <ToggleGroupItem value="" disabled aria-label="MySQL">
            <MySQLIcon />
            MySQL (soon)
          </ToggleGroupItem>
          <ToggleGroupItem value="" disabled aria-label="MongoDB">
            <MongoIcon />
            MongoDB (soon)
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}

function StepCredentials({ ref, type, connectionString, setConnectionString }: { ref: RefObject<HTMLInputElement | null>, type: DatabaseType, connectionString: string, setConnectionString: (connectionString: string) => void }) {
  const id = useId()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>Enter the credentials of your connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor={id} className="mb-2">
          Connection string
        </Label>
        <Input
          id={id}
          placeholder={`${getProtocols(type)[0]}://user:password@host:port/database?options`}
          ref={ref}
          value={connectionString}
          onChange={e => setConnectionString(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
            }
          }}
        />
      </CardContent>
    </Card>
  )
}

function StepSave({ type, name, connectionString, setName, onRandomName, saveInCloud, setSaveInCloud }: { type: DatabaseType, name: string, connectionString: string, setName: (name: string) => void, onRandomName: () => void, saveInCloud: boolean, setSaveInCloud: (saveInCloud: boolean) => void }) {
  const nameId = useId()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Save connection</CardTitle>
        <CardDescription>Save the connection to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectionDetails className="mb-6" type={type} connectionString={connectionString} />
        <div className="flex flex-col gap-6">
          <div>
            <Label htmlFor={nameId} className="mb-2">
              Connection name
            </Label>
            <div className="flex w-full gap-2 items-end">
              <Input
                id={nameId}
                className="field-sizing-content"
                placeholder="My connection"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onRandomName}
                    >
                      <RiLoopLeftLine />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    Generate a random connection name
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm flex items-center gap-2">
              <Checkbox
                checked={saveInCloud}
                onCheckedChange={() => setSaveInCloud(!saveInCloud)}
              />
              Do you want to sync the password in our cloud?
            </label>
            <div className="text-xs text-muted-foreground/50 text-balance">
              Syncing passwords in our cloud allows access from any device without re-entering the password.
              <br />
              If not synced, we will store the connection string without the password.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateConnectionPage() {
  const [step, setStep] = useState<'type' | 'credentials' | 'save'>('type')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function createDatabase(data: { connectionString: string, name: string, type: DatabaseType, saveInCloud: boolean }) {
    const id = v7()

    const password = new SafeURL(data.connectionString.trim()).password

    databasesCollection.insert({
      id,
      name: data.name,
      type: data.type,
      connectionString: data.connectionString,
      isPasswordExists: !!password,
      isPasswordPopulated: !!password,
      syncType: data.saveInCloud ? SyncType.Cloud : SyncType.CloudWithoutPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    toast.success('Connection created successfully 🎉')
    const database = databasesCollection.get(id)!

    prefetchDatabaseCore(database)

    router.navigate({ to: '/database/$id/table', params: { id } })
  }

  const form = useForm({
    defaultValues: {
      connectionString: '',
      name: generateRandomName(),
      type: DatabaseType.Postgres,
      saveInCloud: true,
    },
    validators: {
      onChange: type({
        name: 'string > 1',
        type: type.valueOf(DatabaseType),
        connectionString: 'string > 1',
        saveInCloud: 'boolean',
      }),
      onSubmit(e) {
        createDatabase(e.value)
      },
    },
  })

  const { mutate: testConnection, reset, status } = useMutation({
    mutationFn: dbTestConnection,
    onSuccess: () => {
      setStep('save')
      toast.success('Connection successful. You can save the database.')
    },
    onError: (error) => {
      posthog.capture('connection_test_failed', {
        error: error.message,
      })
      toast.error('We couldn\'t connect to the database', {
        description: error.message,
      })
    },
  })

  const [typeValue, connectionString, name, saveInCloud] = useStore(form.store, ({ values }) => [values.type, values.connectionString, values.name, values.saveInCloud])

  return (
    <div className="min-h-screen flex flex-col justify-center">
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
        <p className="leading-7 [&:not(:first-child)]:mt-2 mb-10 text-muted-foreground">
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
            <StepType type={typeValue} setType={type => form.setFieldValue('type', type)} />
            <div className="mt-auto flex justify-end gap-4 pt-4">
              <Button
                disabled={!typeValue}
                onClick={() => setStep('credentials')}
              >
                Continue
              </Button>
            </div>
          </StepperContent>
          <StepperContent value="credentials">
            <StepCredentials
              ref={inputRef}
              type={typeValue}
              connectionString={connectionString}
              setConnectionString={(connectionString) => {
                reset()
                form.setFieldValue('connectionString', connectionString)
              }}
            />
            <div className="flex gap-2 justify-end mt-auto pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('type')}>
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
                        onClick={() => testConnection(form.state.values)}
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
              type={typeValue}
              name={name}
              connectionString={connectionString}
              setName={name => form.setFieldValue('name', name)}
              onRandomName={() => form.setFieldValue('name', generateRandomName())}
              saveInCloud={saveInCloud}
              setSaveInCloud={saveInCloud => form.setFieldValue('saveInCloud', saveInCloud)}
            />
            <div className="flex gap-2 justify-end mt-auto pt-4">
              <Button variant="outline" onClick={() => setStep('credentials')}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={status === 'pending' || !form.state.isValid}
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
    </div>
  )
}
