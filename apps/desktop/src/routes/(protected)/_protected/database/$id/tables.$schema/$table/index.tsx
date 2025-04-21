import { title } from '@connnect/shared/utils/title'
import { createFileRoute } from '@tanstack/react-router'
import { databaseQuery, prefetchDatabaseTableCore } from '~/entities/database'
import { queryClient } from '~/main'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { Table } from './-components/table'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table/',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))
    await prefetchDatabaseTableCore(database, params.schema, params.table)
    return { database }
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: title(`${params.schema}.${params.table}`, loaderData.database.name),
      },
    ],
  }),
})

function RouteComponent() {
  return (
    <div className="h-screen flex flex-col justify-between">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Table />
      </div>
      <Footer />
    </div>
  )
}
