import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/_protected/')({
  loader: async () => {
    return {
      title: 'Site name!',
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
  component: HomeComponent,
})

function HomeComponent() {
  const { title } = Route.useLoaderData()

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <p>{title}</p>
    </div>
  )
}
