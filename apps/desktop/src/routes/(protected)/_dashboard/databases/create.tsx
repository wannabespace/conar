import { DatabaseType } from '@connnect/shared/enums/database-type'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Checkbox } from '@connnect/ui/components/checkbox'
import { CommandShortcut } from '@connnect/ui/components/command'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { ToggleGroup, ToggleGroupItem } from '@connnect/ui/components/toggle-group'
import { faker } from '@faker-js/faker'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
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
  '/(protected)/_dashboard/databases/create',
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
  name: faker.word.words(2),
  type: null!,
  username: 'postgres.oywnxcvzfsqzhfwvavrd',
  password: 'hXjwbSoyh8UsXhjn',
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  options: '',
  database: 'postgres',
}

function RouteComponent() {
  const [hidePassword, setHidePassword] = useState(false)
  const [saveInCloud, setSaveInCloud] = useState(true)
  const [step, setStep] = useState<'type' | 'details' | 'save'>('type')
  const { mutate: createDatabase } = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      trpc.databases.create.mutate({ ...values, type: DatabaseType.Postgres }),
    onSuccess: () => {
      queryClient.invalidateQueries(databasesQuery())
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
    createDatabase(values)
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
        </StepperStep>
        <StepperStep id="save">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Test connection</CardTitle>
              <CardDescription>Test the connection to the database. You can skip this step if you want to save the connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  loading={isConnecting}
                  disabled={form.formState.isSubmitting}
                  onClick={() => testConnection(form.getValues())}
                >
                  Test connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </StepperStep>
      </Stepper>
      <div className="mt-auto flex justify-end gap-4">
        {step === 'type' && (
          <Button
            disabled={!type}
            onClick={() => setStep('details')}
          >
            Next
          </Button>
        )}
        {step === 'details' && (
          <>
            <Button variant="outline" onClick={() => setStep('type')}>
              Back
            </Button>
            <Button
              disabled={!form.formState.isValid}
              onClick={() => setStep('save')}
            >
              Next
            </Button>
          </>
        )}
        {step === 'save' && (
          <>
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
          </>
        )}
      </div>
    </Form>
  )
}
