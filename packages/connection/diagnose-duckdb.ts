import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { DiagnosisRule } from './diagnosis'

const LOCK_HOLDER = /lock is held in (?<program>\S+)/u

const RULES: Omit<DiagnosisRule, 'engine'>[] = [
  {
    diagnose: () => ({
      focus: 'database',
      hint: 'Choose the database file itself, not a WAL, export or other file. A SQLite file opens with the SQLite engine.',
      title: "That file isn't a DuckDB database",
    }),
    match: /not a valid duckdb database file/iu,
  },
  {
    diagnose: ({ parts }) => ({
      focus: 'database',
      hint: `Tamery looked for it at ${parts.database}. It may have been moved, renamed or deleted, or the path names a folder. Choose the file again.`,
      title: "Can't open the database file",
    }),
    match:
      /cannot open file .*no such file|could not read from file .*is a directory/iu,
  },
  {
    diagnose: ({ message }) => {
      const program = LOCK_HOLDER.exec(message)?.groups?.program
      return {
        hint: `DuckDB lets one program open a file for writing at a time${program ? `, and ${program.slice(program.lastIndexOf('/') + 1)} has it` : ''}. Close it there, or detach it from that session, then try again.`,
        title: 'Another program has this file open',
      }
    },
    match: /could not set lock on file/iu,
  },
  {
    diagnose: () => ({
      focus: 'password',
      hint: 'Use the token quack_serve returned when the server started, or the one passed to it as token.',
      title: 'The server refused the token',
    }),
    match: /authentication failed/iu,
  },
]

export const DUCKDB_RULES: DiagnosisRule[] = RULES.map((rule) => ({
  ...rule,
  engine: ConnectionType.DuckDB,
}))
