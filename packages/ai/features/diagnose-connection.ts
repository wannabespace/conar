import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { TelemetryOptions } from 'ai'
import { generateText, Output } from 'ai'
import { type } from 'arktype'

import { models } from '../models/list'
import { section } from './prompt'

export const connectionDiagnosisInput = type({
  error: 'string <= 4000',
  hostKind: 'string <= 100',
  options: 'string <= 2000',
  passwordSet: 'boolean',
  port: 'string <= 10',
  runtime: "'desktop' | 'web'",
  sshEnabled: 'boolean',
  type: type.valueOf(ConnectionType),
  userSet: 'boolean',
})

const diagnosisOutput = type({
  explanation: 'string',
  /** Every key is required and nullable: an optional key has no JSON Schema form once `exactOptionalPropertyTypes` is off (`@tamery/shared/arktype-config`). */
  fix: type({
    database: 'string | null',
    label: 'string',
    options: 'string | null',
    port: 'string | null',
    sshEnabled: 'boolean | null',
    type: type.valueOf(ConnectionType).or('null'),
  }).or('null'),
  steps: 'string[]',
})

/** Applying a fix that carries `<redacted>` or `<database>` would overwrite the user's real value with it. */
const PLACEHOLDER = /[<>]/u

const INSTRUCTIONS = [
  "You help someone whose database client couldn't connect to their database.",
  'You get the engine, the settings with identifying values replaced by placeholders (<host>, <user>, <database>, <password>, <ssh-host>, <ssh-user>, <ip>, <redacted>), where the client runs, and the driver error.',
  'The desktop app connects directly and can open SSH tunnels; the web app connects through a proxy and cannot tunnel.',
  'Explain the most likely cause in one or two plain sentences, naming the provider or tool when the settings show one.',
  'Then give at most three short, concrete steps the person can take, most likely first.',
  'Propose a fix only when you are confident it resolves the error. A fix may change only: port, options (only the driver options to add or change, as a query string, e.g. sslmode=require for PostgreSQL, ssl=true for MySQL, encrypt=true or trustservercertificate=true for SQL Server; the client merges them into the existing ones), the engine type, database (empty for the default), or turning on an SSH tunnel (desktop only). Its label is a short imperative button text, e.g. "Use port 5432"; every field it does not change is null. Otherwise fix is null.',
  'Never ask for or repeat a password, never invent hostnames, and never put a placeholder or <redacted> in a fix.',
].join('\n')

export const diagnoseConnection = async (data: {
  input: typeof connectionDiagnosisInput.infer
  signal?: AbortSignal
  telemetry?: TelemetryOptions
}) => {
  const { error, ...settings } = data.input
  const { output } = await generateText({
    abortSignal: data.signal,
    instructions: INSTRUCTIONS,
    model: models.structured,
    output: Output.object({ schema: diagnosisOutput }),
    prompt: [
      section('SETTINGS', JSON.stringify(settings, null, 2)),
      section('ERROR', error),
    ].join('\n'),
    telemetry: data.telemetry,
  })
  const echoesPlaceholder = [output.fix?.options, output.fix?.database].some(
    (value) => value && PLACEHOLDER.test(value)
  )
  return echoesPlaceholder ? { ...output, fix: null } : output
}
