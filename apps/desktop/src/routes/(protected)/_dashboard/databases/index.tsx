import { DatabaseType } from '@connnect/shared/enums/database-type'
import { enumValues } from '@connnect/shared/utils'
import { Button } from '@connnect/ui/components/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getQueryKey } from '@trpc/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { handleError } from '~/lib/error'
import { trpcReact } from '~/lib/trpc'
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
  const { mutate: createDatabase } = trpcReact.databases.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey(trpcReact.databases.list) })
    },
  })
  const { data: databases, error } = trpcReact.databases.list.useQuery()
  handleError(error)

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    createDatabase(values)
  }

  return (
    <div>
      Hello from databases layout
      <pre>{JSON.stringify(databases, null, 2)}</pre>
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
