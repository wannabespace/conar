import { DatabaseType } from '@connnect/shared/enums/database-type'
import { enumValues } from '@connnect/shared/utils'
import { Button } from '@connnect/ui/components/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSession } from '~/hooks/use-session'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'

export const Route = createFileRoute('/(protected)/_dashboard/databases/')({
  component: RouteComponent,
})

const formSchema = z.object({
  name: z.string().optional(),
  type: z.enum(enumValues(DatabaseType)),
  host: z.string().min(1),
  port: z.number().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
})

function RouteComponent() {
  const { data } = useSession()
  const { mutate: createDatabase } = useMutation({
    mutationKey: ['databases', 'create'],
    mutationFn: (values: z.infer<typeof formSchema>) => trpc.databases.create.mutate(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases', 'list'] })
    },
  })
  const { data: databases } = useQuery({
    queryKey: ['databases', 'list'],
    queryFn: () => trpc.databases.list.query(),
  })

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: DatabaseType.Postgres,
      name: 'connnect',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    createDatabase({
      ...values,
      password: await window.electron.encryption.encrypt({ text: values.password, secret: data!.user.secret! }),
    })
  }

  return (
    <div>
      Hello from databases layout
      {databases?.map(database => (
        <div key={database.id}>
          <Button onClick={() => router.navigate({ to: '/databases/$id', params: { id: database.id } })}>
            Open
            {database.name}
          </Button>
        </div>
      ))}
      <Form onSubmit={onSubmit} {...form} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>SQL Databases</SelectLabel>
                      <SelectItem value="postgres">Postgres</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="connnect" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="host"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host</FormLabel>
              <FormControl>
                <Input placeholder="localhost" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port</FormLabel>
              <FormControl>
                <Input placeholder="5432" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="postgres" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="postgres" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="database"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Database</FormLabel>
              <FormControl>
                <Input placeholder="postgres" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </Form>
      <Outlet />
    </div>
  )
}
