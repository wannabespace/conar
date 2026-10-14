import { title } from '@tamery/shared/title'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { permix } from '~/core/user/permissions'
import { ConnectionPage } from '~/modules/connection-form/components/connection-page'

import { useCreateConnection } from './-lib/use-create-connection'

const CreateConnectionPage = () => {
  const persist = useCreateConnection()
  return <ConnectionPage mode={{ kind: 'create' }} persist={persist} />
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
