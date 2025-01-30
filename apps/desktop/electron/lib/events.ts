import { encrypt } from '@connnect/shared/encryption'
import { ipcMain } from 'electron'
import pg from 'pg'

interface Connection {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export const events = {
  prepareSecret: async ({ secret }: { secret: string }) => {
    return encrypt({ text: secret, secret: process.env.ELECTRON_LOCAL_SECRET! })
  },
  postgresQuery: async <T>({ connection, query }: { connection: Connection, query: string }) => {
    const client = new pg.Client(connection)

    try {
      await client.connect()

      const result = await client.query(query)

      console.log('result', result)

      return {
        rows: result.rows as T[],
        columns: result.fields.map(field => ({
          ...field,
        })),
      }
    }
    finally {
      await client.end()
    }
  },
}

export function initElectronEvents() {
  Object.entries(events).forEach(([key, handler]) => {
    ipcMain.handle(key, (event, arg) => handler(arg))
  })
}
