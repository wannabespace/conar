import { DatabaseType } from '@connnect/shared/enums/database-type'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Checkbox } from '@connnect/ui/components/checkbox'
import { CommandShortcut } from '@connnect/ui/components/command'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { ToggleGroup, ToggleGroupItem } from '@connnect/ui/components/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { faker } from '@faker-js/faker'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiRefreshLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppLogo } from '~/components/app-logo'
import { Stepper, StepperStep } from '~/components/stepper'
import { MongoIcon } from '~/icons/mongo'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'
import { databasesQuery } from '~/queries/databases'

export const Route = createFileRoute(
  '/(protected)/_dashboard/create',
)({
  component: RouteComponent,
})

const formSchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(DatabaseType),
  host: z.string().min(1),
  port: z.number().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
  options: z.string().optional(),
})

const defaultCredentials = {
  name: faker.music.songName(),
  type: null!,
  username: 'postgres.oywnxcvzfsqzhfwvavrd',
  password: 'JmvmGeTTAcqiwRyk',
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  options: '',
  database: 'postgres',
}

function RouteComponent() {
  const [hidePassword, setHidePassword] = useState(false)
  const [saveInCloud, setSaveInCloud] = useState(true)
  const [step, setStep] = useState<'type' | 'details' | 'save'>('type')
  const router = useRouter()
  const { mutateAsync: createDatabase } = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      trpc.databases.create.mutate({ ...values, type: DatabaseType.Postgres }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(databasesQuery())
      router.navigate({ to: '/databases/$id', params: { id: data.id } })
      toast.success('Database created successfully 🎉')
    },
  })
  const { mutate: testConnection, isPending: isConnecting } = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      window.electron.databases.testConnection({ credentials: values, type: DatabaseType.Postgres }),
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Connection successful. You can now save the connection.')
    },
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultCredentials,
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createDatabase(values)
  }

  const type = useWatch({ control: form.control, name: 'type' })

  return (
    <Form onSubmit={onSubmit} {...form} className="flex flex-col py-10 gap-6 w-full max-w-2xl mx-auto">
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
      <div className="text-sm text-muted-foreground">
        Press
        {' '}
        <CommandShortcut>⌘</CommandShortcut>
        {' '}
        +
        {' '}
        <CommandShortcut>V</CommandShortcut>
        {' '}
        to automatically fill the form if you've copied a connection string.
      </div>
      <Stepper
        steps={[
          {
            id: 'type',
            label: 'Type',
          },
          {
            id: 'details',
            label: 'Details',
          },
          {
            id: 'save',
            label: 'Save',
          },
        ]}
        active={step}
        onChange={setStep}
      >
        <StepperStep id="type">
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
                onValueChange={value => form.setValue('type', value as DatabaseType)}
              >
                <ToggleGroupItem value={DatabaseType.Postgres} aria-label="Postgres">
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
          <div className="mt-auto flex justify-end gap-4">
            <Button
              disabled={!type}
              onClick={() => setStep('details')}
            >
              Next
            </Button>
          </div>
        </StepperStep>
        <StepperStep id="details">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Connection details</CardTitle>
              <CardDescription>Enter the connection details for the database you want to connect to.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block">
                          Username
                        </FormLabel>
                        <FormControl className="flex items-center gap-1">
                          <Input
                            className="field-sizing-content"
                            placeholder="username"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem className="relative">
                        <FormLabel className="block">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="field-sizing-content"
                            placeholder="password"
                            type={hidePassword ? 'password' : 'text'}
                            {...field}
                            onChange={(e) => {
                              onChange(e)
                              setHidePassword(true)
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block">
                          Host
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="field-sizing-content"
                            placeholder="localhost"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block">
                          Port
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="field-sizing-content"
                            placeholder="5432"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="database"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block">
                          Database
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="field-sizing-content"
                            placeholder="postgres"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block">
                          Options
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="field-sizing-content"
                            placeholder="sslmode=require"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2 justify-between mt-auto">
            <Button
              variant="outline"
              loading={isConnecting}
              disabled={form.formState.isSubmitting}
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
        </StepperStep>
        <StepperStep id="save">
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
                        onClick={() => form.setValue('name', faker.music.songName())}
                      >
                        <RiRefreshLine className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Generate a random database name from song titles
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
          <div className="mt-auto flex justify-end gap-4">
            <label className="text-xs flex items-center gap-2">
              <Checkbox
                checked={saveInCloud}
                onCheckedChange={checked => setSaveInCloud(checked === 'indeterminate' ? false : checked)}
              />
              <span className="text-muted-foreground">
                Save the password in cloud
              </span>
            </label>
            <Button variant="outline" onClick={() => setStep('details')}>
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
        </StepperStep>
      </Stepper>
    </Form>
  )
}
