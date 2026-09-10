import { getCollections } from '~/entities/collections'
import { orpc } from '~/lib/orpc'

import { workspaceSelection } from './utils'

export const createWorkspace = async (name: string) => {
  const { workspacesCollection } = getCollections()

  const workspace = await orpc.workspaces.create.call({ name })

  await workspacesCollection.utils.awaitChange(
    workspace.id,
    workspace.updatedAt
  )

  workspaceSelection.set(workspace.id)

  return workspace
}
