import type { RefObject } from 'react'
import { databaseLabels, DatabaseType } from '@connnect/shared/enums/database-type'
import { getProtocols, isValidConnectionString, parseConnectionString, protocolMap } from '@connnect/shared/utils/connections'
import { getOS } from '@connnect/shared/utils/os'
import { title } from '@connnect/shared/utils/title'
import { AppLogo } from '@connnect/ui/components/brand/app-logo'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Checkbox } from '@connnect/ui/components/checkbox'
import { CommandShortcut } from '@connnect/ui/components/command'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { Label } from '@connnect/ui/components/label'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { ToggleGroup, ToggleGroupItem } from '@connnect/ui/components/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { faker } from '@faker-js/faker'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiArrowLeftSLine, RiLoopLeftLine } from '@remixicon/react'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConnectionDetails } from '~/components/connection-details'
import { Stepper, StepperContent, StepperList, StepperTrigger } from '~/components/stepper'
import { createDatabase, databasesQuery, useTestDatabase } from '~/entities/database'
import { MongoIcon } from '~/icons/mongo'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'
import { queryClient } from '~/main'

const os = getOS()

export const Route = createFileRoute(
  '/(protected)/_protected/create',
)({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: title('Create connection'),
      },
    ],
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
            <PostgresIcon />
            {databaseLabels[DatabaseType.Postgres]}
          </ToggleGroupItem>
          <ToggleGroupItem value="" disabled aria-label="MySQL">
            <MySQLIcon />
            MySQL
          </ToggleGroupItem>
          <ToggleGroupItem value="" disabled aria-label="MongoDB">
            <MongoIcon />
            MongoDB
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
          placeholder={`${getProtocols(type)[0]}://username:password@host:port/database?options`}
          ref={ref}
          value={connectionString}
          onChange={e => setConnectionString(e.target.value)}
        />
      </CardContent>
    </Card>
  )
}

function StepSave({ name, connectionString, setName, onRandomName, saveInCloud, setSaveInCloud }: { name: string, connectionString: string, setName: (name: string) => void, onRandomName: () => void, saveInCloud: boolean, setSaveInCloud: (saveInCloud: boolean) => void }) {
  const nameId = useId()
  const saveInCloudId = useId()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Save connection</CardTitle>
        <CardDescription>Save the connection to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectionDetails className="mb-6" connectionString={connectionString} />
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
                  <TooltipContent>
                    Generate a random connection name
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div>
            <Label htmlFor={saveInCloudId} className="mb-2">
              Sync password
            </Label>
            <label className="text-xs flex items-center gap-2">
              <Checkbox
                id={saveInCloudId}
                checked={saveInCloud}
                onCheckedChange={() => setSaveInCloud(!saveInCloud)}
              />
              <span className="text-muted-foreground">
                Do you want to sync the password in our cloud?
              </span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const [step, setStep] = useState<'type' | 'credentials' | 'save'>('type')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: createDatabase,
    onSuccess: async ({ id }) => {
      toast.success('Connection created successfully 🎉')
      await queryClient.invalidateQueries({ queryKey: databasesQuery().queryKey })
      router.navigate({ to: '/database/$id/tables', params: { id } })
    },
  })
  const { mutate: testConnection, isPending: isConnecting } = useTestDatabase()

  const form = useForm({
    defaultValues: {
      connectionString: '',
      name: generateRandomName(),
      type: null! as DatabaseType,
      saveInCloud: true,
    },
    validators: {
      onChange: type({
        name: 'string > 1',
        type: type.valueOf(DatabaseType),
        connectionString: type('string').narrow(str => isValidConnectionString(str)),
        saveInCloud: 'boolean',
      }),
      onSubmit(e) {
        mutate(e.value)
      },
    },
  })

  useKeyboardEvent(e => e.key === 'v' && (os === 'macos' ? e.metaKey : e.ctrlKey), async (e) => {
    if (inputRef.current === e.target)
      return

    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseConnectionString(text)
      const protocolsEntries = Object.entries(protocolMap)

      if (protocolsEntries.every(([, protocols]) => !protocols.includes(parsed.protocol))) {
        toast.error('Sorry, we currently do not support this protocol')
        return
      }

      const type = protocolsEntries.find(([_, protocols]) => protocols.includes(parsed.protocol))?.[0] as DatabaseType

      form.setFieldValue('connectionString', text)
      form.setFieldValue('type', type)

      setStep('save')

      toast.success('Connection string pasted successfully')
    }
    catch {
      toast.error('Sorry, we couldn\'t parse the connection string')
    }
  })

  const [typeValue, connectionString, name, saveInCloud] = useStore(form.store, ({ values }) => [values.type, values.connectionString, values.name, values.saveInCloud])
  const isConnectionStringValid = useStore(form.store, state => isValidConnectionString(state.values.connectionString))

  return (
    <div className="w-full">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex py-10 flex-col w-full max-w-2xl mx-auto"
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
          Press
          {' '}
          <CommandShortcut>⌘</CommandShortcut>
          {' '}
          +
          {' '}
          <CommandShortcut>V</CommandShortcut>
          {' '}
          to automatically fill the form if you've copied a connection string.
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
                Next
              </Button>
            </div>
          </StepperContent>
          <StepperContent value="credentials">
            <StepCredentials
              ref={inputRef}
              type={typeValue}
              connectionString={connectionString}
              setConnectionString={connectionString => form.setFieldValue('connectionString', connectionString)}
            />
            <div className="flex gap-2 justify-between mt-auto pt-4">
              <Button
                variant="outline"
                disabled={isConnecting || isCreating || !isConnectionStringValid}
                onClick={() => testConnection(form.state.values)}
              >
                <LoadingContent loading={isConnecting}>
                  Test connection
                </LoadingContent>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('type')}>
                  Back
                </Button>
                <Button
                  disabled={!isConnectionStringValid}
                  onClick={() => setStep('save')}
                >
                  Next
                </Button>
              </div>
            </div>
          </StepperContent>
          <StepperContent value="save">
            <StepSave
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
                disabled={isCreating || isConnecting || !form.state.isValid}
              >
                <LoadingContent loading={isCreating}>
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
