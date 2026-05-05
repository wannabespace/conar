import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'conar')
const CONFIG_FILE = path.join(CONFIG_DIR, 'cli.json')

interface CliConfig {
  token: string | null
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
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function getToken(): string | null {
  return readConfig().token
}

export function saveToken(token: string) {
  writeConfig({ ...readConfig(), token })
}

export function clearToken() {
  writeConfig({ ...readConfig(), token: null })
}
