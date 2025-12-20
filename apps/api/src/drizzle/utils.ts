import { decrypt, encrypt } from '@conar/shared/encryption'
import { customType } from 'drizzle-orm/pg-core'
import { env } from '~/env'

export function encryptedJson<TData>(name?: string) {
  return customType<{ data: TData; driverData: string }>({
    dataType() {
      return 'text'
    },
    toDriver(value: TData) {
      return encrypt({ text: JSON.stringify(value), secret: env.ENCRYPTION_SECRET })
    },
    fromDriver(driverData: string): TData {
      return JSON.parse(decrypt({ encryptedText: driverData, secret: env.ENCRYPTION_SECRET })!)
    },
  })(name!)
}

export function encryptedText(name?: string) {
  return customType<{ data: string; driverData: string }>({
    dataType() {
      return 'text'
    },
    toDriver(value: string) {
      return encrypt({ text: value, secret: env.ENCRYPTION_SECRET })
    },
    fromDriver(driverData: string) {
      return decrypt({ encryptedText: driverData, secret: env.ENCRYPTION_SECRET })!
    },
  })(name!)
}
