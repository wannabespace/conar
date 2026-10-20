import type { Dialect } from '@tamery/shared/enums/connection-type'

import { getCollections } from '~/core/collections'
import type { ConnectionResource } from '~/core/connection/sync'

import { getCapabilities } from './capabilities'

export const getDefaultSchema = (
  dialect: Dialect,
  connectionResource: Pick<ConnectionResource, 'connectionId' | 'name'>
) =>
  getCapabilities(dialect).defaultSchema ??
  getCollections().connectionStringsCollection.get(
    connectionResource.connectionId
  )?.defaultSchema ??
  connectionResource.name
