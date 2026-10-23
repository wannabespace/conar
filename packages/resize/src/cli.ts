#!/usr/bin/env bun
/* oxlint-disable no-console */
import path from 'node:path'
import process from 'node:process'

import { resizeImages } from './resize-images'
import type { ResizeConfig } from './types'

const root = process.cwd()
const { default: config }: { default: ResizeConfig } = await import(
  path.join(root, 'resize.config.ts')
)

const written = await resizeImages(config, root)
console.log(written.join('\n'))
