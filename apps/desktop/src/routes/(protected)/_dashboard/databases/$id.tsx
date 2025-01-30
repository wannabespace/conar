import { Button } from '@connnect/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Monaco } from '~/components/monaco'
import { trpc } from '~/lib/trpc'

export const Route = createFileRoute('/(protected)/_dashboard/databases/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: database } = useQuery({
    queryKey: ['databases', id],
    queryFn: () => trpc.databases.get.query({ id }),
  })
  // eslint-disable-next-line ts/no-explicit-any
  const [result, setResult] = useState<any>(null)

  function send(query: string) {
    if (!database)
      return

    window.electronAPI.postgresQuery({
      connection: {
        host: database.host,
        port: database.port,
        user: database.username,
        password: 'hXjwbSoyh8UsXhjn',
        database: database.database,
      },
      query,
    }).then((data) => {
      setResult(data)
    })
  }
  return (
    <div>
      <Monaco initialValue={query} onChange={setQuery} />
      <Button onClick={() => send(query)}>Query</Button>
      <pre>{JSON.stringify(result?.rows, null, 2)}</pre>
    </div>
  )
}
