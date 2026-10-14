import { title } from '@tamery/shared/title'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { permix } from '~/core/user/permissions'

import { ConnectionPage } from './-components/connection-page'
import { useCreateConnection } from './-lib/use-create-connection'

const CreateConnectionPage = () => {
  const { mutateAsync } = useCreateConnection()
  return <ConnectionPage persist={mutateAsync} />
}

export const Route = createFileRoute('/_protected/create/')({
  beforeLoad: ({ context: { collections } }) => {
    if (
      !permix.check('connection.create', {
        count: collections.connectionsCollection.size,
      })
    ) {
      throw redirect({ to: '/' })
    }
  },
  component: CreateConnectionPage,
  head: () => ({
    meta: [{ title: title('New connection') }],
  }),
})
