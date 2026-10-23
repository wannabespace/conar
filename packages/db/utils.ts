import { decrypt, encrypt } from '@tamery/shared/crypto-node'
import { customType } from 'drizzle-orm/pg-core'

import { env } from './env'

export const encryptedColumn = (secret: string) =>
  customType<{ data: string; driverData: string }>({
    dataType() {
      return 'text'
    },
    fromDriver(driverData: string) {
      return decrypt({ encryptedText: driverData, secret })
    },
    toDriver(value: string) {
      return encrypt({ secret, text: value })
    },
  })

export const encryptedJson = <TData>(name?: string) => {
  const column = customType<{ data: TData; driverData: string }>({
    dataType() {
      return 'text'
    },
    fromDriver(driverData: string): TData {
      return JSON.parse(
        decrypt({ encryptedText: driverData, secret: env.ENCRYPTION_SECRET })
      )
    },
    toDriver(value: TData) {
      return encrypt({
        secret: env.ENCRYPTION_SECRET,
        text: JSON.stringify(value),
      })
    },
  })
  return name === undefined ? column() : column(name)
}

export const encryptedText = (name?: string) => {
  const column = encryptedColumn(env.ENCRYPTION_SECRET)
  return name === undefined ? column() : column(name)
}
