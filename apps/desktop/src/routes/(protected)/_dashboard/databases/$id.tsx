import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { trpc } from '~/lib/trpc'

export const Route = createFileRoute('/(protected)/_dashboard/databases/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: database } = useQuery({
    queryKey: ['databases', id],
    queryFn: () => trpc.databases.get.query({ id }),
  })

  async function connect() {
    // const client = new pg.Client({
    //   host: database.host,
    //   port: database.port,
    //   user: database.username,
    //   database: database.database,
    //   password: await decrypt({ encryptedText: database.password!, secret: env.VITE_PUBLIC_PASSWORDS_SECRET }),
    // })
  }

  useEffect(() => {
    connect()
  }, [database])

  return (
    <div>
      <pre>{JSON.stringify(database, null, 2)}</pre>
    </div>
  )
}
