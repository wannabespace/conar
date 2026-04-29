import type { SshConfig } from './ssh'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1))
  }
  return filePath
}

export function readSshKey(config: SshConfig): Buffer | undefined {
  if (config.privateKey) {
    return Buffer.from(config.privateKey, 'base64')
  }
  if (config.privateKeyPath) {
    return fs.readFileSync(expandHome(config.privateKeyPath))
  }
  return undefined
}
