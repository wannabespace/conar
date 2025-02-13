import { decrypt, encrypt } from '@connnect/shared/encryption'
import { customType } from 'drizzle-orm/pg-core'
import { env } from '~/env'

export function encryptedJsonb<TData>(name?: string) {
  return customType<{ data: TData, driverData: string }>({
    dataType() {
      return 'jsonb'
    },
    toDriver(value: TData): string {
      return encrypt({ text: JSON.stringify(value), secret: env.ENCRYPTION_SECRET })
    },
    fromDriver(driverData: string): TData {
      return JSON.parse(decrypt({ encryptedText: driverData, secret: env.ENCRYPTION_SECRET })!)
    },
  })(name!)
}
