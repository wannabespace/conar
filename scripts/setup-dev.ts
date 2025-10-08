/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Recursively search for .env.example files in a directory
 * @param {string} dir - Directory to search in
 * @param {string[]} r - Array to collect found files
 */
function findEnvExampleFiles(dir: string, r: string[] = []) {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    if (['node_modules'].includes(item)) {
      continue
    }

    const fullPath = path.join(dir, item)
    const stats = fs.statSync(fullPath)

    if (stats.isDirectory()) {
      findEnvExampleFiles(fullPath, r)
    }
    else if (item === '.env.example') {
      r.push(fullPath)
    }
  }

  return r
}

/**
 * Copy .env.example to .env in the same directory
 * @param {string} envExamplePath - Path to .env.example file
 */
function createEnvFile(envExamplePath: string) {
  const envPath = path.join(path.dirname(envExamplePath), '.env')

  if (fs.existsSync(envPath)) {
    return false
  }

  try {
    fs.copyFileSync(envExamplePath, envPath)
    return true
  }
  catch (error) {
    console.error(`Failed to create .env file: ${envPath}`, error.message)
    return false
  }
}

/**
 * Main function to setup development environment
 */
function setupDev() {
  const appsDir = path.join(__dirname, '..', 'apps')

  if (!fs.existsSync(appsDir)) {
    console.error('Apps directory not found')
    process.exit(1)
  }

  const envExampleFiles = findEnvExampleFiles(appsDir)

  if (envExampleFiles.length === 0) {
    return
  }

  const created = envExampleFiles.map(createEnvFile)

  if (created.filter(Boolean).length > 0) {
    console.log(`Development environment setup complete!`)
  }
}

// Run the setup if this script is executed directly
if (__filename === process.argv[1]) {
  setupDev()
}

export { createEnvFile, findEnvExampleFiles, setupDev }
