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

const INSTRUCTIONS = [
  "You help someone whose database client couldn't connect to their database.",
  'You get the engine, the settings with identifying values replaced by placeholders (<host>, <user>, <database>, <ip>), where the client runs, and the driver error.',
  'The desktop app connects directly and can open SSH tunnels; the web app connects through a proxy and cannot tunnel.',
  'Explain the most likely cause in one or two plain sentences, naming the provider or tool when the settings show one.',
  'Then give at most three short, concrete steps the person can take, most likely first.',
  'Propose a fix only when you are confident it resolves the error. A fix may change only: port, options (the full driver query string, e.g. sslmode=require for PostgreSQL, ssl=true for MySQL, encrypt=true or trustServerCertificate=true for SQL Server), the engine type, database (empty for the default), or turning on an SSH tunnel (desktop only). Its label is a short imperative button text, e.g. "Use port 5432"; every field it does not change is null. Otherwise fix is null.',
  'Never ask for or repeat a password, and never invent hostnames.',
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
    model: models.filters,
    output: Output.object({ schema: diagnosisOutput }),
    prompt: [
      section('SETTINGS', JSON.stringify(settings, null, 2)),
      section('ERROR', error),
    ].join('\n'),
    telemetry: data.telemetry,
  })
  return output
}
