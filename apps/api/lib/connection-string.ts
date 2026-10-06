import { encrypt } from '@tamery/shared/crypto-node'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/safe-url'

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

  const url = new SafeURL(connectionString)

  if (syncType !== SyncType.Cloud) {
    url.password = ''
  }

  return encrypt({ secret, text: url.toString() })
}
