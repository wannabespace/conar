import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { tryCatch } from '@conar/shared/utils/helpers'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'conar')
const CONFIG_FILE = path.join(CONFIG_DIR, 'cli.json')
export const CONAR_API_KEY_ENV = 'CONAR_API_KEY' as const

export type AuthMethod = 'session' | 'api-key'
export type AuthSource = 'config' | 'env'

interface CliConfig {
  token: string | null
  tokenType?: AuthMethod
}

export interface AuthState {
  token: string
  method: AuthMethod
  source: AuthSource
}

function readConfig(): CliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw) as CliConfig
  }
  catch {
    return { token: null }
  }
}

function writeConfig(config: CliConfig) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  tryCatch(() => fs.chmodSync(CONFIG_DIR, 0o700))

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })

  tryCatch(() => fs.chmodSync(CONFIG_FILE, 0o600))
}

function getEnvApiKey(): string | null {
  const token = process.env[CONAR_API_KEY_ENV]?.trim()
  return token || null
}

export function getAuthState(): AuthState | null {
  const envApiKey = getEnvApiKey()
  if (envApiKey) {
    return {
      token: envApiKey,
      method: 'api-key',
      source: 'env',
    }
  }

  const config = readConfig()

  if (!config.token) {
    return null
  }

  return {
    token: config.token,
    method: config.tokenType === 'api-key' ? 'api-key' : 'session',
    source: 'config',
  }
}

export function getToken(): string | null {
  return getAuthState()?.token ?? null
}

export function saveSessionToken(token: string) {
  writeConfig({ ...readConfig(), token, tokenType: 'session' })
}

export function saveApiKey(token: string) {
  writeConfig({ ...readConfig(), token, tokenType: 'api-key' })
}

export function clearStoredAuth() {
  writeConfig({ ...readConfig(), token: null, tokenType: undefined })
}
