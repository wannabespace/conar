#!/usr/bin/env bun
/* oxlint-disable no-console */
import path from 'node:path'
import process from 'node:process'

import { generateIcons } from './generate'
import type { IconsConfig } from './types'

const root = process.cwd()
const { iconsConfig }: { iconsConfig: IconsConfig<string, string> } =
  await import(path.join(root, 'icons.config.ts'))

const written = await generateIcons(iconsConfig, {
  root,
  sourceDir: process.argv.at(2) ?? null,
})
console.log(written.join('\n'))
