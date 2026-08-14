import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { tryCatch } from '@tamery/shared/utils/helpers'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'tamery')
const CONFIG_FILE = path.join(CONFIG_DIR, 'cli.json')

interface CliConfig {
  token: string | null
}

const readConfig = (): CliConfig => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw) as CliConfig
  } catch {
    return { token: null }
  }
}

const writeConfig = (config: CliConfig) => {
  fs.mkdirSync(CONFIG_DIR, { mode: 0o700, recursive: true })
  tryCatch(() => fs.chmodSync(CONFIG_DIR, 0o700))

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })

  tryCatch(() => fs.chmodSync(CONFIG_FILE, 0o600))
}

export const getToken = (): string | null => readConfig().token

export const saveToken = (token: string) => {
  writeConfig({ ...readConfig(), token })
}

export const clearToken = () => {
  writeConfig({ ...readConfig(), token: null })
}
