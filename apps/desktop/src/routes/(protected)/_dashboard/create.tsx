import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { getProtocols, parseConnectionString, protocolMap } from '@connnect/shared/utils/connections'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Checkbox } from '@connnect/ui/components/checkbox'
import { CommandShortcut } from '@connnect/ui/components/command'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { ToggleGroup, ToggleGroupItem } from '@connnect/ui/components/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { faker } from '@faker-js/faker'
import { zodResolver } from '@hookform/resolvers/zod'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiRefreshLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppLogo } from '~/components/app-logo'
import { Stepper, StepperContent, StepperList, StepperTrigger } from '~/components/stepper'
import { MongoIcon } from '~/icons/mongo'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'
import { connectionsQuery } from '~/queries/connections'
import { ConnectionDetails } from './-components/connection-details'

export const Route = createFileRoute(
  '/(protected)/_dashboard/create',
)({
  component: RouteComponent,
})

const formSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(ConnectionType),
  connectionString: z.string().refine((value) => {
    try {
      parseConnectionString(value)
      return true
    }
    catch {
      return false
    }
  }, 'Invalid connection string format'),
})

function generateRandomName() {
  return `${faker.color.human()} ${faker.animal.type()}`
}

const defaultCredentials = {
  connectionString: '',
  name: generateRandomName(),
  type: null!,
}

function RouteComponent() {
  const [saveInCloud, setSaveInCloud] = useState(true)
  const [step, setStep] = useState<'type' | 'credentials' | 'save'>('type')
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultCredentials,
  })

  useKeyboardEvent(e => e.key === 'v' && e.metaKey, async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseConnectionString(text)
      const protocolsEntries = Object.entries(protocolMap)

      if (!protocolsEntries.some(([_, protocols]) => protocols.includes(parsed.protocol))) {
        toast.error('Sorry, we currently do not support this protocol')
        return
      }

      const type = protocolsEntries.find(([_, protocols]) => protocols.includes(parsed.protocol))?.[0] as ConnectionType

      form.setValue('connectionString', text)
      form.setValue('type', type)
      setStep('credentials')

      toast.success('Connection string pasted successfully')
    }
    catch {
      toast.error('Sorry, we couldn\'t parse the connection string')
    }
  })

  const [type, connectionString] = useWatch({ control: form.control, name: ['type', 'connectionString'] })

  const { mutateAsync: createConnection } = useMutation({
    mutationFn: trpc.connections.create.mutate,
    onSuccess: (data) => {
      queryClient.invalidateQueries(connectionsQuery())
      toast.success('Connection created successfully 🎉')
      router.navigate({ to: '/connections/$id', params: { id: data.id } })
    },
  })
  const { mutate: testConnection, isPending: isConnecting } = useMutation({
    mutationFn: window.electron.connections.testConnection,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Connection successful. You can now save the connection.')
    },
  })

  return (
    <Form {...form} onSubmit={v => createConnection(v)} className="flex py-10 flex-col w-full max-w-2xl mx-auto">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
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
                onValueChange={value => form.setValue('type', value as ConnectionType)}
              >
                <ToggleGroupItem value={ConnectionType.Postgres} aria-label="Postgres">
                  <PostgresIcon />
                  Postgres
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
          <div className="mt-auto flex justify-end gap-4 pt-4">
            <Button
              disabled={!type}
              onClick={() => setStep('credentials')}
            >
              Next
            </Button>
          </div>
        </StepperContent>
        <StepperContent value="credentials">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>Enter the credentials of your connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="connectionString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Connection string
                    </FormLabel>
                    <FormControl className="flex items-center gap-1">
                      <Input
                        placeholder={`${getProtocols(type)[0]}://username:password@host:port/database?options`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ConnectionDetails connectionString={connectionString} />
            </CardContent>
          </Card>
          <div className="flex gap-2 justify-between mt-auto pt-4">
            <Button
              variant="outline"
              loading={isConnecting}
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              onClick={() => testConnection(form.getValues())}
            >
              Test connection
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('type')}>
                Back
              </Button>
              <Button
                disabled={!form.formState.isValid}
                onClick={() => setStep('save')}
              >
                Next
              </Button>
            </div>
          </div>
        </StepperContent>
        <StepperContent value="save">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Save connection</CardTitle>
              <CardDescription>Save the connection to the database.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block">
                        Database name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="field-sizing-content"
                          placeholder="My database"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => form.setValue('name', generateRandomName())}
                      >
                        <RiRefreshLine className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Generate a random database name
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
          <div className="mt-auto flex justify-end gap-4 pt-4">
            <label className="text-xs flex items-center gap-2">
              <Checkbox
                checked={saveInCloud}
                onCheckedChange={checked => setSaveInCloud(checked === 'indeterminate' ? false : checked)}
              />
              <span className="text-muted-foreground">
                Save the password in cloud
              </span>
            </label>
            <Button variant="outline" onClick={() => setStep('credentials')}>
              Back
            </Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={isConnecting}
            >
              <AppLogo className="w-4" />
              Save connection
            </Button>
          </div>
        </StepperContent>
      </Stepper>
    </Form>
  )
}
