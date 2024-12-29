import { cp } from 'node:fs/promises'
import { join } from 'node:path'

async function copyDist() {
  try {
    const source = join(process.cwd(), 'out')
    const destination = join(process.cwd(), '..', 'desktop', 'dist')

    await cp(source, destination, { recursive: true })
    // eslint-disable-next-line no-console
    console.log('Successfully copied dist folder to app/dist')
  }
  catch (error) {
    console.error('Error copying dist folder:', error)
    process.exit(1)
  }
}

copyDist()
