import type { ConnectionGuess, GuessFix } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import {
  connectionTypeLabels,
  providers,
} from '@tamery/shared/enums/connection-type'
import { Badge } from '@tamery/ui/components/badge'
import { useState } from 'react'

const EXAMPLES: Record<string, string> = {
  postgres:
    'postgresql://postgres.ref:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  mysql: 'mysql://app:s3cret@db.example.com:3306/shop?ssl=true',
  mssql:
    'Server=localhost,1433;Database=shop;User Id=sa;Password=s3cret;Encrypt=true',
  oracle: 'jdbc:oracle:thin:@//db.example.com:1521/FREEPDB1',
  clickhouse: 'clickhouse://default:s3cret@abc.clickhouse.cloud:9440/default',
  sqlite: 'sqlite:///Users/me/app.db',
  turso: 'libsql://my-db.turso.io?authToken=ey_token',
}

const FIX_LABELS: Record<GuessFix, string> = {
  'clickhouse-http': 'Native port switched to the HTTP port',
  'neon-direct': 'Neon pooler host switched to the direct host',
  'pooler-port': 'Pooler port switched to the session port',
  'prisma-options': 'Prisma-only options dropped',
  'ssh-forward': 'Routed through the SSH tunnel',
}

const FORMAT_LABELS: Record<string, string> = {
  ado: 'ADO.NET',
  cli: 'CLI command',
  env: '.env',
  host: 'host',
  jdbc: 'JDBC',
  json: 'JSON',
  'key-value': 'key-value',
  path: 'file path',
  ssh: 'SSH',
  url: 'URL',
}

const FIELDS = [
  ['Host', 'host'],
  ['Port', 'port'],
  ['User', 'user'],
  ['Password', 'password'],
  ['Database', 'database'],
  ['Options', 'options'],
] as const

const engineLabel = (parts: ConnectionGuess['parts']) => {
  if (parts.provider) {
    return providers[parts.provider].label
  }
  if (parts.type) {
    return connectionTypeLabels[parts.type]
  }
  return null
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground text-2xs tracking-wide uppercase">
      {label}
    </span>
    <span className="truncate font-mono text-sm" data-mask>
      {value || <span className="text-muted-foreground/50">empty</span>}
    </span>
  </div>
)

const ParsedOutput = ({ guess }: { guess: ConnectionGuess }) => {
  const label = engineLabel(guess.parts)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {label && <Badge>{label}</Badge>}
        <Badge variant="secondary">
          {FORMAT_LABELS[guess.format] ?? guess.format}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {FIELDS.filter(([, key]) =>
          key === 'options'
            ? guess.parts.options
            : guess.parts[key] !== undefined
        ).map(([label_, key]) => (
          <Field key={key} label={label_} value={guess.parts[key] ?? ''} />
        ))}
      </div>
      {guess.fixes.length > 0 && (
        <div className="border-border flex flex-col gap-1.5 border-t pt-3">
          <span className="text-muted-foreground text-2xs tracking-wide uppercase">
            Tamery adjusted
          </span>
          <div className="flex flex-col gap-1">
            {guess.fixes.map((fix) => (
              <span
                className="text-foreground flex items-center gap-2 text-sm"
                key={fix}
              >
                <span className="bg-primary/70 size-1 shrink-0 rounded-full" />
                {FIX_LABELS[fix]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const ConnectionPlayground = ({ engine }: { engine?: string }) => {
  const [value, setValue] = useState(
    (engine && EXAMPLES[engine]) || EXAMPLES.postgres || ''
  )
  const guess = guessConnection(value.trim(), true)

  return (
    <div className="bg-card ring-foreground/8 my-8 overflow-hidden rounded-2xl shadow-sm ring">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className="bg-primary size-1.5 rounded-full" />
        <span className="text-muted-foreground text-xs font-medium">
          Live connection parser
        </span>
      </div>
      <textarea
        aria-label="Connection string"
        className="border-border focus:bg-foreground/2 min-h-16 w-full resize-none border-t px-4 py-3 font-mono text-sm transition-colors outline-none"
        data-mask
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        value={value}
      />
      {guess ? (
        <ParsedOutput guess={guess} />
      ) : (
        <div className="text-muted-foreground p-4 text-sm">
          Paste a connection string and Tamery will read the fields out of it.
        </div>
      )}
    </div>
  )
}
