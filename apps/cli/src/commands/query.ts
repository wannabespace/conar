import type { QueryExecutor } from '@conar/connection/queries'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ORPCOutputs } from '~/orpc'
import fs from 'node:fs'
import process from 'node:process'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import { boolean, command, positional, string } from '@drizzle-team/brocli'
import { consola } from 'consola'
import ora from 'ora'
import { orpc } from '~/orpc'
import { requireSession } from '~/session'

type Connection = ORPCOutputs['connections']['list'][number]

const queryMap = {
  postgres: pg.query,
  mysql: mysql.query,
  clickhouse: clickhouse.query,
  mssql: mssql.query,
} satisfies Record<ConnectionType, QueryExecutor>

function fail(message: string): never {
  consola.fail(message)
  process.exit(1)
}

function pickConnection(connections: Connection[], identifier: string | undefined): Connection {
  if (connections.length === 0) {
    fail('No connections found. Create one in the Conar app first.')
  }

  if (!identifier) {
    if (connections.length === 1) {
      return connections[0]!
    }

    consola.error('Multiple connections available. Specify one with --connection <id|name>.')
    for (const c of connections) {
      consola.log(`  ${c.name}  (${c.type})  ${c.id}`)
    }
    return process.exit(1)
  }

  const byId = connections.find(c => c.id === identifier)
  if (byId)
    return byId

  const matchesByName = connections.filter(c => c.name === identifier)
  if (matchesByName.length === 1)
    return matchesByName[0]!

  if (matchesByName.length > 1) {
    consola.error(`Multiple connections named "${identifier}". Use a connection id instead:`)
    for (const c of matchesByName) {
      consola.log(`  ${c.id}  (${c.type})`)
    }
    return process.exit(1)
  }

  return fail(`Connection not found: ${identifier}`)
}

function formatTable(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return '(no rows)'
  }

  const columns = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach(k => set.add(k))
      return set
    }, new Set()),
  )

  const stringify = (v: unknown): string => {
    if (v === null)
      return 'NULL'
    if (v === undefined)
      return ''
    if (typeof v === 'object')
      return JSON.stringify(v)
    return String(v)
  }

  const widths = columns.map(col =>
    Math.max(col.length, ...rows.map(r => stringify(r[col]).length)),
  )

  const renderRow = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i]!)).join(' │ ')

  const header = renderRow(columns)
  const separator = widths.map(w => '─'.repeat(w)).join('─┼─')
  const body = rows.map(r => renderRow(columns.map(c => stringify(r[c]))))

  return [header, separator, ...body].join('\n')
}

export const queryCommand = command({
  name: 'query',
  desc: 'Run a SQL query against one of your connections',
  options: {
    sql: positional('sql').desc('SQL query to execute (omit when using --file)'),
    connection: string()
      .alias('c')
      .desc('Connection id or name. Required if you have more than one connection.'),
    file: string()
      .alias('f')
      .desc('Read the SQL query from a file instead of the positional argument'),
    json: boolean().desc('Output the result as raw JSON'),
    list: boolean('list-connections').desc('List available connections and exit'),
  },
  handler: async (opts) => {
    await requireSession()

    const loadingSpinner = ora('Loading connections...').start()
    let connections: Connection[]
    try {
      connections = await orpc.connections.list()
      loadingSpinner.stop()
    }
    catch (error) {
      loadingSpinner.stop()
      consola.fail('Failed to load connections.')
      return fail(error instanceof Error ? error.message : String(error))
    }

    if (opts.list) {
      if (connections.length === 0) {
        consola.info('No connections found.')
        return
      }
      consola.info(`Found ${connections.length} connection${connections.length === 1 ? '' : 's'}:`)
      for (const c of connections) {
        consola.log(`  ${c.name}  (${c.type})  ${c.id}`)
      }
      return
    }

    let sql: string | undefined = opts.sql

    if (opts.file) {
      try {
        sql = fs.readFileSync(opts.file, 'utf-8')
      }
      catch (error) {
        return fail(`Failed to read SQL file: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (!sql || !sql.trim()) {
      return fail('No SQL provided. Pass it as a query string argument or with --file <path>.')
    }

    const connection = pickConnection(connections, opts.connection)
    const executor = queryMap[connection.type as ConnectionType]

    const querySpinner = ora(`Executing query on ${connection.name} (${connection.type})...`).start()

    const start = Date.now()

    try {
      const result = await executor.execute({
        connectionString: connection.connectionString,
        query: sql,
      })

      const ms = Math.round(result.duration ?? Date.now() - start)
      querySpinner.stop()
      consola.success(`Query completed in ${ms}ms.`)

      if (opts.json) {
        consola.log(JSON.stringify(result.result, null, 2))
        return process.exit(0)
      }

      if (Array.isArray(result.result)) {
        consola.log(formatTable(result.result as Record<string, unknown>[]))
      }
      else {
        consola.log(JSON.stringify(result.result, null, 2))
      }
      return process.exit(0)
    }
    catch (error) {
      querySpinner.stop()
      consola.fail('Query failed.')
      return fail(error instanceof Error ? error.message : String(error))
    }
  },
})
