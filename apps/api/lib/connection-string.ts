import { connectionSecrets } from '@tamery/connection/secrets'
import { encrypt } from '@tamery/shared/crypto-node'
import { SyncType } from '@tamery/shared/enums/sync-type'

export const encryptConnectionString = ({
  connectionString,
  secret,
  syncType,
}: {
  connectionString: string | null | undefined
  secret: string
  syncType: SyncType
}) => {
  if (!connectionString || syncType === SyncType.CloudWithoutConnectionString) {
    return null
  }

  return encrypt({
    secret,
    text:
      syncType === SyncType.Cloud
        ? connectionString
        : connectionSecrets.strip(connectionString),
  })
}
