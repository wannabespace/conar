#!/usr/bin/env bun
/* oxlint-disable no-console */
import path from 'node:path'
import process from 'node:process'

import { generateIcons } from './generate'
import type { IconsConfig } from './types'

const root = process.cwd()
const { default: config }: { default: IconsConfig } = await import(
  path.join(root, 'icons.config.ts')
)

const written = await generateIcons(config, {
  importDir: process.argv.at(2) ?? null,
  root,
})
console.log(written.join('\n'))
